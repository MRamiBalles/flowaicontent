/**
 * Edge Function: admin-audit-logs
 * 
 * Retrieves paginated audit logs with user email enrichment (admin-only).
 * 
 * Features:
 * - Pagination support (page, pageSize)
 * - Filtering by action, admin, date range
 * - Search across emails, names, actions
 * - User email enrichment (from auth.users)
 * 
 * Process:
 * 1. Verify admin authentication
 * 2. Build filtered query
 * 3. Fetch logs from admin_audit_logs table
 * 4. Enrich with user emails from auth.users
 * 5. Enrich with display names from profiles
 * 6. Apply search filter post-enrichment
 * 7. Return paginated results
 * 
 * Search Implementation:
 * - Pre-fetches more records (1000) for search
 * - Filters after enrichment (email/name not in DB)
 * - Searches: action, admin_email, admin_name, target_email, target_name, details
 * 
 * Performance Note:
 * - Search queries fetch 1000 records maximum
 * - For large datasets, consider DB-level full-text search
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { corsHeaders } from '../_shared/cors.ts'

interface AuditLogWithEmails {
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

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Not authenticated')
        }

        // Check if user is admin using secure RPC
        const { data: isAdmin, error: roleError } = await supabaseClient
            .rpc('has_role', {
                _user_id: user.id,
                _role: 'admin'
            });

        if (roleError || !isAdmin) {
            throw new Error('Unauthorized: Admin access required')
        }

        // Get query parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
        const action = url.searchParams.get('action');
        const adminId = url.searchParams.get('adminId');
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        const search = url.searchParams.get('search');

        // Use service role to access auth.users
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Build query with filters
        let query = supabaseAdmin
            .from('admin_audit_logs')
            .select('*', { count: 'exact' });

        if (action) {
            query = query.eq('action', action);
        }

        if (adminId) {
            query = query.eq('admin_id', adminId);
        }

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        // Get all logs for search (we'll filter after enrichment if search is provided)
        let allLogs = [];
        if (search) {
            // Fetch more records for search filtering
            const { data: searchLogs, error: searchError } = await query
                .order('created_at', { ascending: false })
                .limit(1000); // Get more logs for searching

            if (searchError) throw searchError;
            allLogs = searchLogs || [];
        }

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let logs = allLogs;
        let count = 0;

        if (!search) {
            const { data: paginatedLogs, error: logsError, count: totalCount } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (logsError) throw logsError;
            logs = paginatedLogs || [];
            count = totalCount || 0;
        }

        // Fetch user emails from auth.users
        const adminIds = [...new Set(logs?.map(log => log.admin_id) || [])];
        const targetIds = [...new Set(logs?.map(log => log.target_user_id).filter(Boolean) || [])];
        const allUserIds = [...new Set([...adminIds, ...targetIds])];

        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw usersError;

        // Fetch profiles for names
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .in('id', allUserIds);

        if (profilesError) throw profilesError;

        // Create lookup maps
        const userEmailMap = new Map(users.map(u => [u.id, u.email]));
        const profileNameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        // Enrich logs with email and name data
        let enrichedLogs: AuditLogWithEmails[] = logs?.map(log => ({
            ...log,
            admin_email: userEmailMap.get(log.admin_id) || 'Unknown',
            admin_name: profileNameMap.get(log.admin_id) || null,
            target_email: log.target_user_id ? (userEmailMap.get(log.target_user_id) || 'Unknown') : null,
            target_name: log.target_user_id ? (profileNameMap.get(log.target_user_id) || null) : null,
        })) || [];

        // Apply search filter after enrichment
        if (search) {
            const searchLower = search.toLowerCase();
            enrichedLogs = enrichedLogs.filter(log =>
                log.action.toLowerCase().includes(searchLower) ||
                log.admin_email.toLowerCase().includes(searchLower) ||
                (log.admin_name?.toLowerCase().includes(searchLower) || false) ||
                (log.target_email?.toLowerCase().includes(searchLower) || false) ||
                (log.target_name?.toLowerCase().includes(searchLower) || false) ||
                JSON.stringify(log.details).toLowerCase().includes(searchLower)
            );

            count = enrichedLogs.length;

            // Apply pagination to search results
            enrichedLogs = enrichedLogs.slice(from, to + 1);
        }

        return new Response(JSON.stringify({
            logs: enrichedLogs,
            pagination: {
                page,
                pageSize,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / pageSize)
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
