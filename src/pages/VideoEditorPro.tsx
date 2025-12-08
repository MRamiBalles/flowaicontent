import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Plus,
    Trash2,
    Download,
    Upload,
    Film,
    Music,
    Type,
    Image as ImageIcon,
    Layers,
    Settings,
    Wand2,
    Save,
    Loader2,
    Clock,
    Mic,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut
} from 'lucide-react';

interface Project {
    id: string;
    name: string;
    width: number;
    height: number;
    fps: number;
    duration_frames: number;
    render_status: string;
    render_progress: number;
    rendered_video_url: string | null;
}

interface Track {
    id: string;
    track_type: string;
    name: string;
    order_index: number;
    is_locked: boolean;
    is_visible: boolean;
    is_muted: boolean;
}

interface Clip {
    id: string;
    track_id: string;
    clip_type: string;
    start_frame: number;
    end_frame: number;
    text_content?: string;
    source_url?: string;
}

const TRACK_COLORS: Record<string, string> = {
    video: 'bg-blue-500',
    audio: 'bg-green-500',
    text: 'bg-purple-500',
    image: 'bg-yellow-500',
    shape: 'bg-pink-500',
    effect: 'bg-orange-500',
};

const VideoEditorPro: React.FC = () => {
    const { user, session } = useAuth();

    // Project state
    const [project, setProject] = useState<Project | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [clips, setClips] = useState<Clip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRendering, setIsRendering] = useState(false);

    // Timeline state
    const [currentFrame, setCurrentFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

    // Player state
    const playerRef = useRef<HTMLDivElement>(null);
    const playbackTimerRef = useRef<number | null>(null);

    // Create new project on mount if none exists
    useEffect(() => {
        if (user) {
            loadOrCreateProject();
        }
    }, [user]);

    // Playback timer
    useEffect(() => {
        if (isPlaying && project) {
            playbackTimerRef.current = window.setInterval(() => {
                setCurrentFrame(prev => {
                    const next = prev + 1;
                    if (next >= project.duration_frames) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return next;
                });
            }, 1000 / project.fps);
        }

        return () => {
            if (playbackTimerRef.current) {
                clearInterval(playbackTimerRef.current);
            }
        };
    }, [isPlaying, project?.fps, project?.duration_frames]);

    const loadOrCreateProject = async () => {
        setIsLoading(true);
        try {
            // Try to load most recent project
            const { data: projects, error } = await supabase
                .from('video_projects')
                .select('*')
                .eq('is_template', false)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (projects && projects.length > 0) {
                setProject(projects[0]);
                await loadProjectData(projects[0].id);
            } else {
                // Create new project
                await createNewProject();
            }
        } catch (error) {
            console.error('Error loading project:', error);
            toast.error('Failed to load project');
        } finally {
            setIsLoading(false);
        }
    };

    const createNewProject = async () => {
        try {
            const { data: newProject, error } = await supabase
                .from('video_projects')
                .insert({
                    user_id: user?.id,
                    name: 'Untitled Project',
                    width: 1920,
                    height: 1080,
                    fps: 30,
                    duration_frames: 300, // 10 seconds
                })
                .select()
                .single();

            if (error) throw error;

            // Create default tracks
            await supabase
                .from('video_tracks')
                .insert([
                    { project_id: newProject.id, track_type: 'video', name: 'Video 1', order_index: 0 },
                    { project_id: newProject.id, track_type: 'audio', name: 'Audio 1', order_index: 1 },
                    { project_id: newProject.id, track_type: 'text', name: 'Text', order_index: 2 },
                ]);

            setProject(newProject);
            await loadProjectData(newProject.id);
            toast.success('New project created');
        } catch (error) {
            console.error('Error creating project:', error);
            toast.error('Failed to create project');
        }
    };

    const loadProjectData = async (projectId: string) => {
        try {
            // Load tracks
            const { data: trackData, error: trackError } = await supabase
                .from('video_tracks')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index');

            if (trackError) throw trackError;
            setTracks(trackData || []);

            // Load clips
            if (trackData && trackData.length > 0) {
                const trackIds = trackData.map(t => t.id);
                const { data: clipData, error: clipError } = await supabase
                    .from('video_clips')
                    .select('*')
                    .in('track_id', trackIds);

                if (clipError) throw clipError;
                setClips(clipData || []);
            }
        } catch (error) {
            console.error('Error loading project data:', error);
        }
    };

    const handleAddTrack = async (type: string) => {
        if (!project) return;

        try {
            const newIndex = tracks.length;
            const { data: newTrack, error } = await supabase
                .from('video_tracks')
                .insert({
                    project_id: project.id,
                    track_type: type,
                    name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${newIndex + 1}`,
                    order_index: newIndex,
                })
                .select()
                .single();

            if (error) throw error;
            setTracks([...tracks, newTrack]);
            toast.success(`Added ${type} track`);
        } catch (error) {
            console.error('Error adding track:', error);
            toast.error('Failed to add track');
        }
    };

    const handleAddClip = async (trackId: string, type: string) => {
        try {
            const { data: newClip, error } = await supabase
                .from('video_clips')
                .insert({
                    track_id: trackId,
                    clip_type: type,
                    start_frame: currentFrame,
                    end_frame: currentFrame + 90, // 3 seconds at 30fps
                    text_content: type === 'text' ? 'New Text' : undefined,
                })
                .select()
                .single();

            if (error) throw error;
            setClips([...clips, newClip]);
            setSelectedClipId(newClip.id);
            toast.success('Clip added');
        } catch (error) {
            console.error('Error adding clip:', error);
            toast.error('Failed to add clip');
        }
    };

    const handleDeleteClip = async (clipId: string) => {
        try {
            const { error } = await supabase
                .from('video_clips')
                .delete()
                .eq('id', clipId);

            if (error) throw error;
            setClips(clips.filter(c => c.id !== clipId));
            setSelectedClipId(null);
            toast.success('Clip deleted');
        } catch (error) {
            console.error('Error deleting clip:', error);
            toast.error('Failed to delete clip');
        }
    };

    const handleSave = async () => {
        if (!project) return;

        setIsSaving(true);
        try {
            // Compile composition data
            const compositionData = {
                tracks: tracks.map(track => ({
                    ...track,
                    clips: clips.filter(c => c.track_id === track.id).map(c => ({
                        id: c.id,
                        track_id: c.track_id,
                        clip_type: c.clip_type,
                        start_frame: c.start_frame,
                        end_frame: c.end_frame,
                        text_content: c.text_content || null,
                        source_url: c.source_url || null,
                    })),
                })),
            };

            const { error } = await supabase
                .from('video_projects')
                .update({
                    composition_data: JSON.parse(JSON.stringify(compositionData)),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', project.id);

            if (error) throw error;
            toast.success('Project saved');
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save project');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRender = async () => {
        if (!project) return;

        setIsRendering(true);
        try {
            // Save first
            await handleSave();

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/render-video`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        project_id: project.id,
                        quality: 'high',
                        format: 'mp4',
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success('Render job started!', {
                description: 'You will be notified when your video is ready.',
            });

            // Update local status
            setProject({ ...project, render_status: 'queued' });
        } catch (error) {
            console.error('Render error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to start render');
        } finally {
            setIsRendering(false);
        }
    };

    const togglePlayback = () => {
        setIsPlaying(!isPlaying);
    };

    const seekTo = (frame: number) => {
        setCurrentFrame(Math.max(0, Math.min(frame, (project?.duration_frames || 300) - 1)));
    };

    const formatTimecode = (frame: number) => {
        const fps = project?.fps || 30;
        const totalSeconds = frame / fps;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const frames = frame % fps;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <Film className="h-6 w-6 text-primary" />
                    <Input
                        value={project?.name || 'Untitled'}
                        onChange={(e) => project && setProject({ ...project, name: e.target.value })}
                        className="w-64 bg-transparent border-none text-lg font-semibold"
                    />
                    <Badge variant="outline" className="text-xs">
                        {project?.width}x{project?.height} @ {project?.fps}fps
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span className="ml-2">Save</span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleRender}
                        disabled={isRendering || project?.render_status === 'rendering'}
                    >
                        {isRendering ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        <span className="ml-2">Export</span>
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Assets */}
                <aside className="w-64 border-r border-zinc-800 flex flex-col">
                    <Tabs defaultValue="media" className="flex-1 flex flex-col">
                        <TabsList className="mx-2 mt-2">
                            <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
                            <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
                            <TabsTrigger value="audio" className="text-xs">Audio</TabsTrigger>
                            <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1 p-2">
                            <TabsContent value="media" className="mt-0 space-y-2">
                                <Button variant="outline" className="w-full" size="sm">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Media
                                </Button>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    {/* Placeholder media items */}
                                    <div className="aspect-video bg-zinc-800 rounded cursor-pointer hover:ring-2 ring-primary transition-all" />
                                    <div className="aspect-video bg-zinc-800 rounded cursor-pointer hover:ring-2 ring-primary transition-all" />
                                </div>
                            </TabsContent>

                            <TabsContent value="text" className="mt-0 space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    size="sm"
                                    onClick={() => {
                                        const textTrack = tracks.find(t => t.track_type === 'text');
                                        if (textTrack) handleAddClip(textTrack.id, 'text');
                                    }}
                                >
                                    <Type className="h-4 w-4 mr-2" />
                                    Add Text
                                </Button>
                            </TabsContent>

                            <TabsContent value="audio" className="mt-0 space-y-2">
                                <Button variant="outline" className="w-full" size="sm">
                                    <Music className="h-4 w-4 mr-2" />
                                    Add Music
                                </Button>
                                <Button variant="outline" className="w-full" size="sm">
                                    <Mic className="h-4 w-4 mr-2" />
                                    Voice Over
                                </Button>
                            </TabsContent>

                            <TabsContent value="ai" className="mt-0 space-y-2">
                                <Button variant="outline" className="w-full" size="sm">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    AI Generate Video
                                </Button>
                                <Button variant="outline" className="w-full" size="sm">
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    AI Enhance
                                </Button>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </aside>

                {/* Center - Preview */}
                <div className="flex-1 flex flex-col">
                    {/* Preview Area */}
                    <div className="flex-1 flex items-center justify-center bg-zinc-900 p-4">
                        <div
                            ref={playerRef}
                            className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
                            style={{
                                aspectRatio: `${project?.width || 1920}/${project?.height || 1080}`,
                                maxWidth: '100%',
                                maxHeight: '100%',
                            }}
                        >
                            {/* Canvas placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                                <div className="text-center">
                                    <Film className="h-16 w-16 mx-auto mb-2" />
                                    <p>Preview Canvas</p>
                                    <p className="text-sm text-zinc-700">Frame {currentFrame}</p>
                                </div>
                            </div>

                            {/* Render clips that are visible at current frame */}
                            {clips
                                .filter(clip => currentFrame >= clip.start_frame && currentFrame < clip.end_frame)
                                .map(clip => clip.clip_type === 'text' && (
                                    <div
                                        key={clip.id}
                                        className="absolute inset-0 flex items-center justify-center text-4xl font-bold"
                                    >
                                        {clip.text_content}
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="h-16 border-t border-zinc-800 flex items-center justify-center gap-4 px-4">
                        <Button variant="ghost" size="icon" onClick={() => seekTo(0)}>
                            <SkipBack className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => seekTo(currentFrame - project!.fps)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button size="icon" onClick={togglePlayback} className="h-10 w-10">
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => seekTo(currentFrame + project!.fps)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => seekTo(project!.duration_frames - 1)}>
                            <SkipForward className="h-4 w-4" />
                        </Button>

                        <div className="ml-4 flex items-center gap-2 text-sm font-mono">
                            <Clock className="h-4 w-4 text-zinc-500" />
                            <span>{formatTimecode(currentFrame)}</span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-zinc-500">{formatTimecode(project?.duration_frames || 300)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Properties */}
                <aside className="w-72 border-l border-zinc-800 flex flex-col">
                    <div className="p-3 border-b border-zinc-800">
                        <h3 className="font-semibold text-sm">Properties</h3>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        {selectedClipId ? (
                            <div className="space-y-4">
                                {/* Show selected clip properties */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-400">Position</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">X</Label>
                                            <Input type="number" defaultValue={0} className="h-8" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Y</Label>
                                            <Input type="number" defaultValue={0} className="h-8" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-400">Scale</Label>
                                    <Slider defaultValue={[100]} max={200} step={1} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-zinc-400">Opacity</Label>
                                    <Slider defaultValue={[100]} max={100} step={1} />
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleDeleteClip(selectedClipId)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Clip
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center text-zinc-500 py-8">
                                <Layers className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Select a clip to edit properties</p>
                            </div>
                        )}
                    </ScrollArea>
                </aside>
            </div>

            {/* Timeline */}
            <div className="h-48 border-t border-zinc-800 flex flex-col">
                {/* Timeline header */}
                <div className="h-8 border-b border-zinc-800 flex items-center px-2 gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ZoomOut className="h-3 w-3" />
                    </Button>
                    <Slider
                        value={[zoom * 100]}
                        min={25}
                        max={400}
                        step={25}
                        onValueChange={([v]) => setZoom(v / 100)}
                        className="w-24"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ZoomIn className="h-3 w-3" />
                    </Button>

                    <div className="flex-1" />

                    <Select defaultValue="video" onValueChange={(v) => handleAddTrack(v)}>
                        <SelectTrigger className="w-32 h-7 text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Track
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="video">Video Track</SelectItem>
                            <SelectItem value="audio">Audio Track</SelectItem>
                            <SelectItem value="text">Text Track</SelectItem>
                            <SelectItem value="image">Image Track</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Timeline tracks */}
                <ScrollArea className="flex-1">
                    <div className="min-w-full">
                        {/* Ruler */}
                        <div className="h-6 bg-zinc-900 border-b border-zinc-800 flex items-end pl-32">
                            {Array.from({ length: Math.ceil((project?.duration_frames || 300) / 30) }).map((_, i) => (
                                <div
                                    key={i}
                                    className="text-xs text-zinc-500 border-l border-zinc-700"
                                    style={{ width: `${30 * zoom}px`, paddingLeft: 2 }}
                                >
                                    {i}s
                                </div>
                            ))}
                        </div>

                        {/* Playhead */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                            style={{ left: `${128 + currentFrame * zoom}px` }}
                        >
                            <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 transform rotate-45" />
                        </div>

                        {/* Tracks */}
                        {tracks.map((track) => (
                            <div
                                key={track.id}
                                className="h-12 border-b border-zinc-800 flex"
                            >
                                {/* Track header */}
                                <div className="w-32 bg-zinc-900 border-r border-zinc-800 flex items-center px-2 gap-2 shrink-0">
                                    <div className={`w-2 h-2 rounded-full ${TRACK_COLORS[track.track_type]}`} />
                                    <span className="text-xs truncate">{track.name}</span>
                                </div>

                                {/* Track content */}
                                <div
                                    className="flex-1 relative bg-zinc-900/50"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const frame = Math.floor((e.clientX - rect.left) / zoom);
                                        seekTo(frame);
                                    }}
                                >
                                    {/* Clips */}
                                    {clips
                                        .filter(clip => clip.track_id === track.id)
                                        .map(clip => (
                                            <div
                                                key={clip.id}
                                                className={`absolute top-1 bottom-1 rounded cursor-pointer transition-all
                          ${selectedClipId === clip.id ? 'ring-2 ring-primary' : ''}
                          ${TRACK_COLORS[clip.clip_type]} bg-opacity-80 hover:bg-opacity-100`}
                                                style={{
                                                    left: `${clip.start_frame * zoom}px`,
                                                    width: `${(clip.end_frame - clip.start_frame) * zoom}px`,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedClipId(clip.id);
                                                }}
                                            >
                                                <div className="px-2 py-1 text-xs truncate">
                                                    {clip.text_content || clip.clip_type}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default VideoEditorPro;
