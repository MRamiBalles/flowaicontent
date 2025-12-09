/**
 * audio-ducking.ts
 * 
 * Auto-ducking: automatically lowers music volume when voice is detected.
 * Uses amplitude analysis to identify speech segments.
 * 
 * @module lib/audio-ducking
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Ducking parameters */
export interface DuckingConfig {
    /** Amount to reduce music volume in dB (default: -15) */
    duckAmountDb: number;
    /** Attack time in milliseconds (fade down) */
    attackMs: number;
    /** Release time in milliseconds (fade up) */
    releaseMs: number;
    /** Voice detection threshold in dB */
    voiceThresholdDb: number;
    /** Minimum voice duration to trigger ducking (ms) */
    minVoiceDurationMs: number;
}

/** A segment where ducking should be applied */
export interface DuckingSegment {
    /** Start frame of ducking region */
    startFrame: number;
    /** End frame of ducking region */
    endFrame: number;
    /** Target volume multiplier (0-1) */
    targetVolume: number;
}

/** Volume envelope point for smooth transitions */
export interface VolumeEnvelopePoint {
    frame: number;
    volume: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/** Default ducking configuration */
export const DEFAULT_DUCKING_CONFIG: DuckingConfig = {
    duckAmountDb: -15,
    attackMs: 100,
    releaseMs: 200,
    voiceThresholdDb: -30,
    minVoiceDurationMs: 100
};

/** Analysis window size in samples */
const ANALYSIS_WINDOW = 1024;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Converts decibels to linear amplitude.
 * 
 * @param db - Decibel value
 * @returns Linear amplitude (0-1 range for negative dB)
 */
function dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
}

/**
 * Converts linear amplitude to decibels.
 * 
 * @param linear - Linear amplitude (0-1)
 * @returns Decibel value (negative for values < 1)
 */
function linearToDb(linear: number): number {
    if (linear <= 0) return -Infinity;
    return 20 * Math.log10(linear);
}

/**
 * Calculates RMS amplitude of audio samples.
 * 
 * @param samples - Float32Array of audio samples
 * @param start - Start index
 * @param length - Number of samples
 * @returns RMS value (0-1)
 */
function calculateRms(samples: Float32Array, start: number, length: number): number {
    let sum = 0;
    const end = Math.min(start + length, samples.length);
    const count = end - start;

    if (count <= 0) return 0;

    for (let i = start; i < end; i++) {
        sum += samples[i] * samples[i];
    }

    return Math.sqrt(sum / count);
}

// ============================================================
// MAIN FUNCTIONS
// ============================================================

/**
 * Detects voice segments in an audio buffer.
 * Returns frame ranges where voice is present.
 * 
 * @param audioBuffer - Decoded audio from Web Audio API
 * @param config - Detection parameters
 * @param fps - Frames per second for conversion
 * @returns Array of frame ranges where voice is detected
 */
export function detectVoiceSegments(
    audioBuffer: AudioBuffer,
    config: Partial<DuckingConfig> = {},
    fps: number = 30
): { startFrame: number; endFrame: number }[] {
    const {
        voiceThresholdDb = DEFAULT_DUCKING_CONFIG.voiceThresholdDb,
        minVoiceDurationMs = DEFAULT_DUCKING_CONFIG.minVoiceDurationMs
    } = config;

    const samples = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const minDurationSamples = Math.floor((minVoiceDurationMs / 1000) * sampleRate);

    const voiceSegments: { startFrame: number; endFrame: number }[] = [];
    let voiceStart: number | null = null;

    for (let i = 0; i < samples.length; i += ANALYSIS_WINDOW) {
        const rms = calculateRms(samples, i, ANALYSIS_WINDOW);
        const db = linearToDb(rms);

        if (db > voiceThresholdDb) {
            // Voice detected
            if (voiceStart === null) {
                voiceStart = i;
            }
        } else {
            // No voice
            if (voiceStart !== null) {
                const duration = i - voiceStart;
                if (duration >= minDurationSamples) {
                    voiceSegments.push({
                        startFrame: Math.floor((voiceStart / sampleRate) * fps),
                        endFrame: Math.ceil((i / sampleRate) * fps)
                    });
                }
                voiceStart = null;
            }
        }
    }

    // Handle voice at end of file
    if (voiceStart !== null) {
        const duration = samples.length - voiceStart;
        if (duration >= minDurationSamples) {
            voiceSegments.push({
                startFrame: Math.floor((voiceStart / sampleRate) * fps),
                endFrame: Math.ceil((samples.length / sampleRate) * fps)
            });
        }
    }

    return voiceSegments;
}

/**
 * Generates ducking segments from detected voice regions.
 * Merges overlapping regions and adds attack/release padding.
 * 
 * @param voiceSegments - Detected voice frame ranges
 * @param config - Ducking parameters
 * @param fps - Frames per second
 * @returns Ducking segments with target volumes
 */
export function generateDuckingSegments(
    voiceSegments: { startFrame: number; endFrame: number }[],
    config: Partial<DuckingConfig> = {},
    fps: number = 30
): DuckingSegment[] {
    const {
        duckAmountDb = DEFAULT_DUCKING_CONFIG.duckAmountDb,
        attackMs = DEFAULT_DUCKING_CONFIG.attackMs,
        releaseMs = DEFAULT_DUCKING_CONFIG.releaseMs
    } = config;

    const attackFrames = Math.ceil((attackMs / 1000) * fps);
    const releaseFrames = Math.ceil((releaseMs / 1000) * fps);
    const targetVolume = dbToLinear(duckAmountDb);

    // Sort voice segments by start frame
    const sorted = [...voiceSegments].sort((a, b) => a.startFrame - b.startFrame);

    // Merge overlapping segments
    const merged: { startFrame: number; endFrame: number }[] = [];
    for (const segment of sorted) {
        if (merged.length === 0) {
            merged.push({ ...segment });
        } else {
            const last = merged[merged.length - 1];
            // Merge if segments are within release time of each other
            if (segment.startFrame <= last.endFrame + releaseFrames) {
                last.endFrame = Math.max(last.endFrame, segment.endFrame);
            } else {
                merged.push({ ...segment });
            }
        }
    }

    // Create ducking segments with attack/release padding
    return merged.map(segment => ({
        startFrame: Math.max(0, segment.startFrame - attackFrames),
        endFrame: segment.endFrame + releaseFrames,
        targetVolume
    }));
}

/**
 * Generates a volume envelope curve for smooth ducking.
 * Creates attack and release ramps.
 * 
 * @param duckingSegments - Segments to duck
 * @param totalFrames - Total duration in frames
 * @param config - Ducking parameters
 * @param fps - Frames per second
 * @returns Array of volume envelope points
 */
export function generateVolumeEnvelope(
    duckingSegments: DuckingSegment[],
    totalFrames: number,
    config: Partial<DuckingConfig> = {},
    fps: number = 30
): VolumeEnvelopePoint[] {
    const {
        attackMs = DEFAULT_DUCKING_CONFIG.attackMs,
        releaseMs = DEFAULT_DUCKING_CONFIG.releaseMs
    } = config;

    const attackFrames = Math.ceil((attackMs / 1000) * fps);
    const releaseFrames = Math.ceil((releaseMs / 1000) * fps);

    const envelope: VolumeEnvelopePoint[] = [];

    // Start at full volume
    envelope.push({ frame: 0, volume: 1 });

    for (const segment of duckingSegments) {
        // Attack ramp (fade down)
        envelope.push({ frame: segment.startFrame, volume: 1 });
        envelope.push({
            frame: segment.startFrame + attackFrames,
            volume: segment.targetVolume
        });

        // Hold at ducked volume
        envelope.push({
            frame: segment.endFrame - releaseFrames,
            volume: segment.targetVolume
        });

        // Release ramp (fade up)
        envelope.push({ frame: segment.endFrame, volume: 1 });
    }

    // Ensure we end at full volume
    envelope.push({ frame: totalFrames, volume: 1 });

    // Sort and deduplicate
    return envelope
        .sort((a, b) => a.frame - b.frame)
        .filter((point, i, arr) =>
            i === 0 || point.frame !== arr[i - 1].frame
        );
}

/**
 * Gets the volume multiplier at a specific frame from the envelope.
 * Linearly interpolates between envelope points.
 * 
 * @param envelope - Volume envelope points
 * @param frame - Target frame
 * @returns Volume multiplier (0-1)
 */
export function getVolumeAtFrame(
    envelope: VolumeEnvelopePoint[],
    frame: number
): number {
    if (envelope.length === 0) return 1;
    if (frame <= envelope[0].frame) return envelope[0].volume;
    if (frame >= envelope[envelope.length - 1].frame) {
        return envelope[envelope.length - 1].volume;
    }

    // Find surrounding points
    let prev = envelope[0];
    let next = envelope[envelope.length - 1];

    for (let i = 0; i < envelope.length - 1; i++) {
        if (frame >= envelope[i].frame && frame <= envelope[i + 1].frame) {
            prev = envelope[i];
            next = envelope[i + 1];
            break;
        }
    }

    // Linear interpolation
    const t = (frame - prev.frame) / (next.frame - prev.frame);
    return prev.volume + (next.volume - prev.volume) * t;
}
