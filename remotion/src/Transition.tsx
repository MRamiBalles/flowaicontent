/**
 * Transition Component
 * 
 * Handles transitions between clips (fade, dissolve, wipe, slide).
 * Applied via opacity/transform interpolation.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';

// ============================================================
// TYPES
// ============================================================

export type TransitionType = 'fade' | 'dissolve' | 'wipe' | 'slide';

interface TransitionProps {
    type: TransitionType;
    durationInFrames: number;
    direction?: 'in' | 'out';
    children: React.ReactNode;
}

// ============================================================
// COMPONENT
// ============================================================

export const Transition: React.FC<TransitionProps> = ({
    type,
    durationInFrames,
    direction = 'in',
    children
}) => {
    const frame = useCurrentFrame();

    // Calculate transition progress (0 to 1)
    const progress = interpolate(
        frame,
        [0, durationInFrames],
        direction === 'in' ? [0, 1] : [1, 0],
        {
            easing: Easing.inOut(Easing.ease),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp'
        }
    );

    // Apply transition effect
    const getStyle = (): React.CSSProperties => {
        switch (type) {
            case 'fade':
            case 'dissolve':
                return { opacity: progress };

            case 'wipe':
                // Horizontal wipe from left to right
                return {
                    clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`
                };

            case 'slide':
                // Slide in from right
                const translateX = direction === 'in'
                    ? (1 - progress) * 100
                    : -progress * 100;
                return {
                    transform: `translateX(${translateX}%)`
                };

            default:
                return { opacity: progress };
        }
    };

    return (
        <AbsoluteFill style={getStyle()}>
            {children}
        </AbsoluteFill>
    );
};

/**
 * Helper to wrap clip content with transition effects
 */
export const withTransition = (
    content: React.ReactNode,
    incomingTransition?: { transition_type: TransitionType; duration_frames: number },
    outgoingTransition?: { transition_type: TransitionType; duration_frames: number },
    currentFrame?: number,
    clipDuration?: number
): React.ReactNode => {
    if (!incomingTransition && !outgoingTransition) {
        return content;
    }

    // Simplified: just apply fade if any transition exists
    // Full implementation would track position within clip
    return (
        <Transition
            type={incomingTransition?.transition_type || 'fade'}
            durationInFrames={incomingTransition?.duration_frames || 15}
            direction="in"
        >
            {content}
        </Transition>
    );
};
