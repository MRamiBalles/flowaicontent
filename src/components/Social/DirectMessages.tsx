import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, User, AlertTriangle, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface DM {
    id: string;
    to_user: string;
    content: string;
    timestamp: number;
    is_flagged: boolean;
}

export const DirectMessages = () => {
    const [toUser, setToUser] = useState("");
    const [message, setMessage] = useState("");
    const [sentMessages, setSentMessages] = useState<DM[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!toUser.trim() || !message.trim()) return;
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/v1/social/dm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_user: "user_demo_123",
                    to_user: toUser,
                    content: message
                })
            });

            if (res.ok) {
                const data = await res.json();
                setSentMessages(prev => [data, ...prev]);
                setMessage("");
                if (data.is_flagged) {
                    toast.warning("Message sent but flagged by COMPASS safety check.");
                } else {
                    toast.success("Direct Message sent!");
                }
            }
        } catch (err) {
            toast.error("Failed to send DM");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel rounded-xl p-6 h-full flex flex-col">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
                <Mail className="w-5 h-5 text-pink-500" />
                Direct Messages
            </h3>

            <div className="space-y-4 mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-medium ml-1">Recipient</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <Input
                            placeholder="User ID (e.g. user_456)"
                            value={toUser}
                            onChange={(e) => setToUser(e.target.value)}
                            className="bg-black/40 border-white/10 pl-9 text-sm focus:border-pink-500/50 focus:ring-pink-500/20"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-medium ml-1">Message</label>
                    <Textarea
                        placeholder="Write a private message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="bg-black/40 border-white/10 resize-none h-24 text-sm focus:border-pink-500/50 focus:ring-pink-500/20"
                    />
                </div>
                <Button
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-500/20"
                    onClick={handleSend}
                    disabled={loading || !toUser || !message}
                >
                    <Send className="w-4 h-4 mr-2" />
                    Send Private Message
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 border-t border-white/5 pt-4 custom-scrollbar">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">Recent Sent Messages</p>
                {sentMessages.length === 0 && (
                    <p className="text-xs text-zinc-600 italic text-center py-4">No messages sent yet.</p>
                )}
                {sentMessages.map((msg) => (
                    <div key={msg.id} className="text-sm bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-pink-400 text-xs">To: {msg.to_user}</span>
                            <span className="text-zinc-600 text-[10px]">{new Date(msg.timestamp * 1000).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-zinc-300 leading-relaxed">{msg.content}</p>
                        {msg.is_flagged && (
                            <div className="flex items-center gap-1 text-yellow-500 mt-2 bg-yellow-500/10 p-1.5 rounded text-xs">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Flagged for review</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
