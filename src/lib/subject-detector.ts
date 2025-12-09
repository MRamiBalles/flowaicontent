/**
 * subject-detector.ts
 * 
 * TensorFlow.js COCO-SSD model for real-time subject detection.
 * Used by auto-reframe.ts for accurate person/object tracking.
 * 
 * Features:
 * - Lazy loading: Model only loads on first use (~5MB)
 * - Frame extraction: Captures video frames at intervals
 * - Detection caching: Avoids redundant inference
 * 
 * @module lib/subject-detector
 */

import type { BoundingBox } from './auto-reframe';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Detection result from COCO-SSD */
interface DetectionResult {
    bbox: [number, number, number, number]; // [x, y, width, height]
    class: string;
    score: number;
}

/** COCO-SSD model interface */
interface CocoSsdModel {
    detect: (input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => Promise<DetectionResult[]>;
}

/** Model loading state */
interface ModelState {
    model: CocoSsdModel | null;
    loading: boolean;
    error: string | null;
}

/** Detection options */
export interface DetectionOptions {
    /** Minimum confidence threshold (0-1) */
    minConfidence: number;
    /** Target classes to detect (default: ['person']) */
    targetClasses: string[];
    /** Whether to prioritize largest detection */
    prioritizeLargest: boolean;
}

// ============================================================
// MODULE STATE
// ============================================================

const state: ModelState = {
    model: null,
    loading: false,
    error: null
};

/** Default detection options */
export const DEFAULT_DETECTION_OPTIONS: DetectionOptions = {
    minConfidence: 0.5,
    targetClasses: ['person', 'cat', 'dog', 'bird'],
    prioritizeLargest: true
};

// ============================================================
// MODEL LOADING
// ============================================================

/**
 * Dynamically imports TensorFlow.js and COCO-SSD.
 * Uses lazy loading to minimize initial bundle size.
 * 
 * @returns Promise resolving to COCO-SSD model
 * @throws Error if model fails to load
 */
export async function loadDetectionModel(): Promise<void> {
    if (state.model) return;
    if (state.loading) {
        // Wait for existing load to complete
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (!state.loading) {
                    clearInterval(checkInterval);
                    if (state.error) reject(new Error(state.error));
                    else resolve();
                }
            }, 100);
        });
    }

    state.loading = true;
    state.error = null;

    try {
        // Dynamic imports for code splitting
        const tf = await import('@tensorflow/tfjs');
        const cocoSsd = await import('@tensorflow-models/coco-ssd');

        // Set backend (WebGL preferred for performance)
        await tf.setBackend('webgl');
        await tf.ready();

        console.log('[SubjectDetector] TensorFlow.js backend:', tf.getBackend());

        // Load COCO-SSD model
        state.model = await cocoSsd.load({
            base: 'lite_mobilenet_v2' // Faster, smaller model variant
        });

        console.log('[SubjectDetector] COCO-SSD model loaded');
    } catch (error) {
        state.error = error instanceof Error ? error.message : 'Failed to load model';
        console.error('[SubjectDetector] Model load failed:', error);
        throw error;
    } finally {
        state.loading = false;
    }
}

/**
 * Gets current model loading status.
 * 
 * @returns Model state information
 */
export function getModelStatus(): { loaded: boolean; loading: boolean; error: string | null } {
    return {
        loaded: state.model !== null,
        loading: state.loading,
        error: state.error
    };
}

// ============================================================
// SUBJECT DETECTION
// ============================================================

/**
 * Detects subjects in a video frame using COCO-SSD.
 * 
 * @param video - HTML video element positioned at target frame
 * @param options - Detection options
 * @returns Bounding box of primary subject, or null if none detected
 * 
 * @example
 * const video = document.querySelector('video');
 * video.currentTime = 5.0; // Seek to 5 seconds
 * await new Promise(r => video.onseeked = r);
 * const box = await detectSubjectML(video);
 */
export async function detectSubjectML(
    video: HTMLVideoElement,
    options: Partial<DetectionOptions> = {}
): Promise<BoundingBox | null> {
    const opts = { ...DEFAULT_DETECTION_OPTIONS, ...options };

    // Ensure model is loaded
    if (!state.model) {
        await loadDetectionModel();
    }

    if (!state.model) {
        console.warn('[SubjectDetector] Model not available');
        return null;
    }

    try {
        // Run inference
        const detections = await state.model.detect(video);

        // Filter by target classes and confidence
        const filtered = detections.filter(
            d => opts.targetClasses.includes(d.class) && d.score >= opts.minConfidence
        );

        if (filtered.length === 0) {
            return null;
        }

        // Select primary detection
        let primary: DetectionResult;
        if (opts.prioritizeLargest) {
            // Pick largest by area
            primary = filtered.reduce((a, b) => {
                const areaA = a.bbox[2] * a.bbox[3];
                const areaB = b.bbox[2] * b.bbox[3];
                return areaB > areaA ? b : a;
            });
        } else {
            // Pick highest confidence
            primary = filtered.reduce((a, b) => b.score > a.score ? b : a);
        }

        // Convert to normalized BoundingBox (0-1 range)
        const [x, y, width, height] = primary.bbox;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        return {
            x: x / videoWidth,
            y: y / videoHeight,
            width: width / videoWidth,
            height: height / videoHeight,
            confidence: primary.score
        };
    } catch (error) {
        console.error('[SubjectDetector] Detection failed:', error);
        return null;
    }
}

// ============================================================
// BATCH FRAME ANALYSIS
// ============================================================

/**
 * Analyzes multiple frames of a video for subject positions.
 * Used by auto-reframe to generate position keyframes.
 * 
 * @param videoUrl - URL of video to analyze
 * @param totalFrames - Total frames in video
 * @param fps - Frames per second
 * @param keyframeInterval - Frames between samples
 * @param onProgress - Progress callback (0-1)
 * @returns Array of detected bounding boxes per sampled frame
 */
export async function analyzeVideoFrames(
    videoUrl: string,
    totalFrames: number,
    fps: number,
    keyframeInterval: number = 15,
    onProgress?: (progress: number) => void
): Promise<Map<number, BoundingBox | null>> {
    const results = new Map<number, BoundingBox | null>();

    // Ensure model is loaded first
    await loadDetectionModel();

    // Create offscreen video element
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.src = videoUrl;

    await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
    });

    const framesToAnalyze: number[] = [];
    for (let frame = 0; frame <= totalFrames; frame += keyframeInterval) {
        framesToAnalyze.push(frame);
    }

    let processed = 0;
    for (const frame of framesToAnalyze) {
        const timeInSeconds = frame / fps;
        video.currentTime = timeInSeconds;

        // Wait for seek to complete
        await new Promise<void>(resolve => {
            video.onseeked = () => resolve();
        });

        // Detect subject at this frame
        const detection = await detectSubjectML(video);
        results.set(frame, detection);

        processed++;
        if (onProgress) {
            onProgress(processed / framesToAnalyze.length);
        }
    }

    // Cleanup
    video.src = '';
    video.remove();

    return results;
}

/**
 * Interpolates between detected bounding boxes for smooth tracking.
 * Fills gaps where no detection occurred.
 * 
 * @param detections - Map of frame -> detection
 * @param totalFrames - Total frames in video
 * @returns Map with interpolated values for all keyframe positions
 */
export function interpolateDetections(
    detections: Map<number, BoundingBox | null>,
    totalFrames: number
): Map<number, BoundingBox> {
    const result = new Map<number, BoundingBox>();
    const frames = Array.from(detections.keys()).sort((a, b) => a - b);

    // Default center box for fallback
    const defaultBox: BoundingBox = {
        x: 0.35,
        y: 0.15,
        width: 0.3,
        height: 0.7,
        confidence: 0.5
    };

    // First pass: fill in actual detections
    for (const frame of frames) {
        const detection = detections.get(frame);
        if (detection) {
            result.set(frame, detection);
        }
    }

    // Second pass: interpolate missing frames
    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        if (result.has(frame)) continue;

        // Find nearest frames with detections
        let prevFrame: number | null = null;
        let nextFrame: number | null = null;

        for (let j = i - 1; j >= 0; j--) {
            if (result.has(frames[j])) {
                prevFrame = frames[j];
                break;
            }
        }

        for (let j = i + 1; j < frames.length; j++) {
            if (result.has(frames[j])) {
                nextFrame = frames[j];
                break;
            }
        }

        if (prevFrame !== null && nextFrame !== null) {
            // Interpolate between prev and next
            const prevBox = result.get(prevFrame)!;
            const nextBox = result.get(nextFrame)!;
            const t = (frame - prevFrame) / (nextFrame - prevFrame);

            result.set(frame, {
                x: prevBox.x + (nextBox.x - prevBox.x) * t,
                y: prevBox.y + (nextBox.y - prevBox.y) * t,
                width: prevBox.width + (nextBox.width - prevBox.width) * t,
                height: prevBox.height + (nextBox.height - prevBox.height) * t,
                confidence: prevBox.confidence + (nextBox.confidence - prevBox.confidence) * t
            });
        } else if (prevFrame !== null) {
            // Use previous detection
            result.set(frame, result.get(prevFrame)!);
        } else if (nextFrame !== null) {
            // Use next detection
            result.set(frame, result.get(nextFrame)!);
        } else {
            // No detections at all, use default
            result.set(frame, defaultBox);
        }
    }

    return result;
}
