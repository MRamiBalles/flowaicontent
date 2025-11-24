import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export function AuditLogs() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ["admin-audit-logs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("admin_audit_logs")
                .select(`
          *,
          admin:admin_id(email),
          target:target_user_id(email)
        `)
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) throw error;
            return data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Security Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
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
                        {logs?.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                                </TableCell>
                                <TableCell className="font-medium">{log.action}</TableCell>
                                <TableCell>{log.admin?.email || log.admin_id}</TableCell>
                                <TableCell>{log.target?.email || log.target_user_id}</TableCell>
                                <TableCell className="font-mono text-xs">
                                    {JSON.stringify(log.details)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
