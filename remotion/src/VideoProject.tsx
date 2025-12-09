/**
 * VideoProject Composition
 * 
 * Main Remotion composition that renders a complete video project.
 * Receives project data from the Edge Function and renders all tracks, clips, and effects.
 */

import React from 'react';
import { AbsoluteFill, Sequence, Video, Audio, Img, useCurrentFrame, interpolate } from 'remotion';
import { z } from 'zod';
import { Clip } from './Clip';
import { Transition } from './Transition';

// ============================================================
// SCHEMA DEFINITIONS
// ============================================================

const projectSchema = z.object({
    id: z.string(),
    name: z.string(),
    width: z.number(),
    height: z.number(),
    fps: z.number(),
    durationFrames: z.number()
});

const trackSchema = z.object({
    id: z.string(),
    project_id: z.string(),
    track_type: z.enum(['video', 'audio', 'text', 'image']),
    name: z.string(),
    order_index: z.number(),
    is_locked: z.boolean().optional(),
    is_muted: z.boolean().optional()
});

const clipSchema = z.object({
    id: z.string(),
    track_id: z.string(),
    clip_type: z.enum(['video', 'audio', 'text', 'image', 'ai_generated']),
    start_frame: z.number(),
    end_frame: z.number(),
    source_url: z.string().nullable().optional(),
    source_start_frame: z.number().optional(),
    source_end_frame: z.number().optional(),
    position_x: z.number().optional(),
    position_y: z.number().optional(),
    scale_x: z.number().optional(),
    scale_y: z.number().optional(),
    rotation: z.number().optional(),
    opacity: z.number().optional(),
    text_content: z.string().nullable().optional(),
    font_family: z.string().optional(),
    font_size: z.number().optional(),
    font_color: z.string().optional()
});

const keyframeSchema = z.object({
    id: z.string(),
    clip_id: z.string(),
    frame: z.number(),
    property: z.string(),
    value: z.number(),
    easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']).optional()
});

const transitionSchema = z.object({
    id: z.string(),
    from_clip_id: z.string(),
    to_clip_id: z.string(),
    transition_type: z.enum(['fade', 'dissolve', 'wipe', 'slide']),
    duration_frames: z.number()
});

export const videoProjectSchema = z.object({
    project: projectSchema,
    tracks: z.array(trackSchema),
    clips: z.array(clipSchema),
    keyframes: z.array(keyframeSchema),
    transitions: z.array(transitionSchema)
});

export type VideoProjectProps = z.infer<typeof videoProjectSchema>;

// ============================================================
// COMPONENT
// ============================================================

export const VideoProject: React.FC<VideoProjectProps> = ({
    project,
    tracks,
    clips,
    keyframes,
    transitions
}) => {
    const frame = useCurrentFrame();

    // Sort tracks by order_index for proper layering
    const sortedTracks = [...tracks].sort((a, b) => a.order_index - b.order_index);

    // Get clips for each track
    const getTrackClips = (trackId: string) => {
        return clips
            .filter(c => c.track_id === trackId)
            .sort((a, b) => a.start_frame - b.start_frame);
    };

    // Get keyframes for a specific clip
    const getClipKeyframes = (clipId: string) => {
        return keyframes.filter(k => k.clip_id === clipId);
    };

    // Check if track is muted
    const isTrackMuted = (track: typeof tracks[0]) => {
        return track.is_muted === true;
    };

    return (
        <AbsoluteFill style={{ backgroundColor: '#000' }}>
            {/* 
             * Render tracks from bottom to top (higher order_index = lower layer)
             * Audio tracks are not visually rendered but included for audio
             */}
            {sortedTracks.map((track) => {
                const trackClips = getTrackClips(track.id);
                const isMuted = isTrackMuted(track);

                return (
                    <React.Fragment key={track.id}>
                        {trackClips.map((clip) => {
                            const clipKeyframes = getClipKeyframes(clip.id);
                            const clipDuration = clip.end_frame - clip.start_frame;

                            // Find transitions involving this clip
                            const outgoingTransition = transitions.find(
                                t => t.from_clip_id === clip.id
                            );
                            const incomingTransition = transitions.find(
                                t => t.to_clip_id === clip.id
                            );

                            return (
                                <Sequence
                                    key={clip.id}
                                    from={clip.start_frame}
                                    durationInFrames={clipDuration}
                                    name={`${track.name} - Clip ${clip.id.slice(0, 8)}`}
                                >
                                    <Clip
                                        clip={clip}
                                        keyframes={clipKeyframes}
                                        isMuted={isMuted}
                                        incomingTransition={incomingTransition}
                                        outgoingTransition={outgoingTransition}
                                    />
                                </Sequence>
                            );
                        })}
                    </React.Fragment>
                );
            })}
        </AbsoluteFill>
    );
};
