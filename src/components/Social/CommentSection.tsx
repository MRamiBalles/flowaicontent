import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, ShieldAlert, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
    id: string;
    user_id: string;
    content: string;
    timestamp: number;
    is_toxic: boolean;
    moderation_flags: string[];
}

export const CommentSection = ({ videoId }: { videoId: string }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/social/comments/${videoId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchComments();
        const interval = setInterval(fetchComments, 5000);
        return () => clearInterval(interval);
    }, [videoId]);

    const handlePost = async () => {
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/v1/social/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: "user_demo_123",
                    video_id: videoId,
                    content: newComment
                })
            });

            if (res.ok) {
                const comment = await res.json();
                if (comment.is_toxic) {
                    toast.warning("Your comment was flagged by COMPASS AI moderation.");
                } else {
                    toast.success("Comment posted!");
                }
                setNewComment("");
                fetchComments();
            }
        } catch (err) {
            toast.error("Failed to post comment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel rounded-xl p-6 h-full flex flex-col">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4 text-white">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Comments <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-zinc-300">{comments.length}</span>
            </h3>

            <div className="flex gap-3 mb-6">
                <Avatar className="w-10 h-10 ring-2 ring-purple-500/20">
                    <AvatarFallback className="bg-purple-900/50 text-purple-200">ME</AvatarFallback>
                </Avatar>
                <div className="flex-1 gap-2 flex flex-col">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment... (COMPASS AI is watching)"
                        className="min-h-[80px] resize-none bg-black/20 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 text-sm"
                    />
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            onClick={handlePost}
                            disabled={loading || !newComment.trim()}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Send className="w-3 h-3 mr-2" /> Post
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {comments.slice().reverse().map((comment) => (
                    <div key={comment.id} className={`flex gap-3 p-4 rounded-xl transition-all ${comment.is_toxic ? 'bg-red-900/10 border border-red-900/20' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}>
                        <Avatar className="w-8 h-8 ring-1 ring-white/10">
                            <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">{comment.user_id.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-zinc-200">User {comment.user_id.substring(0, 4)}</span>
                                <span className="text-[10px] text-zinc-500">{new Date(comment.timestamp * 1000).toLocaleTimeString()}</span>
                            </div>

                            {comment.is_toxic ? (
                                <div className="flex items-start gap-2 text-red-400 text-sm mt-1 bg-red-950/30 p-2 rounded-lg">
                                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="italic opacity-80 text-xs">Content hidden by COMPASS Moderation</p>
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {comment.moderation_flags.map(flag => (
                                                <span key={flag} className="text-[9px] uppercase font-bold tracking-wider bg-red-500/20 px-1.5 py-0.5 rounded text-red-300">{flag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>
                            )}
                        </div>
                    </div>
                ))}
                {comments.length === 0 && (
                    <div className="text-center py-8 text-zinc-600 italic text-sm">
                        No comments yet. Be the first to share your thoughts!
                    </div>
                )}
            </div>
        </div>
    );
};
