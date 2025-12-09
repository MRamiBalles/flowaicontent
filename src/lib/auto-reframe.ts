/**
 * auto-reframe.ts
 * 
 * Auto-reframe engine for converting horizontal (16:9) video to vertical (9:16).
 * Detects subject position and calculates optimal crop rectangles.
 * Supports both simulated detection (fast) and ML-based COCO-SSD detection (accurate).
 * 
 * @module lib/auto-reframe
 */

import { analyzeVideoFrames, interpolateDetections, getModelStatus } from './subject-detector';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Detection mode for subject tracking */
export type DetectionMode = 'simulated' | 'ml';

/** Bounding box for detected subject */
export interface BoundingBox {
    /** Left edge (0-1 normalized) */
    x: number;
    /** Top edge (0-1 normalized) */
    y: number;
    /** Width (0-1 normalized) */
    width: number;
    /** Height (0-1 normalized) */
    height: number;
    /** Detection confidence (0-1) */
    confidence: number;
}

/** Crop rectangle for a frame */
export interface CropRect {
    /** Left offset in pixels */
    x: number;
    /** Top offset in pixels */
    y: number;
    /** Crop width in pixels */
    width: number;
    /** Crop height in pixels */
    height: number;
}

/** Auto-reframe configuration */
export interface ReframeConfig {
    /** Source width in pixels */
    sourceWidth: number;
    /** Source height in pixels */
    sourceHeight: number;
    /** Target aspect ratio (width/height, e.g., 9/16 = 0.5625) */
    targetAspectRatio: number;
    /** Smoothing factor for camera movement (0-1, higher = smoother) */
    smoothing: number;
    /** Padding around subject (0-1, percentage of frame) */
    subjectPadding: number;
}

/** Keyframe with position for smooth pan */
export interface PositionKeyframe {
    frame: number;
    cropX: number;
    cropY: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/** Common aspect ratios */
export const ASPECT_RATIOS = {
    LANDSCAPE_16_9: 16 / 9,
    PORTRAIT_9_16: 9 / 16,
    SQUARE_1_1: 1,
    PORTRAIT_4_5: 4 / 5
} as const;

/** Default reframe configuration */
export const DEFAULT_REFRAME_CONFIG: Omit<ReframeConfig, 'sourceWidth' | 'sourceHeight'> = {
    targetAspectRatio: ASPECT_RATIOS.PORTRAIT_9_16,
    smoothing: 0.8,
    subjectPadding: 0.1
};

// ============================================================
// SUBJECT DETECTION (Simplified)
// ============================================================

/**
 * Simulates subject detection for a frame.
 * In production, this would use ML models (TensorFlow.js, ONNX, etc.)
 * 
 * For now, uses rule of thirds heuristic:
 * - Assumes subject is roughly in center-left or center-right
 * - Returns a placeholder bounding box
 * 
 * @param frameData - Image data (unused in simulation)
 * @param frameIndex - Current frame number
 * @returns Detected bounding box or null
 */
export function detectSubject(
    frameData: ImageData | null,
    frameIndex: number
): BoundingBox | null {
    // Simulate subject movement with sine wave
    // In production, this would be ML inference
    const movement = Math.sin(frameIndex / 30 * Math.PI) * 0.2;

    return {
        x: 0.35 + movement,  // Subject sways between 15% and 55% horizontal
        y: 0.2,              // Head typically in upper third
        width: 0.3,          // Subject takes ~30% of frame width
        height: 0.6,         // Subject height (upper body)
        confidence: 0.9
    };
}

// ============================================================
// CROP CALCULATION
// ============================================================

/**
 * Calculates the optimal crop rectangle for a target aspect ratio.
 * Centers on the detected subject while maintaining frame constraints.
 * 
 * @param config - Reframe configuration
 * @param subject - Detected subject bounding box (or null for center crop)
 * @returns Optimal crop rectangle
 */
export function calculateCropRect(
    config: ReframeConfig,
    subject: BoundingBox | null
): CropRect {
    const { sourceWidth, sourceHeight, targetAspectRatio, subjectPadding } = config;

    // Calculate crop dimensions based on target aspect ratio
    let cropWidth: number;
    let cropHeight: number;

    const sourceAspect = sourceWidth / sourceHeight;

    if (targetAspectRatio < sourceAspect) {
        // Target is taller than source (e.g., 16:9 to 9:16)
        // Constrain by height, crop width
        cropHeight = sourceHeight;
        cropWidth = Math.round(cropHeight * targetAspectRatio);
    } else {
        // Target is wider than source
        // Constrain by width, crop height  
        cropWidth = sourceWidth;
        cropHeight = Math.round(cropWidth / targetAspectRatio);
    }

    // Calculate center position
    let centerX: number;
    let centerY: number;

    if (subject) {
        // Center on subject with padding
        const subjectCenterX = (subject.x + subject.width / 2) * sourceWidth;
        const subjectCenterY = (subject.y + subject.height / 2) * sourceHeight;

        centerX = subjectCenterX;
        centerY = subjectCenterY;
    } else {
        // Default to scene center
        centerX = sourceWidth / 2;
        centerY = sourceHeight / 2;
    }

    // Calculate crop position (top-left corner)
    let cropX = Math.round(centerX - cropWidth / 2);
    let cropY = Math.round(centerY - cropHeight / 2);

    // Clamp to frame boundaries
    cropX = Math.max(0, Math.min(cropX, sourceWidth - cropWidth));
    cropY = Math.max(0, Math.min(cropY, sourceHeight - cropHeight));

    return { x: cropX, y: cropY, width: cropWidth, height: cropHeight };
}

// ============================================================
// KEYFRAME GENERATION
// ============================================================

/**
 * Generates position keyframes for smooth pan-and-scan.
 * Analyzes frames at regular intervals and creates keyframes.
 * 
 * @param totalFrames - Total number of frames
 * @param config - Reframe configuration
 * @param keyframeInterval - Frames between keyframes (default: 15 = 0.5s at 30fps)
 * @returns Array of position keyframes
 */
export function generatePositionKeyframes(
    totalFrames: number,
    config: ReframeConfig,
    keyframeInterval: number = 15
): PositionKeyframe[] {
    const keyframes: PositionKeyframe[] = [];

    for (let frame = 0; frame <= totalFrames; frame += keyframeInterval) {
        // Detect subject at this frame
        const subject = detectSubject(null, frame);

        // Calculate crop position
        const crop = calculateCropRect(config, subject);

        keyframes.push({
            frame,
            cropX: crop.x,
            cropY: crop.y
        });
    }

    return keyframes;
}

/**
 * Applies smoothing to keyframes using exponential moving average.
 * Reduces jerky camera movements.
 * 
 * @param keyframes - Raw position keyframes
 * @param smoothing - Smoothing factor (0-1)
 * @returns Smoothed keyframes
 */
export function smoothKeyframes(
    keyframes: PositionKeyframe[],
    smoothing: number
): PositionKeyframe[] {
    if (keyframes.length < 2 || smoothing <= 0) return keyframes;

    const alpha = 1 - smoothing;
    const smoothed: PositionKeyframe[] = [keyframes[0]];

    for (let i = 1; i < keyframes.length; i++) {
        const prev = smoothed[i - 1];
        const curr = keyframes[i];

        smoothed.push({
            frame: curr.frame,
            cropX: Math.round(alpha * curr.cropX + smoothing * prev.cropX),
            cropY: Math.round(alpha * curr.cropY + smoothing * prev.cropY)
        });
    }

    return smoothed;
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Generates a complete auto-reframe for converting video to vertical format.
 * 
 * @param sourceWidth - Source video width
 * @param sourceHeight - Source video height
 * @param totalFrames - Total video duration in frames
 * @param options - Optional configuration overrides
 * @returns Smoothed position keyframes for the reframed video
 * 
 * @example
 * const keyframes = autoReframe(1920, 1080, 300, { targetAspectRatio: 9/16 });
 * // Returns keyframes for a 10-second 1080p video converted to 9:16
 */
export function autoReframe(
    sourceWidth: number,
    sourceHeight: number,
    totalFrames: number,
    options: Partial<typeof DEFAULT_REFRAME_CONFIG> = {}
): PositionKeyframe[] {
    const config: ReframeConfig = {
        sourceWidth,
        sourceHeight,
        ...DEFAULT_REFRAME_CONFIG,
        ...options
    };

    // Generate raw keyframes
    const rawKeyframes = generatePositionKeyframes(totalFrames, config);

    // Apply smoothing
    const smoothedKeyframes = smoothKeyframes(rawKeyframes, config.smoothing);

    return smoothedKeyframes;
}

/**
 * Gets the interpolated crop position at a specific frame.
 * 
 * @param keyframes - Position keyframes
 * @param frame - Target frame
 * @param config - Reframe config for crop dimensions
 * @returns Full crop rectangle at this frame
 */
export function getCropAtFrame(
    keyframes: PositionKeyframe[],
    frame: number,
    config: ReframeConfig
): CropRect {
    if (keyframes.length === 0) {
        return calculateCropRect(config, null);
    }

    // Find surrounding keyframes
    const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

    if (frame <= sorted[0].frame) {
        return {
            x: sorted[0].cropX,
            y: sorted[0].cropY,
            width: Math.round(config.sourceHeight * config.targetAspectRatio),
            height: config.sourceHeight
        };
    }

    if (frame >= sorted[sorted.length - 1].frame) {
        return {
            x: sorted[sorted.length - 1].cropX,
            y: sorted[sorted.length - 1].cropY,
            width: Math.round(config.sourceHeight * config.targetAspectRatio),
            height: config.sourceHeight
        };
    }

    // Find keyframes before and after
    let prev = sorted[0];
    let next = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
        if (frame >= sorted[i].frame && frame <= sorted[i + 1].frame) {
            prev = sorted[i];
            next = sorted[i + 1];
            break;
        }
    }

    // Interpolate
    const t = (frame - prev.frame) / (next.frame - prev.frame);

    return {
        x: Math.round(prev.cropX + (next.cropX - prev.cropX) * t),
        y: Math.round(prev.cropY + (next.cropY - prev.cropY) * t),
        width: Math.round(config.sourceHeight * config.targetAspectRatio),
        height: config.sourceHeight
    };
}

// ============================================================
// ML-POWERED REFRAME
// ============================================================

/**
 * Options for ML-powered auto-reframe
 */
export interface MLReframeOptions extends Partial<typeof DEFAULT_REFRAME_CONFIG> {
    /** Video URL for frame analysis */
    videoUrl: string;
    /** Frames per second */
    fps: number;
    /** Progress callback (0-1) */
    onProgress?: (progress: number) => void;
}

/**
 * Generates auto-reframe keyframes using ML-based subject detection.
 * Uses TensorFlow.js COCO-SSD for accurate person/object tracking.
 * 
 * @param sourceWidth - Source video width
 * @param sourceHeight - Source video height
 * @param totalFrames - Total video duration in frames
 * @param options - ML reframe options including video URL
 * @returns Smoothed position keyframes based on ML detection
 * 
 * @example
 * const keyframes = await autoReframeML(1920, 1080, 300, {
 *   videoUrl: 'https://example.com/video.mp4',
 *   fps: 30,
 *   onProgress: (p) => console.log(`${p * 100}%`)
 * });
 */
export async function autoReframeML(
    sourceWidth: number,
    sourceHeight: number,
    totalFrames: number,
    options: MLReframeOptions
): Promise<PositionKeyframe[]> {
    const { videoUrl, fps, onProgress, ...configOptions } = options;

    const config: ReframeConfig = {
        sourceWidth,
        sourceHeight,
        ...DEFAULT_REFRAME_CONFIG,
        ...configOptions
    };

    const keyframeInterval = 15; // Sample every 0.5s at 30fps

    // Analyze video frames with ML
    const detections = await analyzeVideoFrames(
        videoUrl,
        totalFrames,
        fps,
        keyframeInterval,
        onProgress
    );

    // Interpolate missing detections
    const interpolated = interpolateDetections(detections, totalFrames);

    // Convert detections to position keyframes
    const keyframes: PositionKeyframe[] = [];
    const frames = Array.from(interpolated.keys()).sort((a, b) => a - b);

    for (const frame of frames) {
        const subject = interpolated.get(frame);
        const crop = calculateCropRect(config, subject || null);

        keyframes.push({
            frame,
            cropX: crop.x,
            cropY: crop.y
        });
    }

    // Apply smoothing for cinematic movement
    const smoothedKeyframes = smoothKeyframes(keyframes, config.smoothing);

    return smoothedKeyframes;
}

/**
 * Checks if ML detection model is ready.
 * Use this before offering ML-based reframing.
 * 
 * @returns Model status
 */
export function isMLModelReady(): boolean {
    return getModelStatus().loaded;
}

/**
 * Checks if ML model is currently loading.
 * 
 * @returns True if model is loading
 */
export function isMLModelLoading(): boolean {
    return getModelStatus().loading;
}
