import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, Send, Zap, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

interface ChatMessage {
    id: string;
    user_id: string;
    content: string;
    timestamp: number;
    is_super_chat: boolean;
    tip_amount: number;
}

export const LiveChat = ({ videoId }: { videoId: string }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [tipAmount, setTipAmount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchChat = async () => {
        try {
            const res = await fetch(`${API_URL}/social/chat/${videoId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchChat();
        const interval = setInterval(fetchChat, 2000);
        return () => clearInterval(interval);
    }, [videoId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        // Check for !emote command
        const emoteMatch = newMessage.match(/^!emote\s+(.+)$/i);
        if (emoteMatch) {
            const emoteName = emoteMatch[1].trim();
            toast.success(`🎨 Generating emote: "${emoteName}"`, {
                description: "Your custom emote will be available for 5 minutes!",
                duration: 3000,
            });

            // Add system message showing the "generated" emote
            const emoteMessage: ChatMessage = {
                id: `emote_${Date.now()}`,
                user_id: "SYSTEM",
                content: `🎨 ${newMessage.substring(0, 4)} created emote: :${emoteName.toLowerCase().replace(/\s+/g, '_')}:`,
                timestamp: Date.now() / 1000,
                is_super_chat: false,
                tip_amount: 0
            };

            setMessages(prev => [...prev, emoteMessage]);
            setNewMessage("");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/social/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: "user_demo_123",
                    video_id: videoId,
                    content: newMessage,
                    tip_amount: tipAmount
                })
            });

            if (res.ok) {
                setNewMessage("");
                setTipAmount(0);
                fetchChat();
                if (tipAmount > 0) toast.success(`Super Chat sent! (-${tipAmount} TKN)`);
            }
        } catch (err) {
            toast.error("Failed to send message");
        }
    };

    return (
        <div className="flex flex-col h-[500px] glass-panel rounded-xl overflow-hidden border-zinc-800/50">
            <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center backdrop-blur-sm">
                <h3 className="font-bold text-sm flex items-center gap-2 text-white">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Live Chat
                </h3>
                <span className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">{messages.length} online</span>
            </div>

            <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-transparent to-black/20" ref={scrollRef}>
                <div className="space-y-3">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.is_super_chat ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 p-3 rounded-lg shadow-lg shadow-yellow-500/5' : ''}`}>
                            <div className="flex items-baseline gap-2 mb-0.5">
                                <span className={`font-bold text-xs ${msg.is_super_chat ? 'text-yellow-400' : 'text-zinc-400'}`}>
                                    User {msg.user_id.substring(0, 4)}
                                </span>
                                {msg.is_super_chat && (
                                    <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shadow-sm">
                                        <Zap className="w-3 h-3 fill-black" /> {msg.tip_amount}
                                    </span>
                                )}
                                <span className="text-[10px] text-zinc-600 ml-auto">{new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className={`break-words ${msg.is_super_chat ? 'text-white font-medium text-base' : 'text-zinc-300'}`}>{msg.content}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 bg-black/40 border-t border-white/5 space-y-3 backdrop-blur-md">
                {tipAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20 animate-in fade-in slide-in-from-bottom-2">
                        <span className="font-bold flex items-center gap-2"><Coins className="w-4 h-4" /> Super Chat Active</span>
                        <button onClick={() => setTipAmount(0)} className="hover:text-white transition-colors underline decoration-dotted">Cancel</button>
                    </div>
                )}

                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={tipAmount > 0 ? "Write your Super Chat message..." : "Type !emote [name] or say something..."}
                        className={`h-10 bg-black/50 border-white/10 text-sm focus:ring-purple-500/20 ${tipAmount > 0 ? 'border-yellow-500/30 focus:border-yellow-500/50' : ''}`}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button
                        size="icon"
                        className={`h-10 w-10 shrink-0 ${tipAmount > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/20' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                        onClick={handleSend}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex gap-2 justify-end">
                    {[10, 50, 100].map(amount => (
                        <button
                            key={amount}
                            onClick={() => setTipAmount(amount)}
                            className={`text-[10px] px-3 py-1 rounded-full transition-all duration-300 border ${tipAmount === amount ? 'bg-yellow-500 text-black border-yellow-500 font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-yellow-500/50 hover:text-yellow-500'}`}
                        >
                            +{amount} TKN
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
