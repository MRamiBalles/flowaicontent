import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Languages, Video, Upload, Play, Clock, CheckCircle2,
    XCircle, Loader2, Sparkles, Globe
} from 'lucide-react';

interface Language {
    code: string;
    name: string;
    native_name: string;
}

interface DubJob {
    id: string;
    source_video_url: string;
    source_language: string;
    target_languages: string[];
    status: string;
    progress_percentage: number;
    created_at: string;
    outputs: { language: string; video_url: string }[];
}

const VideoDubbing = () => {
    const { user } = useAuth();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [jobs, setJobs] = useState<DubJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [videoUrl, setVideoUrl] = useState('');
    const [sourceLanguage, setSourceLanguage] = useState('en');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            // Load languages
            const langResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-dubbing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action: 'get_languages' }),
            });
            const langData = await langResponse.json();
            if (langData.languages) setLanguages(langData.languages);

            // Load jobs
            const jobsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-dubbing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ action: 'get_my_jobs' }),
            });
            const jobsData = await jobsResponse.json();
            if (jobsData.jobs) setJobs(jobsData.jobs);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLanguageToggle = (code: string) => {
        setSelectedLanguages(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    const handleCreateJob = async () => {
        if (!videoUrl || selectedLanguages.length === 0) {
            toast.error('Please provide a video URL and select at least one target language');
            return;
        }

        setIsCreating(true);
        try {
            const session = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-dubbing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.data.session?.access_token}`,
                },
                body: JSON.stringify({
                    action: 'create_job',
                    sourceVideoUrl: videoUrl,
                    sourceLanguage,
                    targetLanguages: selectedLanguages,
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Dubbing job created!');
                setVideoUrl('');
                setSelectedLanguages([]);
                loadData();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            toast.error('Failed to create job');
        } finally {
            setIsCreating(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'default';
            case 'failed': return 'destructive';
            default: return 'secondary';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-4">
                    <Languages className="h-10 w-10 text-primary" />
                    AI Video Dubbing
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Automatically translate and dub your videos into 29 languages using your cloned voice
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Create Job Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Create New Dubbing Job
                        </CardTitle>
                        <CardDescription>
                            Upload a video and select target languages
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="video-url">Video URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="video-url"
                                    placeholder="https://example.com/video.mp4"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Source Language</Label>
                            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {languages.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            {lang.name} ({lang.native_name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Target Languages ({selectedLanguages.length} selected)</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded-lg">
                                {languages.filter(l => l.code !== sourceLanguage).map((lang) => (
                                    <div
                                        key={lang.code}
                                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer"
                                        onClick={() => handleLanguageToggle(lang.code)}
                                    >
                                        <Checkbox
                                            checked={selectedLanguages.includes(lang.code)}
                                            onCheckedChange={() => handleLanguageToggle(lang.code)}
                                        />
                                        <span className="text-sm">{lang.name}</span>
                                        <span className="text-xs text-muted-foreground">({lang.native_name})</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                <strong>Estimated Cost:</strong> ~{selectedLanguages.length * 120} credits
                            </p>
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleCreateJob}
                            disabled={isCreating || !videoUrl || selectedLanguages.length === 0}
                        >
                            {isCreating ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Globe className="h-4 w-4 mr-2" />
                            )}
                            Start Dubbing ({selectedLanguages.length} languages)
                        </Button>
                    </CardContent>
                </Card>

                {/* Jobs List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-primary" />
                            Recent Jobs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {jobs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Video className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No dubbing jobs yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobs.map((job) => (
                                    <div key={job.id} className="p-4 border rounded-lg space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{job.source_video_url}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {job.target_languages.length} languages • {new Date(job.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant={getStatusColor(job.status) as never}>
                                                {getStatusIcon(job.status)}
                                                <span className="ml-1">{job.status}</span>
                                            </Badge>
                                        </div>

                                        {job.status !== 'completed' && job.status !== 'failed' && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span>{job.status}</span>
                                                    <span>{job.progress_percentage}%</span>
                                                </div>
                                                <Progress value={job.progress_percentage} />
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-1">
                                            {job.target_languages.map((lang) => (
                                                <Badge key={lang} variant="outline" className="text-xs">
                                                    {lang.toUpperCase()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default VideoDubbing;
