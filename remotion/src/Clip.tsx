/**
 * Clip Component
 * 
 * Renders an individual clip with proper transforms, keyframe animations,
 * and media playback (video/audio/image/text).
 */

import React from 'react';
import { AbsoluteFill, Video, Audio, Img, useCurrentFrame, interpolate, Easing } from 'remotion';

// ============================================================
// TYPES
// ============================================================

interface ClipData {
    id: string;
    clip_type: 'video' | 'audio' | 'text' | 'image' | 'ai_generated';
    source_url?: string | null;
    position_x?: number;
    position_y?: number;
    scale_x?: number;
    scale_y?: number;
    rotation?: number;
    opacity?: number;
    text_content?: string | null;
    font_family?: string;
    font_size?: number;
    font_color?: string;
}

interface KeyframeData {
    frame: number;
    property: string;
    value: number;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface TransitionData {
    transition_type: 'fade' | 'dissolve' | 'wipe' | 'slide';
    duration_frames: number;
}

interface ClipProps {
    clip: ClipData;
    keyframes: KeyframeData[];
    isMuted?: boolean;
    incomingTransition?: TransitionData;
    outgoingTransition?: TransitionData;
}

// ============================================================
// HELPERS
// ============================================================

/** Get easing function for Remotion */
const getEasingFunction = (easing?: string) => {
    switch (easing) {
        case 'ease-in':
            return Easing.in(Easing.ease);
        case 'ease-out':
            return Easing.out(Easing.ease);
        case 'ease-in-out':
            return Easing.inOut(Easing.ease);
        default:
            return Easing.linear;
    }
};

/** Get animated property value at current frame */
const getAnimatedValue = (
    keyframes: KeyframeData[],
    property: string,
    currentFrame: number,
    defaultValue: number
): number => {
    const relevant = keyframes
        .filter(k => k.property === property)
        .sort((a, b) => a.frame - b.frame);

    if (relevant.length === 0) return defaultValue;
    if (relevant.length === 1) return relevant[0].value;

    // Find surrounding keyframes
    let prevKf = relevant[0];
    let nextKf = relevant[relevant.length - 1];

    for (let i = 0; i < relevant.length - 1; i++) {
        if (currentFrame >= relevant[i].frame && currentFrame <= relevant[i + 1].frame) {
            prevKf = relevant[i];
            nextKf = relevant[i + 1];
            break;
        }
    }

    if (currentFrame <= prevKf.frame) return prevKf.value;
    if (currentFrame >= nextKf.frame) return nextKf.value;

    // Interpolate
    return interpolate(
        currentFrame,
        [prevKf.frame, nextKf.frame],
        [prevKf.value, nextKf.value],
        {
            easing: getEasingFunction(nextKf.easing),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp'
        }
    );
};

// ============================================================
// COMPONENT
// ============================================================

export const Clip: React.FC<ClipProps> = ({
    clip,
    keyframes,
    isMuted = false,
    incomingTransition,
    outgoingTransition
}) => {
    const frame = useCurrentFrame();

    // Get animated properties
    const opacity = getAnimatedValue(keyframes, 'opacity', frame, clip.opacity ?? 1);
    const positionX = getAnimatedValue(keyframes, 'position_x', frame, clip.position_x ?? 0);
    const positionY = getAnimatedValue(keyframes, 'position_y', frame, clip.position_y ?? 0);
    const scaleX = getAnimatedValue(keyframes, 'scale_x', frame, clip.scale_x ?? 1);
    const scaleY = getAnimatedValue(keyframes, 'scale_y', frame, clip.scale_y ?? 1);
    const rotation = getAnimatedValue(keyframes, 'rotation', frame, clip.rotation ?? 0);

    // Build transform style
    const transform = `
        translateX(${positionX}px) 
        translateY(${positionY}px) 
        scaleX(${scaleX}) 
        scaleY(${scaleY}) 
        rotate(${rotation}deg)
    `.trim();

    // Render based on clip type
    const renderContent = () => {
        switch (clip.clip_type) {
            case 'video':
            case 'ai_generated':
                if (!clip.source_url) return null;
                return (
                    <Video
                        src={clip.source_url}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        muted={isMuted}
                    />
                );

            case 'audio':
                if (!clip.source_url) return null;
                return <Audio src={clip.source_url} muted={isMuted} />;

            case 'image':
                if (!clip.source_url) return null;
                return (
                    <Img
                        src={clip.source_url}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                );

            case 'text':
                return (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: clip.font_family || 'Inter, sans-serif',
                            fontSize: clip.font_size || 48,
                            color: clip.font_color || '#FFFFFF',
                            textAlign: 'center',
                            padding: '10%',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                        }}
                    >
                        {clip.text_content || ''}
                    </div>
                );

            default:
                return null;
        }
    };

    // Audio clips don't need visual rendering
    if (clip.clip_type === 'audio') {
        return renderContent();
    }

    return (
        <AbsoluteFill
            style={{
                opacity,
                transform,
                transformOrigin: 'center center'
            }}
        >
            {renderContent()}
        </AbsoluteFill>
    );
};
