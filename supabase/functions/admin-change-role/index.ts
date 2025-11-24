// admin-change-role edge function (Deno runtime)
// This function updates a user's role atomically, prevents self‑demotion, ensures at least one admin remains,
// and logs the change to the audit_log table.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Expected JSON body:
 * { "target_user_id": "uuid", "new_role": "admin|moderator|user" }
 */
export const handler = async (req: Request) => {
    // Authenticate caller via JWT
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: caller, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !caller?.user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
    }

    // Verify caller has admin role
    const { data: hasAdmin, error: roleErr } = await supabase.rpc("has_role", {
        user_id: caller.user.id,
        role_name: "admin",
    });
    if (roleErr || !hasAdmin) {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), { status: 403 });
    }

    const { target_user_id, new_role } = await req.json();
    if (!target_user_id || !new_role) {
        return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    // Prevent self‑demotion
    if (caller.user.id === target_user_id && new_role !== "admin") {
        return new Response(JSON.stringify({ error: "Cannot demote yourself" }), { status: 400 });
    }

    // Ensure at least one admin remains after change
    if (new_role !== "admin") {
        const { count, error: cntErr } = await supabase
            .from("user_roles")
            .select("id", { count: "exact", head: true })
            .eq("role", "admin");
        if (cntErr) {
            return new Response(JSON.stringify({ error: "Failed to verify admin count" }), { status: 500 });
        }
        // If the target is the only admin, block the change
        if (count === 1) {
            const { data: targetRole } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", target_user_id)
                .single();
            if (targetRole?.role === "admin") {
                return new Response(JSON.stringify({ error: "At least one admin must remain" }), { status: 400 });
            }
        }
    }

    // Perform atomic role update within a transaction (using RPC wrapper)
    const { data: updateRes, error: updErr } = await supabase.rpc("update_user_role", {
        target_user_id,
        new_role,
    });
    if (updErr) {
        return new Response(JSON.stringify({ error: "Role update failed", details: updErr.message }), { status: 500 });
    }

    // Audit log entry
    await supabase.from("audit_log").insert({
        actor_id: caller.user.id,
        target_user_id,
        action: "role_change",
        details: JSON.stringify({ new_role }),
    });

    return new Response(JSON.stringify({ success: true, updated: updateRes }), { status: 200 });
};
