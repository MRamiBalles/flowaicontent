import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, ShieldAlert, Send } from 'lucide-react';
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
        const interval = setInterval(fetchComments, 5000); // Poll for updates
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
        <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                Comments <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">{comments.length}</span>
            </h3>

            <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div className="flex-1 gap-2 flex">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment... (COMPASS AI is watching)"
                        className="min-h-[40px] h-[40px] resize-none bg-zinc-900/50 border-zinc-800 focus:ring-purple-500/20"
                    />
                    <Button size="icon" onClick={handlePost} disabled={loading || !newComment.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {comments.slice().reverse().map((comment) => (
                    <div key={comment.id} className={`flex gap-3 p-3 rounded-lg ${comment.is_toxic ? 'bg-red-900/10 border border-red-900/20' : 'bg-zinc-900/30'}`}>
                        <Avatar className="w-8 h-8">
                            <AvatarFallback>{comment.user_id.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-zinc-300">User {comment.user_id.substring(0, 4)}</span>
                                <span className="text-[10px] text-zinc-500">{new Date(comment.timestamp * 1000).toLocaleTimeString()}</span>
                            </div>

                            {comment.is_toxic ? (
                                <div className="flex items-start gap-2 text-red-400 text-sm">
                                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="italic opacity-80">Content hidden by COMPASS Moderation</p>
                                        <p className="text-[10px] mt-1 uppercase font-bold tracking-wider">Flags: {comment.moderation_flags.join(", ")}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-400">{comment.content}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
