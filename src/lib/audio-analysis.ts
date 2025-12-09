/**
 * audio-analysis.ts
 * 
 * Client-side audio analysis utilities for the Video Editor.
 * Uses Web Audio API to analyze audio waveforms without server round-trips.
 * 
 * @module lib/audio-analysis
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * Represents a silent segment in the audio.
 * Frames are calculated at the project's FPS (default 30).
 */
export interface SilenceRange {
    /** Start position in frames */
    startFrame: number;
    /** End position in frames */
    endFrame: number;
    /** Duration in milliseconds */
    durationMs: number;
}

/**
 * Options for silence detection algorithm.
 */
export interface SilenceDetectionOptions {
    /** Silence threshold in decibels (default: -40) */
    thresholdDb: number;
    /** Minimum silence duration in milliseconds (default: 500) */
    minDurationMs: number;
    /** Frames per second for conversion (default: 30) */
    fps: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/** Default silence threshold in decibels */
const DEFAULT_THRESHOLD_DB = -40;

/** Default minimum silence duration in milliseconds */
const DEFAULT_MIN_DURATION_MS = 500;

/** Default frames per second */
const DEFAULT_FPS = 30;

/** Window size for RMS calculation in samples */
const ANALYSIS_WINDOW_SIZE = 2048;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Converts linear amplitude to decibels.
 * 
 * @param amplitude - Linear amplitude value (0-1)
 * @returns Amplitude in decibels (negative values, -Infinity for 0)
 */
function amplitudeToDb(amplitude: number): number {
    if (amplitude <= 0) return -Infinity;
    return 20 * Math.log10(amplitude);
}

/**
 * Calculates root mean square (RMS) of a sample window.
 * RMS is a better measure of perceived loudness than peak amplitude.
 * 
 * @param samples - Float32Array of audio samples
 * @param start - Start index in the array
 * @param length - Number of samples to analyze
 * @returns RMS value (0-1 range)
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
 * Fetches and decodes an audio file from URL.
 * 
 * @param audioUrl - URL to the audio file (supports mp3, wav, etc.)
 * @returns Decoded AudioBuffer ready for analysis
 * @throws Error if fetch or decode fails
 */
export async function loadAudioBuffer(audioUrl: string): Promise<AudioBuffer> {
    const audioContext = new AudioContext();

    try {
        const response = await fetch(audioUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        return audioBuffer;
    } finally {
        // Clean up audio context when done
        await audioContext.close();
    }
}

/**
 * Detects silent segments in an audio buffer.
 * 
 * Algorithm:
 * 1. Divide audio into analysis windows
 * 2. Calculate RMS amplitude for each window
 * 3. Convert to decibels
 * 4. Identify runs of windows below threshold
 * 5. Filter by minimum duration
 * 6. Convert to frame ranges
 * 
 * @param audioBuffer - Decoded audio buffer from Web Audio API
 * @param options - Detection parameters (threshold, min duration, fps)
 * @returns Array of silent segment ranges with frame positions
 * 
 * @example
 * const buffer = await loadAudioBuffer(clipUrl);
 * const silences = detectSilence(buffer, { thresholdDb: -40, minDurationMs: 500, fps: 30 });
 * // silences: [{ startFrame: 90, endFrame: 150, durationMs: 2000 }]
 */
export function detectSilence(
    audioBuffer: AudioBuffer,
    options: Partial<SilenceDetectionOptions> = {}
): SilenceRange[] {
    const {
        thresholdDb = DEFAULT_THRESHOLD_DB,
        minDurationMs = DEFAULT_MIN_DURATION_MS,
        fps = DEFAULT_FPS
    } = options;

    // Get first channel data (mono analysis is sufficient for silence detection)
    const samples = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Calculate minimum samples that constitute a "silent" segment
    const minSilenceSamples = Math.floor((minDurationMs / 1000) * sampleRate);

    // Track silent regions
    const silentRegions: { startSample: number; endSample: number }[] = [];
    let silenceStart: number | null = null;

    // Analyze in windows
    for (let i = 0; i < samples.length; i += ANALYSIS_WINDOW_SIZE) {
        const rms = calculateRms(samples, i, ANALYSIS_WINDOW_SIZE);
        const db = amplitudeToDb(rms);

        if (db < thresholdDb) {
            // Current window is silent
            if (silenceStart === null) {
                silenceStart = i;
            }
        } else {
            // Current window has audio
            if (silenceStart !== null) {
                const silenceEnd = i;
                const silenceDuration = silenceEnd - silenceStart;

                // Only record if meets minimum duration
                if (silenceDuration >= minSilenceSamples) {
                    silentRegions.push({
                        startSample: silenceStart,
                        endSample: silenceEnd
                    });
                }
                silenceStart = null;
            }
        }
    }

    // Handle silence at end of file
    if (silenceStart !== null) {
        const silenceDuration = samples.length - silenceStart;
        if (silenceDuration >= minSilenceSamples) {
            silentRegions.push({
                startSample: silenceStart,
                endSample: samples.length
            });
        }
    }

    // Convert sample positions to frame positions
    return silentRegions.map(region => {
        const startSeconds = region.startSample / sampleRate;
        const endSeconds = region.endSample / sampleRate;
        const durationMs = (endSeconds - startSeconds) * 1000;

        return {
            startFrame: Math.floor(startSeconds * fps),
            endFrame: Math.ceil(endSeconds * fps),
            durationMs: Math.round(durationMs)
        };
    });
}

/**
 * Generates cut operations from silence ranges.
 * Returns the ranges to KEEP (inverse of silences).
 * 
 * @param silences - Array of silence ranges to remove
 * @param totalFrames - Total duration of the clip in frames
 * @returns Array of ranges to keep (non-silent segments)
 */
export function getKeepRanges(
    silences: SilenceRange[],
    totalFrames: number
): { startFrame: number; endFrame: number }[] {
    if (silences.length === 0) {
        return [{ startFrame: 0, endFrame: totalFrames }];
    }

    // Sort silences by start frame
    const sorted = [...silences].sort((a, b) => a.startFrame - b.startFrame);

    const keepRanges: { startFrame: number; endFrame: number }[] = [];
    let currentPosition = 0;

    for (const silence of sorted) {
        // Add segment before this silence (if any)
        if (silence.startFrame > currentPosition) {
            keepRanges.push({
                startFrame: currentPosition,
                endFrame: silence.startFrame
            });
        }
        currentPosition = silence.endFrame;
    }

    // Add remaining segment after last silence
    if (currentPosition < totalFrames) {
        keepRanges.push({
            startFrame: currentPosition,
            endFrame: totalFrames
        });
    }

    return keepRanges;
}
