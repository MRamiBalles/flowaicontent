/**
 * Remotion Root
 * 
 * Defines all compositions available for rendering.
 * VideoProject is the main composition that renders a complete video project.
 */

import React from 'react';
import { Composition } from 'remotion';
import { VideoProject, videoProjectSchema } from './VideoProject';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            {/* 
             * Main composition for rendering video projects
             * Props are passed from the Edge Function with full project data
             */}
            <Composition
                id="VideoProject"
                component={VideoProject}
                durationInFrames={300}
                fps={30}
                width={1920}
                height={1080}
                schema={videoProjectSchema}
                defaultProps={{
                    project: {
                        id: 'default',
                        name: 'Default Project',
                        width: 1920,
                        height: 1080,
                        fps: 30,
                        durationFrames: 300
                    },
                    tracks: [],
                    clips: [],
                    keyframes: [],
                    transitions: []
                }}
                calculateMetadata={async ({ props }) => {
                    // Dynamic duration/dimensions from project data
                    return {
                        durationInFrames: props.project.durationFrames,
                        fps: props.project.fps,
                        width: props.project.width,
                        height: props.project.height
                    };
                }}
            />

            {/* 9:16 vertical composition for social media */}
            <Composition
                id="VideoProject-9x16"
                component={VideoProject}
                durationInFrames={300}
                fps={30}
                width={1080}
                height={1920}
                schema={videoProjectSchema}
                defaultProps={{
                    project: {
                        id: 'default',
                        name: 'Default Project (Vertical)',
                        width: 1080,
                        height: 1920,
                        fps: 30,
                        durationFrames: 300
                    },
                    tracks: [],
                    clips: [],
                    keyframes: [],
                    transitions: []
                }}
                calculateMetadata={async ({ props }) => {
                    return {
                        durationInFrames: props.project.durationFrames,
                        fps: props.project.fps,
                        width: 1080,
                        height: 1920
                    };
                }}
            />
        </>
    );
};
