/**
 * keyframe-engine.ts
 * 
 * Keyframe animation engine for the Video Editor.
 * Handles interpolation, easing, and value calculation at any frame.
 * 
 * @module lib/keyframe-engine
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Database keyframe record */
export interface Keyframe {
    id: string;
    clip_id: string;
    /** Frame position (0-indexed) */
    frame: number;
    /** Property being animated (e.g., 'opacity', 'position_x') */
    property: KeyframeProperty;
    /** Numeric value at this keyframe */
    value: number;
    /** Easing function name */
    easing: EasingType;
}

/** Supported animatable properties */
export type KeyframeProperty =
    | 'opacity'
    | 'position_x'
    | 'position_y'
    | 'scale_x'
    | 'scale_y'
    | 'scale'  // uniform scale
    | 'rotation'
    | 'volume';

/** Supported easing functions */
export type EasingType =
    | 'linear'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out';

/** Default values for each animatable property */
export const PROPERTY_DEFAULTS: Record<KeyframeProperty, number> = {
    opacity: 1,
    position_x: 0,
    position_y: 0,
    scale_x: 1,
    scale_y: 1,
    scale: 1,
    rotation: 0,
    volume: 1
};

// ============================================================
// EASING FUNCTIONS
// ============================================================

/**
 * Linear interpolation (no easing).
 * 
 * @param t - Progress value 0-1
 * @returns Same value (linear)
 */
function linear(t: number): number {
    return t;
}

/**
 * Ease-in (slow start).
 * Uses quadratic function.
 * 
 * @param t - Progress value 0-1
 * @returns Eased value
 */
function easeIn(t: number): number {
    return t * t;
}

/**
 * Ease-out (slow end).
 * Inverse of ease-in.
 * 
 * @param t - Progress value 0-1
 * @returns Eased value
 */
function easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

/**
 * Ease-in-out (slow start and end).
 * Combines ease-in and ease-out.
 * 
 * @param t - Progress value 0-1
 * @returns Eased value
 */
function easeInOut(t: number): number {
    return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Map of easing function names to implementations */
const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
    'linear': linear,
    'ease-in': easeIn,
    'ease-out': easeOut,
    'ease-in-out': easeInOut
};

// ============================================================
// INTERPOLATION FUNCTIONS
// ============================================================

/**
 * Linearly interpolates between two values.
 * 
 * @param a - Start value
 * @param b - End value
 * @param t - Progress 0-1
 * @returns Interpolated value
 */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Gets the value of a property at a specific frame.
 * 
 * Algorithm:
 * 1. Find keyframes before and after the target frame
 * 2. If frame is before all keyframes, return first keyframe value
 * 3. If frame is after all keyframes, return last keyframe value
 * 4. If frame is exactly on a keyframe, return that value
 * 5. Otherwise, interpolate between surrounding keyframes
 * 
 * @param keyframes - Array of keyframes for this property (sorted by frame)
 * @param frame - Target frame to evaluate
 * @param defaultValue - Fallback if no keyframes exist
 * @returns Interpolated value at the given frame
 * 
 * @example
 * const keyframes = [
 *   { frame: 0, value: 0, easing: 'linear' },
 *   { frame: 30, value: 100, easing: 'ease-out' }
 * ];
 * getValueAtFrame(keyframes, 15, 0); // Returns ~25 (halfway through linear)
 */
export function getValueAtFrame(
    keyframes: Pick<Keyframe, 'frame' | 'value' | 'easing'>[],
    frame: number,
    defaultValue: number
): number {
    if (keyframes.length === 0) {
        return defaultValue;
    }

    // Sort keyframes by frame (should already be sorted, but ensure)
    const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

    // Before first keyframe
    if (frame <= sorted[0].frame) {
        return sorted[0].value;
    }

    // After last keyframe
    if (frame >= sorted[sorted.length - 1].frame) {
        return sorted[sorted.length - 1].value;
    }

    // Find surrounding keyframes
    let prevKeyframe = sorted[0];
    let nextKeyframe = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
        if (frame >= sorted[i].frame && frame <= sorted[i + 1].frame) {
            prevKeyframe = sorted[i];
            nextKeyframe = sorted[i + 1];
            break;
        }
    }

    // Exactly on a keyframe
    if (frame === prevKeyframe.frame) {
        return prevKeyframe.value;
    }
    if (frame === nextKeyframe.frame) {
        return nextKeyframe.value;
    }

    // Calculate progress between keyframes
    const duration = nextKeyframe.frame - prevKeyframe.frame;
    const progress = (frame - prevKeyframe.frame) / duration;

    // Apply easing function (use next keyframe's easing for the segment)
    const easingFn = EASING_FUNCTIONS[nextKeyframe.easing as EasingType] || linear;
    const easedProgress = easingFn(progress);

    // Interpolate
    return lerp(prevKeyframe.value, nextKeyframe.value, easedProgress);
}

/**
 * Gets all property values at a specific frame for a clip.
 * 
 * @param allKeyframes - All keyframes for the clip
 * @param frame - Target frame (relative to clip start)
 * @returns Object with property values at the frame
 */
export function getClipPropertiesAtFrame(
    allKeyframes: Keyframe[],
    frame: number
): Record<KeyframeProperty, number> {
    const result = { ...PROPERTY_DEFAULTS };

    // Group keyframes by property
    const byProperty = new Map<KeyframeProperty, Keyframe[]>();
    for (const kf of allKeyframes) {
        if (!byProperty.has(kf.property)) {
            byProperty.set(kf.property, []);
        }
        byProperty.get(kf.property)!.push(kf);
    }

    // Calculate each property's value at frame
    for (const [property, keyframes] of byProperty) {
        result[property] = getValueAtFrame(
            keyframes,
            frame,
            PROPERTY_DEFAULTS[property]
        );
    }

    return result;
}

/**
 * Validates keyframe data before saving.
 * 
 * @param keyframe - Keyframe to validate
 * @returns True if valid, throws error otherwise
 */
export function validateKeyframe(keyframe: Partial<Keyframe>): boolean {
    if (keyframe.frame !== undefined && keyframe.frame < 0) {
        throw new Error('Frame must be >= 0');
    }
    if (keyframe.value !== undefined && !Number.isFinite(keyframe.value)) {
        throw new Error('Value must be a finite number');
    }
    if (keyframe.property && !Object.keys(PROPERTY_DEFAULTS).includes(keyframe.property)) {
        throw new Error(`Invalid property: ${keyframe.property}`);
    }
    if (keyframe.easing && !Object.keys(EASING_FUNCTIONS).includes(keyframe.easing)) {
        throw new Error(`Invalid easing: ${keyframe.easing}`);
    }
    return true;
}
