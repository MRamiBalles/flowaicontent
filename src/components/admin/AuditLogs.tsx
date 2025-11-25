import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Filter, X, Search, Download, FileJson, FileText } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
    id: string;
    admin_id: string;
    admin_email: string;
    admin_name: string | null;
    action: string;
    target_user_id: string | null;
    target_email: string | null;
    target_name: string | null;
    details: Record<string, any> | null;
    created_at: string;
}

interface AuditLogsResponse {
    logs: AuditLog[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

export function AuditLogs() {
    const [page, setPage] = useState(1);
    const [action, setAction] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    const [showFilters, setShowFilters] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["admin-audit-logs", page, action, startDate, endDate, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: "50"
            });

            if (action) params.append("action", action);
            if (startDate) params.append("startDate", new Date(startDate).toISOString());
            if (endDate) params.append("endDate", new Date(endDate).toISOString());
            if (search) params.append("search", search);

            const { data, error } = await supabase.functions.invoke("admin-audit-logs", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (error) throw error;
            
            // Manually construct URL with params since invoke doesn't support query params well
            const { data: session } = await supabase.auth.getSession();
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(
                `${supabaseUrl}/functions/v1/admin-audit-logs?${params}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.session?.access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to fetch audit logs");
            }

            return await response.json() as AuditLogsResponse;
        },
    });

    const clearFilters = () => {
        setAction("");
        setStartDate("");
        setEndDate("");
        setSearch("");
        setPage(1);
    };

    const exportToCSV = () => {
        if (!data?.logs.length) return;

        const headers = ["Timestamp", "Action", "Admin Email", "Admin Name", "Target Email", "Target Name", "Details"];
        const csvContent = [
            headers.join(","),
            ...data.logs.map(log => [
                format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
                log.action,
                log.admin_email,
                log.admin_name || "",
                log.target_email || "",
                log.target_name || "",
                `"${JSON.stringify(log.details).replace(/"/g, '""')}"`,
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Export successful",
            description: `Exported ${data.logs.length} audit logs to CSV`,
        });
    };

    const exportToJSON = () => {
        if (!data?.logs.length) return;

        const jsonContent = JSON.stringify(data.logs, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Export successful",
            description: `Exported ${data.logs.length} audit logs to JSON`,
        });
    };

    // Real-time subscription for new audit logs
    useEffect(() => {
        const channel = supabase
            .channel('admin-audit-logs-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_audit_logs',
                },
                (payload) => {
                    const newLog = payload.new as any;
                    
                    // Show toast notification for critical actions
                    const criticalActions = ['change_role', 'delete_user', 'suspend_user'];
                    if (criticalActions.includes(newLog.action)) {
                        toast({
                            title: "🔔 Critical Admin Action",
                            description: `Action: ${newLog.action} at ${format(new Date(newLog.created_at), "HH:mm:ss")}`,
                            variant: "default",
                        });
                    }

                    // Refresh the query
                    queryClient.invalidateQueries({ queryKey: ["admin-audit-logs"] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [toast, queryClient]);

    const logs = data?.logs || [];
    const pagination = data?.pagination;

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const hasActiveFilters = action || startDate || endDate || search;

    return (
        <Card>
            <CardHeader className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle>Security Audit Logs</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportToCSV}
                            disabled={!data?.logs.length}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportToJSON}
                            disabled={!data?.logs.length}
                        >
                            <FileJson className="h-4 w-4 mr-2" />
                            JSON
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showFilters ? "Hide" : "Filter"}
                        </Button>
                    </div>
                </div>

                {/* Search bar - always visible */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs by action, email, name, or details..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="pl-10"
                    />
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-2">
                            <Label htmlFor="action">Action Type</Label>
                            <Select value={action} onValueChange={setAction}>
                                <SelectTrigger id="action">
                                    <SelectValue placeholder="All actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All actions</SelectItem>
                                    <SelectItem value="change_role">Change Role</SelectItem>
                                    <SelectItem value="delete_user">Delete User</SelectItem>
                                    <SelectItem value="suspend_user">Suspend User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        {hasActiveFilters && (
                            <div className="flex items-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="w-full"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Target User</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No audit logs found
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                                    </TableCell>
                                    <TableCell className="font-medium">{log.action}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{log.admin_name || "Unknown"}</span>
                                            <span className="text-xs text-muted-foreground">{log.admin_email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {log.target_user_id ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium">{log.target_name || "Unknown"}</span>
                                                <span className="text-xs text-muted-foreground">{log.target_email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs max-w-xs truncate">
                                        {JSON.stringify(log.details)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{" "}
                            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
                            {pagination.total} logs
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={pagination.page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <div className="text-sm">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={pagination.page === pagination.totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
