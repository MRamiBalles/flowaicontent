import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

interface GenerationHistory {
    id: string;
    created_at: string;
    project: {
        title: string;
    } | null;
}

const Settings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [generationCount, setGenerationCount] = useState(0);
    const [history, setHistory] = useState<GenerationHistory[]>([]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate("/auth");
            } else {
                setUser(session.user);
                fetchData(session.user.id);
            }
        });
    }, [navigate]);

    const fetchData = async (userId: string) => {
        setLoading(true);
        try {
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

    if (!user) return null;

    const remainingGenerations = Math.max(0, 10 - generationCount);
    const rateLimitStatus = Math.min(100, (generationCount / 10) * 100);

    return (
        <div className="flex h-screen overflow-hidden">
            <ProjectSidebar
                selectedProjectId={null}
                onSelectProject={() => navigate("/")}
                onNewProject={() => navigate("/")}
            />

            <div className="flex-1 overflow-auto p-8 bg-muted/30">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Manage your account and view usage statistics</p>
                    </div>

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
        </div>
    );
};

export default Settings;
