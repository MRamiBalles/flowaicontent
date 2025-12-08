import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    Play,
    Pause,
    RotateCcw,
    Save,
    BookOpen,
    Clock,
    Trophy,
    Sparkles,
    ChevronRight,
    Loader2,
    Volume2,
    VolumeX
} from 'lucide-react';

interface Scene {
    id: string;
    name: string;
    video_url: string;
    video_duration_seconds: number;
    choice_appears_at_seconds?: number;
    choice_timeout_seconds?: number;
    scene_type: string;
    ending_type?: string;
    choices?: Choice[];
}

interface Choice {
    id: string;
    choice_text: string;
    choice_order: number;
    choice_color?: string;
    next_scene_id: string;
}

interface Story {
    id: string;
    title: string;
    description: string;
    thumbnail_url?: string;
    total_scenes: number;
    total_endings: number;
}

const InteractivePlayer: React.FC = () => {
    const { user, session } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);

    // State
    const [stories, setStories] = useState<Story[]>([]);
    const [currentStory, setCurrentStory] = useState<Story | null>(null);
    const [currentScene, setCurrentScene] = useState<Scene | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showChoices, setShowChoices] = useState(false);
    const [choiceTimer, setChoiceTimer] = useState<number | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isEnding, setIsEnding] = useState(false);
    const [endingType, setEndingType] = useState<string | null>(null);
    const [scenesWatched, setScenesWatched] = useState(0);
    const [startTime, setStartTime] = useState<Date | null>(null);

    useEffect(() => {
        loadStories();
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !currentScene) return;

        const handleTimeUpdate = () => {
            const progressPercent = (video.currentTime / video.duration) * 100;
            setProgress(progressPercent);

            // Show choices when video reaches choice point
            if (currentScene.choice_appears_at_seconds &&
                video.currentTime >= currentScene.choice_appears_at_seconds &&
                currentScene.choices?.length &&
                !showChoices) {
                setShowChoices(true);
                video.pause();
                setIsPlaying(false);

                // Start choice timer
                const timeout = currentScene.choice_timeout_seconds || 10;
                setChoiceTimer(timeout);
            }
        };

        const handleEnded = () => {
            if (currentScene.choices?.length && !showChoices) {
                setShowChoices(true);
                const timeout = currentScene.choice_timeout_seconds || 10;
                setChoiceTimer(timeout);
            }
            setIsPlaying(false);
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
        };
    }, [currentScene, showChoices]);

    // Choice timer countdown
    useEffect(() => {
        if (choiceTimer === null || choiceTimer <= 0) return;

        const interval = setInterval(() => {
            setChoiceTimer(prev => {
                if (prev === null || prev <= 1) {
                    // Auto-select first choice on timeout
                    if (currentScene?.choices?.[0]) {
                        handleChoice(currentScene.choices[0]);
                    }
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [choiceTimer]);

    const callApi = async (action: string, data?: Record<string, unknown>) => {
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interactive-stories`,
            {
                method: 'POST',
                headers: {
                    'Authorization': session ? `Bearer ${session.access_token}` : '',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, data }),
            }
        );
        return response.json();
    };

    const loadStories = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('interactive_stories')
                .select('*')
                .eq('status', 'published')
                .order('total_plays', { ascending: false });

            if (error) throw error;
            setStories(data || []);
        } catch (error) {
            console.error('Error loading stories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const startStory = async (story: Story) => {
        setIsLoading(true);
        try {
            const result = await callApi('start_story', { story_id: story.id });

            if (!result.success) {
                throw new Error(result.error);
            }

            setCurrentStory(story);
            setCurrentScene(result.scene);
            setScenesWatched(1);
            setStartTime(new Date());
            setIsEnding(false);
            setEndingType(null);

            // Auto-play
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.play();
                    setIsPlaying(true);
                }
            }, 500);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to start story');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChoice = async (choice: Choice) => {
        if (!currentStory || !currentScene) return;

        setShowChoices(false);
        setChoiceTimer(null);
        setIsLoading(true);

        try {
            const result = await callApi('make_choice', {
                story_id: currentStory.id,
                scene_id: currentScene.id,
                choice_id: choice.id,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            setCurrentScene(result.next_scene);
            setScenesWatched(prev => prev + 1);
            setProgress(0);

            if (result.is_ending) {
                setIsEnding(true);
                setEndingType(result.next_scene?.ending_type);
            }

            // Auto-play next scene
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.play();
                    setIsPlaying(true);
                }
            }, 500);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to make choice');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlayPause = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const restartStory = () => {
        if (currentStory) {
            startStory(currentStory);
        }
    };

    const exitStory = () => {
        setCurrentStory(null);
        setCurrentScene(null);
        setShowChoices(false);
        setChoiceTimer(null);
        setIsEnding(false);
    };

    const saveProgress = async () => {
        if (!currentStory) return;

        try {
            const result = await callApi('save_checkpoint', { story_id: currentStory.id });

            if (result.success) {
                toast.success('Progress saved!');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast.error('Failed to save');
        }
    };

    const getPlayTime = () => {
        if (!startTime) return '0:00';
        const diff = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading && !currentScene) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Story Browser
    if (!currentStory) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                        <Sparkles className="h-8 w-8 text-primary" />
                        Interactive Experiences
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Choose your own adventure with AI-powered branching stories
                    </p>
                </div>

                {stories.length === 0 ? (
                    <Card className="p-8 text-center">
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-1">No stories available</h3>
                        <p className="text-sm text-muted-foreground">
                            Check back soon for new interactive experiences
                        </p>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stories.map((story) => (
                            <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startStory(story)}>
                                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    {story.thumbnail_url ? (
                                        <img src={story.thumbnail_url} alt={story.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <Play className="h-12 w-12 text-primary" />
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-lg mb-1">{story.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                        {story.description || 'An interactive adventure awaits...'}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            {story.total_scenes} scenes
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Trophy className="h-3 w-3" />
                                            {story.total_endings} endings
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Interactive Player
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Video Player */}
            <div className="flex-1 relative">
                {currentScene && (
                    <video
                        ref={videoRef}
                        src={currentScene.video_url}
                        className="w-full h-full object-contain"
                        muted={isMuted}
                        playsInline
                    />
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-white" />
                    </div>
                )}

                {/* Choice Overlay */}
                {showChoices && currentScene?.choices && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="max-w-2xl w-full mx-4 space-y-4">
                            {choiceTimer && (
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center gap-2 text-white bg-primary/20 px-4 py-2 rounded-full">
                                        <Clock className="h-4 w-4" />
                                        <span className="font-mono text-lg">{choiceTimer}s</span>
                                    </div>
                                </div>
                            )}

                            {currentScene.choices.map((choice, index) => (
                                <button
                                    key={choice.id}
                                    onClick={() => handleChoice(choice)}
                                    className="w-full p-4 rounded-lg border-2 border-white/20 hover:border-primary bg-black/50 hover:bg-primary/20 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                                            {index + 1}
                                        </span>
                                        <span className="flex-1 text-white text-lg">{choice.choice_text}</span>
                                        <ChevronRight className="h-6 w-6 text-white/50 group-hover:text-white transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ending Screen */}
                {isEnding && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="text-center">
                            <Trophy className={`h-16 w-16 mx-auto mb-4 ${endingType === 'good' ? 'text-yellow-500' :
                                    endingType === 'secret' ? 'text-purple-500' :
                                        endingType === 'bad' ? 'text-red-500' : 'text-gray-500'
                                }`} />
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {endingType === 'good' ? 'Good Ending' :
                                    endingType === 'secret' ? 'Secret Ending' :
                                        endingType === 'bad' ? 'Bad Ending' : 'The End'}
                            </h2>
                            <p className="text-white/70 mb-6">
                                {scenesWatched} scenes • {getPlayTime()} playtime
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button onClick={restartStory} variant="outline" className="text-white border-white">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Play Again
                                </Button>
                                <Button onClick={exitStory}>
                                    Browse Stories
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="bg-black/80 p-4 flex items-center gap-4">
                <Button size="icon" variant="ghost" className="text-white" onClick={togglePlayPause}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <div className="flex-1">
                    <Progress value={progress} className="h-1" />
                </div>

                <Button size="icon" variant="ghost" className="text-white" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>

                {user && (
                    <Button size="icon" variant="ghost" className="text-white" onClick={saveProgress}>
                        <Save className="h-5 w-5" />
                    </Button>
                )}

                <Button variant="ghost" className="text-white text-sm" onClick={exitStory}>
                    Exit
                </Button>
            </div>
        </div>
    );
};

export default InteractivePlayer;
