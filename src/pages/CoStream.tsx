import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    Bot,
    MessageSquare,
    Mic,
    Play,
    Pause,
    Settings,
    Sparkles,
    Users,
    Radio,
    Share2,
    Trash2,
    Send,
    Loader2
} from 'lucide-react';

interface Companion {
    id: string;
    name: string;
    personality: string;
    avatar_url?: string;
    voice_id?: string;
    is_active: boolean;
}

interface ChatMessage {
    id: string;
    sender_name: string;
    message: string;
    is_ai_response: boolean;
    sender_type: string;
}

interface Session {
    id: string;
    status: string;
    companion: Companion;
    total_messages: number;
    ai_responses: number;
    realtime_channel_id: string;
}

const CoStream = () => {
    const { user } = useAuth();
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // New companion form
    const [showNewCompanionDialog, setShowNewCompanionDialog] = useState(false);
    const [newCompanion, setNewCompanion] = useState({
        name: '',
        personality: 'friendly',
        avatar_url: '',
    });

    useEffect(() => {
        if (user) {
            loadCompanions();
        }
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    useEffect(() => {
        if (activeSession) {
            // Subscribe to realtime chat
            const channel = supabase
                .channel(activeSession.realtime_channel_id)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'stream_chat_messages',
                    filter: `session_id=eq.${activeSession.id}`,
                }, (payload) => {
                    setChatMessages(prev => [...prev, payload.new as ChatMessage]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [activeSession]);

    const callApi = async (action: string, data?: Record<string, unknown>) => {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/costream`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, data }),
            }
        );
        return response.json();
    };

    const loadCompanions = async () => {
        setIsLoading(true);
        try {
            const result = await callApi('list_companions');
            if (result.success) {
                setCompanions(result.companions || []);
            }
        } catch (error) {
            console.error('Error loading companions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCompanion = async () => {
        try {
            const result = await callApi('create_companion', newCompanion);
            if (result.success) {
                setCompanions([result.companion, ...companions]);
                setShowNewCompanionDialog(false);
                toast.success('AI Companion created!');
                setNewCompanion({ name: '', personality: 'friendly', avatar_url: '' });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast.error('Failed to create companion');
        }
    };

    const startSession = async (companionId: string) => {
        try {
            const result = await callApi('start_session', {
                companion_id: companionId,
                title: 'Live Co-Stream',
                platform: 'custom'
            });

            if (result.success) {
                const companion = companions.find(c => c.id === companionId);
                if (companion) {
                    setActiveSession({
                        id: result.session_id,
                        status: 'active',
                        realtime_channel_id: result.channel_id,
                        total_messages: 0,
                        ai_responses: 0,
                        companion
                    });
                    setChatMessages([]);
                    toast.success(`Session started with ${companion.name}`);
                }
            }
        } catch (error) {
            toast.error('Failed to start session');
        }
    };

    const endSession = async () => {
        if (!activeSession) return;
        try {
            const result = await callApi('end_session', { session_id: activeSession.id });
            if (result.success) {
                setActiveSession(null);
                setChatMessages([]);
                toast.success('Session ended');
            }
        } catch (error) {
            toast.error('Failed to end session');
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSession || !newMessage.trim()) return;

        try {
            // Send user message
            await callApi('send_message', {
                session_id: activeSession.id,
                message: newMessage,
                sender_type: 'streamer'
            });

            const prompt = newMessage;
            setNewMessage('');

            // Trigger AI response
            await callApi('generate_ai_response', {
                session_id: activeSession.id,
                prompt: prompt
            });

        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (activeSession) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl h-[calc(100vh-100px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* Main Stream Area */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <Card className="flex-1 bg-black/95 border-primary/20 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-pulse" />

                            <div className="text-center z-10 space-y-4">
                                <div className="relative inline-block">
                                    <Avatar className="h-32 w-32 border-4 border-primary ring-4 ring-primary/20 animate-bounce">
                                        <AvatarImage src={activeSession.companion.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeSession.companion.id}`} />
                                        <AvatarFallback><Bot className="h-16 w-16" /></AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <Radio className="h-3 w-3 animate-pulse" />
                                        LIVE
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold font-mono text-white">{activeSession.companion.name} is Co-Streaming</h2>
                                    <p className="text-white/60">Interacting with chat • {activeSession.companion.personality} mode</p>
                                </div>
                            </div>

                            {/* Overlay stats */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur">
                                    <Users className="h-3 w-3 mr-1" /> 102 Viewers (Demo)
                                </Badge>
                                <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur">
                                    <MessageSquare className="h-3 w-3 mr-1" /> {chatMessages.length} Msgs
                                </Badge>
                            </div>

                            <div className="absolute top-4 right-4">
                                <Button variant="destructive" size="sm" onClick={endSession}>
                                    End Stream
                                </Button>
                            </div>
                        </Card>

                        {/* AI Controls */}
                        <Card>
                            <CardContent className="p-4 flex gap-4 items-center">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm mb-1">AI Status</h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Listening to chat...
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <Mic className="h-4 w-4 mr-2" />
                                        Mute AI
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chat Panel */}
                    <Card className="flex flex-col h-full border-l-4 border-l-primary/20">
                        <CardHeader className="py-3 border-b bg-muted/30">
                            <CardTitle className="text-sm font-medium flex items-center justify-between">
                                <span>Stream Chat</span>
                                <Badge variant="outline" className="text-xs font-normal">
                                    <Radio className="h-3 w-3 mr-1 text-red-500" /> Live
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                                <div className="space-y-4">
                                    {chatMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 ${msg.is_ai_response ? 'bg-primary/5 -mx-4 px-4 py-2 border-l-2 border-primary' : ''}`}
                                        >
                                            <Avatar className="h-8 w-8 mt-1">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_name}`} />
                                                <AvatarFallback>{msg.sender_name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`font-semibold text-sm ${msg.is_ai_response ? 'text-primary' : ''}`}>
                                                        {msg.sender_name}
                                                    </span>
                                                    {msg.is_ai_response && (
                                                        <Badge variant="secondary" className="h-4 text-[10px] px-1">AI</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-foreground/90 break-words leading-relaxed">
                                                    {msg.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {chatMessages.length === 0 && (
                                        <div className="text-center text-muted-foreground py-8 text-sm">
                                            Chat is quiet... Say hello! 👋
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t bg-background">
                                <form onSubmit={sendMessage} className="flex gap-2">
                                    <Input
                                        placeholder="Send a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Dashboard / Companion List
    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Radio className="h-8 w-8 text-primary animate-pulse" />
                        Live Co-Streaming
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Stream with intelligent AI companions that engage your audience
                    </p>
                </div>
                <Dialog open={showNewCompanionDialog} onOpenChange={setShowNewCompanionDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Bot className="h-4 w-4 mr-2" />
                            New Companion
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create AI Companion</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={newCompanion.name}
                                    onChange={(e) => setNewCompanion({ ...newCompanion, name: e.target.value })}
                                    placeholder="e.g. CyberBot 3000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Personality</label>
                                <Select
                                    value={newCompanion.personality}
                                    onValueChange={(val) => setNewCompanion({ ...newCompanion, personality: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="friendly">Friendly & Helpful</SelectItem>
                                        <SelectItem value="sarcastic">Sarcastic & Witty</SelectItem>
                                        <SelectItem value="educational">Educational & Smart</SelectItem>
                                        <SelectItem value="hype">Hype & Energetic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full" onClick={handleCreateCompanion}>
                                Create Companion
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : companions.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Companions Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Create your first AI streaming partner to get started
                    </p>
                    <Button onClick={() => setShowNewCompanionDialog(true)}>
                        Create Companion
                    </Button>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companions.map((companion) => (
                        <Card key={companion.id} className="hover:border-primary/50 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                                        <AvatarImage src={companion.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${companion.id}`} />
                                        <AvatarFallback><Bot /></AvatarFallback>
                                    </Avatar>
                                    <Badge variant={companion.is_active ? "default" : "secondary"}>
                                        {companion.is_active ? 'Ready' : 'Inactive'}
                                    </Badge>
                                </div>

                                <h3 className="font-bold text-xl mb-1">{companion.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize mb-4">
                                    {companion.personality} Personality
                                </p>

                                <div className="flex gap-2">
                                    <Button className="flex-1" onClick={() => startSession(companion.id)}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Start Stream
                                    </Button>
                                    <Button variant="outline" size="icon">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoStream;
