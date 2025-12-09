import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Image, Sparkles, Loader2, Download, Copy, Wand2, Coins } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    category: string;
    description: string;
    is_premium: boolean;
}

interface Generation {
    id: string;
    title: string;
    image_url: string;
    status: string;
    style_preset: string;
    created_at: string;
}

const STYLE_PRESETS = [
    { value: 'vibrant', label: '🌈 Vibrant', desc: 'Bold, eye-catching colors' },
    { value: 'minimal', label: '✨ Minimal', desc: 'Clean and simple' },
    { value: 'dramatic', label: '🎬 Dramatic', desc: 'Cinematic lighting' },
    { value: 'retro', label: '📼 Retro', desc: '80s synthwave vibes' },
    { value: 'neon', label: '💜 Neon', desc: 'Cyberpunk glow' },
    { value: 'professional', label: '💼 Professional', desc: 'Corporate and clean' },
];

const CREDIT_COST = 5; // Updated pricing

const ThumbnailGenerator = () => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [stylePreset, setStylePreset] = useState('vibrant');
    const [customPrompt, setCustomPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

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

            const [templatesRes, generationsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-thumbnail`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ action: 'get_templates' }),
                }),
                fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-thumbnail`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ action: 'get_my_generations' }),
                }),
            ]);

            const templatesData = await templatesRes.json();
            const generationsData = await generationsRes.json();

            if (templatesData.templates) setTemplates(templatesData.templates);
            if (generationsData.generations) setGenerations(generationsData.generations);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title for your thumbnail');
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            // 1. Deduct Credits
            const { error: billingError } = await supabase.functions.invoke('billing-engine', {
                body: { action: 'deduct_credits', amount: CREDIT_COST, service: 'thumbnail_gen', metadata: { title } }
            });

            if (billingError) {
                toast.error('Insufficient credits. Please purchase more.');
                return;
            }

            // 2. Generate Image
            const session = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-thumbnail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.data.session?.access_token}` },
                body: JSON.stringify({ action: 'generate', title, description, templateId: selectedTemplate, stylePreset, customPrompt }),
            });

            const data = await response.json();
            if (data.success && data.imageUrl) {
                setGeneratedImage(data.imageUrl);
                toast.success(`Thumbnail generated! (-${CREDIT_COST} credits)`);
                loadData();
                fetchBalance();
            } else {
                throw new Error(data.error || 'Generation failed');
            }
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success('URL copied to clipboard');
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
                <div className="flex justify-end mb-4">
                    <Badge variant="secondary" className="px-3 py-1 text-sm">
                        <Coins className="w-4 h-4 mr-2" />
                        {balance !== null ? balance.toLocaleString() : '...'} Credits
                    </Badge>
                </div>
                <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-4">
                    <Wand2 className="h-10 w-10 text-primary" />
                    AI Thumbnail Generator
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Create stunning, CTR-optimized thumbnails with AI in seconds
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Generator Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Generate Thumbnail
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title">Video Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., 10 Tips to Boost Your Productivity"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of your video content..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Style Preset</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {STYLE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => setStylePreset(preset.value)}
                                        className={`p-3 text-left rounded-lg border transition-all ${stylePreset === preset.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="font-medium text-sm">{preset.label}</div>
                                        <div className="text-xs text-muted-foreground">{preset.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Template (optional)</Label>
                            <Select value={selectedTemplate || ''} onValueChange={setSelectedTemplate}>
                                <SelectTrigger><SelectValue placeholder="Choose a template..." /></SelectTrigger>
                                <SelectContent>
                                    {templates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name} - {t.category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom">Custom Instructions (optional)</Label>
                            <Textarea
                                id="custom"
                                placeholder="Add any specific details you want in the thumbnail..."
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <p className="text-sm font-medium flex justify-between">
                                <span>Generation Cost:</span>
                                <span className="text-primary font-bold">{CREDIT_COST} credits</span>
                            </p>
                        </div>

                        <Button className="w-full" size="lg" onClick={handleGenerate} disabled={isGenerating || !title.trim()}>
                            {isGenerating ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                            ) : (
                                <><Sparkles className="h-4 w-4 mr-2" /> Generate Thumbnail ({CREDIT_COST} Credits)</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Result & History */}
                <div className="space-y-6">
                    {generatedImage && (
                        <Card className="border-primary">
                            <CardHeader>
                                <CardTitle className="text-green-500 flex items-center gap-2">✓ Generated Thumbnail</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <img src={generatedImage} alt="Generated thumbnail" className="w-full rounded-lg shadow-lg mb-4" />
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => window.open(generatedImage, '_blank')}>
                                        <Download className="h-4 w-4 mr-2" /> Download
                                    </Button>
                                    <Button variant="outline" className="flex-1" onClick={() => copyToClipboard(generatedImage)}>
                                        <Copy className="h-4 w-4 mr-2" /> Copy URL
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="h-5 w-5" /> Recent Thumbnails
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {generations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Image className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>No thumbnails generated yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {generations.slice(0, 6).map((gen) => (
                                        <div key={gen.id} className="group relative">
                                            {gen.image_url ? (
                                                <img src={gen.image_url} alt={gen.title} className="w-full aspect-video object-cover rounded-lg" />
                                            ) : (
                                                <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                <p className="text-white text-xs text-center px-2 line-clamp-2">{gen.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ThumbnailGenerator;
