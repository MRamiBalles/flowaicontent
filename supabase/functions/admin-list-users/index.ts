// admin-list-users edge function (Deno runtime)
// Returns a list of all users (id, email, role) for admins only.
// Uses the has_role RPC for authorization and logs the request in audit_log.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * No request body needed. Caller must provide Authorization: Bearer <jwt>
 */
export const handler = async (req: Request) => {
    // ---- Authenticate caller -------------------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    const { data: caller, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !caller?.user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    // ---- Authorization: must be admin ----------------------------------------
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
        user_id: caller.user.id,
        role_name: "admin",
    });
    if (roleErr || !isAdmin) {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    // ---- Fetch users from auth.users ----------------------------------------
    const { data: users, error: usersErr } = await supabase
        .from("auth.users")
        .select("id, email, user_metadata")
        .order("created_at", { ascending: true });

    if (usersErr) {
        return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    // ---- Fetch roles --------------------------------------------------------
    const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role");

    if (rolesErr) {
        return new Response(JSON.stringify({ error: "Failed to fetch roles" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    const roleMap = new Map<string, string>();
    for (const r of roles ?? []) {
        roleMap.set(r.user_id, r.role);
    }

    const result = users?.map((u) => ({
        id: u.id,
        email: u.email,
        role: roleMap.get(u.id) ?? "user",
    }));

    // ---- Audit log ----------------------------------------------------------
    await supabase.from("audit_log").insert({
        actor_id: caller.user.id,
        target_user_id: null,
        action: "list_users",
        details: JSON.stringify({ count: result?.length ?? 0 }),
    });

    return new Response(JSON.stringify({ users: result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
};
