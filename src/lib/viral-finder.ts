/**
 * viral-finder.ts
 * 
 * Viral Moment Finder: Identifies high-energy, engaging segments in video.
 * Analyzes audio loudness, tempo, and energy to suggest clip highlights.
 * 
 * @module lib/viral-finder
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** A detected viral/highlight moment */
export interface ViralMoment {
    /** Start frame of the moment */
    startFrame: number;
    /** End frame of the moment */
    endFrame: number;
    /** Energy score (0-100, higher = more engaging) */
    energyScore: number;
    /** Type of moment detected */
    type: 'high_energy' | 'peak' | 'climax' | 'buildup';
    /** Human-readable label */
    label: string;
}

/** Analysis configuration */
export interface ViralFinderConfig {
    /** Minimum energy percentile to consider (0-100) */
    minEnergyPercentile: number;
    /** Minimum moment duration in milliseconds */
    minDurationMs: number;
    /** Maximum moment duration in milliseconds */
    maxDurationMs: number;
    /** Frames per second */
    fps: number;
    /** Number of top moments to return */
    topMoments: number;
}

/** Energy data point */
interface EnergyPoint {
    frame: number;
    energy: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/** Default viral finder configuration */
export const DEFAULT_VIRAL_CONFIG: ViralFinderConfig = {
    minEnergyPercentile: 70,
    minDurationMs: 3000,   // 3 seconds
    maxDurationMs: 60000,  // 60 seconds
    fps: 30,
    topMoments: 5
};

/** Analysis window in samples */
const ANALYSIS_WINDOW = 2048;

// ============================================================
// ENERGY ANALYSIS
// ============================================================

/**
 * Calculates RMS energy for audio samples.
 * 
 * @param samples - Float32Array of audio samples
 * @param start - Start index
 * @param length - Window length
 * @returns RMS energy value (0-1)
 */
function calculateEnergy(samples: Float32Array, start: number, length: number): number {
    let sum = 0;
    const end = Math.min(start + length, samples.length);
    const count = end - start;

    if (count <= 0) return 0;

    for (let i = start; i < end; i++) {
        sum += samples[i] * samples[i];
    }

    return Math.sqrt(sum / count);
}

/**
 * Analyzes audio buffer and extracts energy curve.
 * 
 * @param audioBuffer - Decoded audio from Web Audio API
 * @param fps - Video frames per second
 * @returns Array of energy points per frame
 */
export function analyzeEnergyCurve(
    audioBuffer: AudioBuffer,
    fps: number = 30
): EnergyPoint[] {
    const samples = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const samplesPerFrame = Math.floor(sampleRate / fps);

    const energyPoints: EnergyPoint[] = [];

    let frame = 0;
    for (let i = 0; i < samples.length; i += samplesPerFrame) {
        const energy = calculateEnergy(samples, i, ANALYSIS_WINDOW);
        energyPoints.push({ frame, energy });
        frame++;
    }

    return energyPoints;
}

/**
 * Calculates the Nth percentile of energy values.
 * 
 * @param energyPoints - Array of energy points
 * @param percentile - Percentile to calculate (0-100)
 * @returns Energy value at that percentile
 */
function getEnergyPercentile(energyPoints: EnergyPoint[], percentile: number): number {
    const sorted = [...energyPoints].sort((a, b) => a.energy - b.energy);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)].energy;
}

// ============================================================
// PEAK DETECTION
// ============================================================

/**
 * Detects local peaks in the energy curve.
 * A peak is a point higher than its neighbors within a window.
 * 
 * @param energyPoints - Energy curve
 * @param windowSize - Frames to look left/right for comparison
 * @returns Indices of peak frames
 */
export function detectPeaks(
    energyPoints: EnergyPoint[],
    windowSize: number = 15
): number[] {
    const peaks: number[] = [];

    for (let i = windowSize; i < energyPoints.length - windowSize; i++) {
        const current = energyPoints[i].energy;
        let isPeak = true;

        // Check if current is higher than all neighbors
        for (let j = i - windowSize; j <= i + windowSize; j++) {
            if (j !== i && energyPoints[j].energy >= current) {
                isPeak = false;
                break;
            }
        }

        if (isPeak) {
            peaks.push(i);
        }
    }

    return peaks;
}

// ============================================================
// MOMENT IDENTIFICATION
// ============================================================

/**
 * Identifies viral moments based on energy analysis.
 * 
 * Algorithm:
 * 1. Calculate energy curve from audio
 * 2. Find energy threshold (e.g., 70th percentile)
 * 3. Find runs of high-energy frames
 * 4. Score and rank moments
 * 
 * @param energyPoints - Analyzed energy curve
 * @param config - Finder configuration
 * @returns Array of detected viral moments
 */
export function identifyMoments(
    energyPoints: EnergyPoint[],
    config: ViralFinderConfig
): ViralMoment[] {
    const threshold = getEnergyPercentile(energyPoints, config.minEnergyPercentile);
    const minFrames = Math.ceil((config.minDurationMs / 1000) * config.fps);
    const maxFrames = Math.ceil((config.maxDurationMs / 1000) * config.fps);

    const moments: ViralMoment[] = [];
    let momentStart: number | null = null;
    let momentPeakEnergy = 0;

    for (let i = 0; i < energyPoints.length; i++) {
        const { energy } = energyPoints[i];

        if (energy >= threshold) {
            // High energy frame
            if (momentStart === null) {
                momentStart = i;
                momentPeakEnergy = energy;
            } else {
                momentPeakEnergy = Math.max(momentPeakEnergy, energy);
            }
        } else {
            // Low energy frame - check if we were in a moment
            if (momentStart !== null) {
                const duration = i - momentStart;

                if (duration >= minFrames && duration <= maxFrames) {
                    // Valid moment
                    const energyScore = Math.round((momentPeakEnergy / 1) * 100);
                    const type = categorizeNMoment(energyScore, duration, minFrames);

                    moments.push({
                        startFrame: momentStart,
                        endFrame: i,
                        energyScore: Math.min(100, energyScore),
                        type,
                        label: generateLabel(type, energyScore)
                    });
                }

                momentStart = null;
                momentPeakEnergy = 0;
            }
        }
    }

    // Handle moment at end of file
    if (momentStart !== null) {
        const duration = energyPoints.length - momentStart;
        if (duration >= minFrames && duration <= maxFrames) {
            const energyScore = Math.round((momentPeakEnergy / 1) * 100);
            const type = categorizeNMoment(energyScore, duration, minFrames);

            moments.push({
                startFrame: momentStart,
                endFrame: energyPoints.length,
                energyScore: Math.min(100, energyScore),
                type,
                label: generateLabel(type, energyScore)
            });
        }
    }

    // Sort by energy score and return top moments
    return moments
        .sort((a, b) => b.energyScore - a.energyScore)
        .slice(0, config.topMoments);
}

/**
 * Categorizes a moment based on its characteristics.
 */
function categorizeNMoment(
    energyScore: number,
    duration: number,
    minFrames: number
): ViralMoment['type'] {
    if (energyScore >= 90) return 'climax';
    if (energyScore >= 75) return 'peak';
    if (duration < minFrames * 2) return 'buildup';
    return 'high_energy';
}

/**
 * Generates a human-readable label for a moment.
 */
function generateLabel(type: ViralMoment['type'], score: number): string {
    const labels: Record<ViralMoment['type'], string> = {
        climax: '🔥 Climax',
        peak: '⚡ Peak Energy',
        buildup: '📈 Buildup',
        high_energy: '💪 High Energy'
    };
    return `${labels[type]} (${score}%)`;
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Finds viral moments in an audio buffer.
 * 
 * @param audioBuffer - Decoded audio from Web Audio API
 * @param options - Optional configuration overrides
 * @returns Array of detected viral moments, sorted by energy score
 * 
 * @example
 * const buffer = await loadAudioBuffer(videoUrl);
 * const moments = findViralMoments(buffer, { topMoments: 3 });
 * // Returns top 3 most energetic moments in the video
 */
export function findViralMoments(
    audioBuffer: AudioBuffer,
    options: Partial<ViralFinderConfig> = {}
): ViralMoment[] {
    const config = { ...DEFAULT_VIRAL_CONFIG, ...options };

    // Analyze energy curve
    const energyCurve = analyzeEnergyCurve(audioBuffer, config.fps);

    // Find and return moments
    return identifyMoments(energyCurve, config);
}

/**
 * Gets time positions (in seconds) for a viral moment.
 * Useful for UI display.
 * 
 * @param moment - Viral moment
 * @param fps - Frames per second
 * @returns Start and end times in seconds
 */
export function getMomentTimeRange(
    moment: ViralMoment,
    fps: number
): { startTime: number; endTime: number; duration: number } {
    const startTime = moment.startFrame / fps;
    const endTime = moment.endFrame / fps;
    return {
        startTime,
        endTime,
        duration: endTime - startTime
    };
}
