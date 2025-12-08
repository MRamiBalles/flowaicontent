import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    Mic,
    Upload,
    Play,
    Pause,
    Trash2,
    Download,
    Volume2,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Sparkles
} from 'lucide-react';

interface VoiceClone {
    id: string;
    name: string;
    description: string | null;
    language: string;
    sample_audio_url: string;
    status: string;
    total_generations: number;
    created_at: string;
}

interface VoiceCredits {
    available_credits: number;
    monthly_limit: number;
    monthly_used: number;
}

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pl', name: 'Polish' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
];

const VoiceStudio: React.FC = () => {
    const { user, session } = useAuth();

    // Voice cloning state
    const [voices, setVoices] = useState<VoiceClone[]>([]);
    const [credits, setCredits] = useState<VoiceCredits | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCloning, setIsCloning] = useState(false);

    // Clone form state
    const [cloneName, setCloneName] = useState('');
    const [cloneDescription, setCloneDescription] = useState('');
    const [cloneLanguage, setCloneLanguage] = useState('en');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [consentGiven, setConsentGiven] = useState(false);

    // TTS state
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
    const [ttsText, setTtsText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

    // Audio playback
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch voices and credits on mount
    useEffect(() => {
        if (user) {
            fetchVoices();
            fetchCredits();
        }
    }, [user]);

    const fetchVoices = async () => {
        try {
            const { data, error } = await supabase
                .from('voice_clones')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVoices(data || []);
        } catch (error) {
            console.error('Error fetching voices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCredits = async () => {
        try {
            const { data, error } = await supabase
                .from('voice_credits')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setCredits(data);
        } catch (error) {
            console.error('Error fetching credits:', error);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'];
            if (!validTypes.includes(file.type)) {
                toast.error('Invalid audio format. Please use MP3, WAV, WebM, or OGG.');
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File too large. Maximum size is 10MB.');
                return;
            }

            setAudioFile(file);
            toast.success(`Selected: ${file.name}`);
        }
    };

    const handleCloneVoice = async () => {
        if (!cloneName.trim()) {
            toast.error('Please enter a name for your voice');
            return;
        }

        if (!audioFile) {
            toast.error('Please upload an audio sample');
            return;
        }

        if (!consentGiven) {
            toast.error('You must confirm that you have permission to clone this voice');
            return;
        }

        setIsCloning(true);

        try {
            const formData = new FormData();
            formData.append('audio_file', audioFile);
            formData.append('name', cloneName.trim());
            formData.append('description', cloneDescription.trim());
            formData.append('language', cloneLanguage);
            formData.append('consent_confirmed', 'true');

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-clone`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`,
                    },
                    body: formData,
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Voice cloning failed');
            }

            toast.success('Voice cloned successfully! 🎉');

            // Reset form
            setCloneName('');
            setCloneDescription('');
            setAudioFile(null);
            setConsentGiven(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Refresh voices list
            fetchVoices();
            fetchCredits();

        } catch (error) {
            console.error('Clone error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to clone voice');
        } finally {
            setIsCloning(false);
        }
    };

    const handleGenerateSpeech = async () => {
        if (!selectedVoice) {
            toast.error('Please select a voice');
            return;
        }

        if (!ttsText.trim()) {
            toast.error('Please enter text to convert to speech');
            return;
        }

        setIsGenerating(true);
        setGeneratedAudio(null);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        voice_id: selectedVoice,
                        text: ttsText.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Speech generation failed');
            }

            setGeneratedAudio(result.audio_url);
            toast.success(`Generated ${result.duration_seconds?.toFixed(1)}s of audio`);

            // Refresh credits
            fetchCredits();

        } catch (error) {
            console.error('TTS error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate speech');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteVoice = async (voiceId: string) => {
        if (!confirm('Are you sure you want to delete this voice? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('voice_clones')
                .update({ status: 'deleted' })
                .eq('id', voiceId);

            if (error) throw error;

            toast.success('Voice deleted');
            fetchVoices();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete voice');
        }
    };

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const creditUsagePercent = credits
        ? Math.round((credits.monthly_used / credits.monthly_limit) * 100)
        : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Mic className="h-8 w-8 text-primary" />
                        Voice Studio
                        <Badge variant="secondary" className="ml-2">PRO</Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Clone your voice and generate AI narrations for your videos
                    </p>
                </div>

                {/* Credits Display */}
                {credits && (
                    <Card className="w-64">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span>Monthly Credits</span>
                                <span className="font-medium">
                                    {Math.round((credits.monthly_limit - credits.monthly_used) / 60)} min left
                                </span>
                            </div>
                            <Progress value={creditUsagePercent} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                                Resets on the 1st of each month
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Tabs defaultValue="voices" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="voices">My Voices</TabsTrigger>
                    <TabsTrigger value="generate">Generate Speech</TabsTrigger>
                </TabsList>

                {/* My Voices Tab */}
                <TabsContent value="voices" className="space-y-6">
                    {/* Clone New Voice Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                                Clone New Voice
                            </CardTitle>
                            <CardDescription>
                                Upload 30+ seconds of clear speech to create a voice clone
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="voice-name">Voice Name *</Label>
                                    <Input
                                        id="voice-name"
                                        placeholder="e.g., My Professional Voice"
                                        value={cloneName}
                                        onChange={(e) => setCloneName(e.target.value)}
                                        maxLength={50}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="language">Language</Label>
                                    <Select value={cloneLanguage} onValueChange={setCloneLanguage}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_LANGUAGES.map(lang => (
                                                <SelectItem key={lang.code} value={lang.code}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe this voice (tone, use case, etc.)"
                                    value={cloneDescription}
                                    onChange={(e) => setCloneDescription(e.target.value)}
                                    maxLength={200}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Audio Sample *</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    {audioFile ? (
                                        <div>
                                            <p className="font-medium text-primary">{audioFile.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-medium">Click to upload audio</p>
                                            <p className="text-sm text-muted-foreground">
                                                MP3, WAV, WebM, or OGG (max 10MB)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Consent Checkbox - REQUIRED */}
                            <div className="flex items-start space-x-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <Checkbox
                                    id="consent"
                                    checked={consentGiven}
                                    onCheckedChange={(checked) => setConsentGiven(checked === true)}
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="consent" className="flex items-center gap-2 cursor-pointer">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        Voice Cloning Consent (Required)
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        I confirm that I am the owner of this voice OR I have explicit written permission
                                        from the voice owner to create this AI clone. I understand that unauthorized
                                        voice cloning may violate privacy laws.
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleCloneVoice}
                                disabled={isCloning || !cloneName || !audioFile || !consentGiven}
                                className="w-full"
                            >
                                {isCloning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cloning Voice...
                                    </>
                                ) : (
                                    <>
                                        <Mic className="mr-2 h-4 w-4" />
                                        Clone Voice
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Voice List */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Your Voices ({voices.length})</h2>

                        {voices.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-medium mb-1">No voices yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Clone your first voice to start generating AI narrations
                                </p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {voices.map((voice) => (
                                    <Card key={voice.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold">{voice.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {SUPPORTED_LANGUAGES.find(l => l.code === voice.language)?.name || voice.language}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {voice.total_generations} uses
                                                </Badge>
                                            </div>

                                            {voice.description && (
                                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                                    {voice.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedVoice(voice.id);
                                                        document.querySelector('[data-value="generate"]')?.dispatchEvent(
                                                            new MouseEvent('click', { bubbles: true })
                                                        );
                                                    }}
                                                >
                                                    <Volume2 className="h-3 w-3 mr-1" />
                                                    Use
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteVoice(voice.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Generate Speech Tab */}
                <TabsContent value="generate" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Volume2 className="h-5 w-5 text-primary" />
                                Text to Speech
                            </CardTitle>
                            <CardDescription>
                                Convert text to natural speech using your cloned voices
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {voices.length === 0 ? (
                                <div className="text-center py-8">
                                    <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="font-medium mb-1">No voices available</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Clone a voice first to generate speech
                                    </p>
                                    <Button variant="outline" onClick={() => {
                                        document.querySelector('[data-value="voices"]')?.dispatchEvent(
                                            new MouseEvent('click', { bubbles: true })
                                        );
                                    }}>
                                        Clone Your First Voice
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>Select Voice</Label>
                                        <Select value={selectedVoice || ''} onValueChange={setSelectedVoice}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a voice" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {voices.map(voice => (
                                                    <SelectItem key={voice.id} value={voice.id}>
                                                        {voice.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Text to Convert</Label>
                                            <span className="text-xs text-muted-foreground">
                                                {ttsText.length}/5000 characters
                                            </span>
                                        </div>
                                        <Textarea
                                            placeholder="Enter the text you want to convert to speech..."
                                            value={ttsText}
                                            onChange={(e) => setTtsText(e.target.value)}
                                            maxLength={5000}
                                            rows={6}
                                            className="resize-none"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleGenerateSpeech}
                                        disabled={isGenerating || !selectedVoice || !ttsText.trim()}
                                        className="w-full"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating Speech...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Generate Speech
                                            </>
                                        )}
                                    </Button>

                                    {/* Generated Audio Player */}
                                    {generatedAudio && (
                                        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            size="icon"
                                                            variant="secondary"
                                                            onClick={togglePlayback}
                                                            className="h-12 w-12 rounded-full"
                                                        >
                                                            {isPlaying ? (
                                                                <Pause className="h-5 w-5" />
                                                            ) : (
                                                                <Play className="h-5 w-5 ml-0.5" />
                                                            )}
                                                        </Button>
                                                        <div>
                                                            <p className="font-medium flex items-center gap-2">
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                                Audio Generated
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Ready to play or download
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const link = document.createElement('a');
                                                            link.href = generatedAudio;
                                                            link.download = 'generated-speech.mp3';
                                                            link.click();
                                                        }}
                                                    >
                                                        <Download className="h-4 w-4 mr-1" />
                                                        Download
                                                    </Button>
                                                </div>
                                                <audio
                                                    ref={audioRef}
                                                    src={generatedAudio}
                                                    onEnded={() => setIsPlaying(false)}
                                                    className="hidden"
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default VoiceStudio;
