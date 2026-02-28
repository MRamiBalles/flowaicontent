import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createErrorResponse } from "../_shared/error-sanitizer.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MintNFTSchema = z.object({
  video_id: z.string().uuid("Invalid video ID"),
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().trim().max(1000).optional(),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentMints } = await supabaseAdmin
      .from("nft_transactions")
      .select("*", { count: "exact", head: true })
      .eq("transaction_type", "mint")
      .gte("created_at", windowStart);

    if (recentMints !== null && recentMints >= 10) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Maximum 10 mints per hour." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
        status: 429,
      });
    }

    const body = await req.json();
    const validation = MintNFTSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({
        error: "Validation failed",
        details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { video_id, title, description, wallet_address } = validation.data;

    const mockNFT = {
      success: true,
      contract_address: "0x" + "0".repeat(40),
      token_id: Math.floor(Math.random() * 10000),
      transaction_hash: "0x" + "a".repeat(64),
      video_id, title, description,
      owner: wallet_address,
      total_shares: 1000000,
      minted_at: new Date().toISOString(),
      network: "polygon-amoy",
      nft_id: "",
    };

    const { data: insertedNft, error: nftError } = await supabaseClient.from('nfts').insert({
      video_id, user_id: user.id,
      contract_address: mockNFT.contract_address,
      token_id: mockNFT.token_id,
      transaction_hash: mockNFT.transaction_hash,
      title, description,
      total_shares: mockNFT.total_shares,
      network: mockNFT.network
    }).select().single();

    if (nftError) throw nftError;

    await supabaseClient.from('nft_transactions').insert({
      nft_id: insertedNft.id,
      transaction_type: 'mint',
      to_address: wallet_address,
      shares: 1000000,
      transaction_hash: mockNFT.transaction_hash
    });

    mockNFT.nft_id = insertedNft.id;

    return new Response(JSON.stringify(mockNFT), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return createErrorResponse(error, corsHeaders, { functionName: "mint-nft" });
  }
});
