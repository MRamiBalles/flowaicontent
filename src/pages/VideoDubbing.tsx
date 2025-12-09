/**
 * VideoDubbing.tsx
 * 
 * AI video dubbing page - translates videos into 29 languages.
 * Uses OpenAI for translation and ElevenLabs for voice synthesis.
 * 
 * @module pages/VideoDubbing
 */

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
import { Languages, Video, CheckCircle2, XCircle, Loader2, Sparkles, Globe, Coins } from 'lucide-react';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/** Supported dubbing language */
interface Language {
    code: string;
    name: string;
    native_name: string;
}

/** Dubbing job with status and outputs */
interface DubJob {
    id: string;
    source_video_url: string;
    source_language: string;
    target_languages: string[];
    /** Job status: pending | processing | completed | failed */
    status: string;
    /** Progress 0-100 */
    progress_percentage: number;
    created_at: string;
    /** Generated dubbed video URLs per language */
    outputs: { language: string; video_url: string }[];
}

// ============================================================
// CONSTANTS
// ============================================================

/** Credit cost per target language */
const CREDIT_COST_PER_LANGUAGE = 10;

// ============================================================
// COMPONENT
// ============================================================

/**
 * Video dubbing page component.
 * Allows users to translate videos into multiple languages.
 */
const VideoDubbing = () => {
    const { user } = useAuth();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [jobs, setJobs] = useState<DubJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);

    const [videoUrl, setVideoUrl] = useState('');
    const [sourceLanguage, setSourceLanguage] = useState('en');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            loadData();
            fetchBalance();
        }
    }, [user]);

    const fetchBalance = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('billing-engine', {
                body: { action: 'get_balance' }
            });
            if (!error && data) setBalance(data.balance);
        } catch (e) {
            console.error('Balance fetch error:', e);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const langResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-dubbing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action: 'get_languages' }),
            });
            const langData = await langResponse.json();
            if (langData.languages) setLanguages(langData.languages);

            const jobsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-dubbing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const handleCreateJob = async () => {
        if (!videoUrl || selectedLanguages.length === 0) {
            toast.error('Please provide a video URL and select at least one target language');
            return;
        }

        const cost = selectedLanguages.length * CREDIT_COST_PER_LANGUAGE;

        setIsCreating(true);
        try {
            // 1. Deduct Credits
            const { error: billingError } = await supabase.functions.invoke('billing-engine', {
                body: { action: 'deduct_credits', amount: cost, service: 'video_dubbing', metadata: { url: videoUrl, languages: selectedLanguages } }
            });

            if (billingError) {
                toast.error('Insufficient credits. Please purchase more.');
                return;
            }

            // 2. Create Job
            const session = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-dubbing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.data.session?.access_token}` },
                body: JSON.stringify({ action: 'create_job', sourceVideoUrl: videoUrl, sourceLanguage, targetLanguages: selectedLanguages }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Dubbing job started! (-${cost} credits)`);
                setVideoUrl('');
                setSelectedLanguages([]);
                loadData();
                fetchBalance();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error(error);
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const estimatedCost = selectedLanguages.length * CREDIT_COST_PER_LANGUAGE;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="flex justify-end mb-4">
                    <Badge variant="secondary" className="px-3 py-1 text-sm">
                        <Coins className="w-4 h-4 mr-2" />
                        {balance !== null ? balance.toLocaleString() : '...'} Credits
                    </Badge>
                </div>
                <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-4">
                    <Languages className="h-10 w-10 text-primary" />
                    AI Video Dubbing
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Automatically translate and dub your videos into 29 languages
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
                        <CardDescription>Upload a video and select target languages</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="video-url">Video URL</Label>
                            <Input
                                id="video-url"
                                placeholder="https://example.com/video.mp4"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Source Language</Label>
                            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                        <Checkbox checked={selectedLanguages.includes(lang.code)} />
                                        <span className="text-sm">{lang.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-sm font-medium flex justify-between">
                                <span>Estimated Cost:</span>
                                <span className="text-primary font-bold">{estimatedCost} credits</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {CREDIT_COST_PER_LANGUAGE} credits per language
                            </p>
                        </div>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleCreateJob}
                            disabled={isCreating || !videoUrl || selectedLanguages.length === 0}
                        >
                            {isCreating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
                            Start Dubbing ({estimatedCost} Credits)
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
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                {getStatusIcon(job.status)}
                                                <span>{job.status}</span>
                                            </Badge>
                                        </div>
                                        {job.status !== 'completed' && job.status !== 'failed' && (
                                            <Progress value={job.progress_percentage} />
                                        )}
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
