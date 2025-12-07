import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, CheckCircle2, XCircle, User, Calendar, Mail } from "lucide-react";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface GenerationHistory {
    id: string;
    created_at: string;
    project: {
        title: string;
    } | null;
}

const Settings = () => {
    const navigate = useNavigate();
    const { user, isAdmin, loading: authLoading } = useUser();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [displayName, setDisplayName] = useState("");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [generationCount, setGenerationCount] = useState(0);
    const [history, setHistory] = useState<GenerationHistory[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/auth");
        } else if (user) {
            fetchData(user.id);
        }
    }, [user, authLoading, navigate]);

    const fetchData = async (userId: string) => {
        setLoading(true);
        try {
            // Fetch profile
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (profileData) {
                setProfile(profileData);
                setDisplayName(profileData.full_name || "");
            }

            // Fetch generation count (last hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const { count } = await supabase
                .from("generation_attempts")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", userId)
                .gte("created_at", oneHourAgo);

            if (count !== null) {
                setGenerationCount(count);
            }

            // Fetch history
            const { data } = await supabase
                .from("generation_attempts")
                .select(`
          id,
          created_at,
          project:projects(title)
        `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (data) {
                setHistory(data as any);
            }
        } catch (error) {
            console.error("Error fetching settings data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setIsUpdatingProfile(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ full_name: displayName })
                .eq("id", user.id);

            if (error) throw error;
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    if (authLoading || !user) return null;

    const remainingGenerations = Math.max(0, 10 - generationCount);
    const rateLimitStatus = Math.min(100, (generationCount / 10) * 100);

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="flex-1 overflow-auto p-8 bg-muted/30 min-h-screen">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Manage your account and view usage statistics</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your account details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                value={user.email}
                                                disabled
                                                className="pl-9 bg-muted"
                                            />
                                        </div>
                                        {user.email_confirmed_at ? (
                                            <div className="flex items-center text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Verified
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-yellow-600 text-xs font-medium bg-yellow-100 px-2 py-1 rounded-full whitespace-nowrap">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Unverified
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="displayName"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Account Created</Label>
                                    <div className="flex items-center text-sm text-muted-foreground bg-muted p-2 rounded-md">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {user.created_at ? format(new Date(user.created_at), "MMMM d, yyyy") : "Unknown"}
                                    </div>
                                </div>

                                <Button
                                    onClick={handleUpdateProfile}
                                    disabled={isUpdatingProfile}
                                    className="w-full"
                                >
                                    {isUpdatingProfile ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Usage Limits</CardTitle>
                                <CardDescription>Your generation usage for the current hour</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Generations Used</span>
                                        <span className="text-muted-foreground">{generationCount} / 10</span>
                                    </div>
                                    <Progress value={rateLimitStatus} className="h-2" />
                                    <p className="text-xs text-muted-foreground">
                                        {remainingGenerations} generations remaining this hour. Limit resets hourly.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <AnalyticsDashboard />

                    <Card>
                        <CardHeader>
                            <CardTitle>Generation History</CardTitle>
                            <CardDescription>Recent content generation attempts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Project</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    No history available
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            history.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        {format(new Date(item.created_at), "MMM d, yyyy HH:mm")}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.project?.title || "Unknown Project"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Completed
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default Settings;
