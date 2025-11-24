import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Coins, Send, Zap } from 'lucide-react';
import { toast } from 'sonner';

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
            const res = await fetch(`http://localhost:8000/api/v1/social/chat/${videoId}`);
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
        const interval = setInterval(fetchChat, 2000); // Faster polling for chat
        return () => clearInterval(interval);
    }, [videoId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        try {
            const res = await fetch('http://localhost:8000/api/v1/social/chat', {
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
        <div className="flex flex-col h-[400px] border border-zinc-800 rounded-lg bg-black/40 overflow-hidden">
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Live Chat
                </h3>
                <span className="text-xs text-zinc-500 font-mono">{messages.length} msgs</span>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-3">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`text-sm ${msg.is_super_chat ? 'bg-yellow-500/10 border-l-2 border-yellow-500 p-2 rounded-r' : ''}`}>
                            <div className="flex items-baseline gap-2">
                                <span className={`font-bold text-xs ${msg.is_super_chat ? 'text-yellow-500' : 'text-zinc-400'}`}>
                                    User {msg.user_id.substring(0, 4)}
                                </span>
                                {msg.is_super_chat && (
                                    <span className="text-[10px] bg-yellow-500 text-black px-1 rounded font-bold flex items-center gap-0.5">
                                        <Zap className="w-3 h-3" /> {msg.tip_amount}
                                    </span>
                                )}
                            </div>
                            <p className="text-zinc-300 break-words">{msg.content}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 space-y-2">
                {tipAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-yellow-500 bg-yellow-500/10 p-1.5 rounded">
                        <span className="font-bold flex items-center gap-1"><Coins className="w-3 h-3" /> Super Chat Active</span>
                        <button onClick={() => setTipAmount(0)} className="hover:underline">Cancel</button>
                    </div>
                )}

                <div className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Say something..."
                        className="h-8 bg-black/50 border-zinc-700 text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button
                        size="icon"
                        className={`h-8 w-8 ${tipAmount > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}`}
                        onClick={handleSend}
                    >
                        <Send className="w-3 h-3" />
                    </Button>
                </div>

                <div className="flex gap-1 justify-end">
                    {[10, 50, 100].map(amount => (
                        <button
                            key={amount}
                            onClick={() => setTipAmount(amount)}
                            className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-yellow-500/20 hover:text-yellow-500 transition-colors text-zinc-400 border border-zinc-700"
                        >
                            +{amount} TKN
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
