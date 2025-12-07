import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    // Join would provide profile info, mocking for MVP speed or create a view
    profiles?: {
        username?: string;
        avatar_url?: string;
    }
}

export function CommentSection({ videoId }: { videoId: string }) {
    const { user } = useUser();
    const queryClient = useQueryClient();
    const [newComment, setNewComment] = useState("");

    // Fetch comments
    const { data: comments, isLoading } = useQuery({
        queryKey: ["comments", videoId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("comments")
                .select(`
            *,
            profiles:user_id (
                username, avatar_url
            )
        `)
                .eq("video_id", videoId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            // Use "any" casting effectively because relation types might not be auto-generated yet
            return data as any[];
        }
    });

    // Post comment
    const postMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!user) throw new Error("Login required");
            const { error } = await supabase
                .from("comments")
                .insert({
                    video_id: videoId,
                    user_id: user.id,
                    content
                });
            if (error) throw error;
        },
        onSuccess: () => {
            setNewComment("");
            queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
            toast.success("Comment posted");
        },
        onError: () => toast.error("Failed to post comment")
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        postMutation.mutate(newComment);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold">Comments ({comments?.length || 0})</h3>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-4">
                <Avatar>
                    <AvatarFallback>{user?.email?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 gap-2 flex flex-col items-end">
                    <Textarea
                        placeholder="Add a constructive comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] bg-background"
                    />
                    <Button disabled={postMutation.isPending || !newComment.trim()} size="sm">
                        {postMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4 mr-2" />}
                        Post
                    </Button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                ) : (
                    comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={comment.profiles?.avatar_url} />
                                <AvatarFallback>{comment.profiles?.username?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{comment.profiles?.username || "Anonymous User"}</span>
                                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                                </div>
                                <p className="text-sm text-foreground/90">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
