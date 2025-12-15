/**
 * Edge Function: mint-nft
 * 
 * Mints video NFTs on blockchain with fractional ownership.
 * 
 * Features:
 * - NFT minting for videos (mock blockchain currently)
 * - Fractional ownership (1,000,000 shares per NFT)
 * - Rate limiting: 10 mints/hour per user
 * - Zod validation for inputs
 * - Transaction logging
 * 
 * Blockchain:
 * - Network: Polygon Amoy (testnet)
 * - Total shares: 1,000,000 per NFT
 * - Contract: ERC-1155 fractional NFT standard
 * 
 * Mock Implementation:
 * - Currently returns mock transaction hash
 * - Stores in database (nfts, nft_transactions tables)
 * - TODO: Deploy actual smart contracts for production
 * 
 * Production Requirements:
 * - Deploy Python backend service for blockchain interaction
 * - Configure Web3 signer with private key
 * - Set POLYGON_RPC_URL environment variable
 * - Deploy fractional NFT smart contracts
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation schema for NFT minting request
const MintNFTSchema = z.object({
  video_id: z.string().min(1, "Video ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  wallet_address: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Invalid Ethereum wallet address format"
  ),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate Limiting - 10 transactions per hour per user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const RATE_LIMIT = 10;
    const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();

    const { count: recentMints, error: countError } = await supabaseAdmin
      .from("nft_transactions")
      .select("*", { count: "exact", head: true })
      .eq("transaction_type", "mint")
      .gte("created_at", windowStart)
      .eq("to_address", user.user_metadata?.wallet_address);

    if (recentMints !== null && recentMints >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Maximum 10 mints per hour.",
          retryAfter: "1 hour",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "3600",
          },
          status: 429,
        }
      );
    }

    const body = await req.json();

    // Validate request body with Zod
    const validation = MintNFTSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validation.error.format()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { video_id, title, description, wallet_address } = validation.data;

    // In production, this would call the Python backend service
    // For now, return mock data
    const mockNFT = {
      success: true,
      nft_id: `nft_${Date.now()}`,
      contract_address: "0x" + "0".repeat(40),
      token_id: Math.floor(Math.random() * 10000),
      transaction_hash: "0x" + "a".repeat(64),
      video_id: video_id,
      title: title,
      description: description,
      owner: wallet_address,
      total_shares: 1000000,
      minted_at: new Date().toISOString(),
      network: "polygon-amoy",
      explorer_url: `https://amoy.polygonscan.com/tx/0x${"a".repeat(64)}`,
      message: "NFT minted successfully! Deploy smart contracts to enable real blockchain minting.",
    };

    // Store NFT record in database
    // Store NFT record in database
    const { data: insertedNft, error: nftError } = await supabaseClient.from('nfts').insert({
      video_id: video_id,
      user_id: user.id,
      contract_address: mockNFT.contract_address,
      token_id: mockNFT.token_id,
      transaction_hash: mockNFT.transaction_hash,
      title: title,
      description: description,
      total_shares: mockNFT.total_shares,
      network: mockNFT.network
    }).select().single();

    if (nftError) throw nftError;

    // Log transaction
    await supabaseClient.from('nft_transactions').insert({
      nft_id: insertedNft.id,
      transaction_type: 'mint',
      to_address: wallet_address,
      shares: 1000000,
      transaction_hash: mockNFT.transaction_hash
    });

    // Update mock response with real ID
    mockNFT.nft_id = insertedNft.id;


    return new Response(JSON.stringify(mockNFT), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error minting NFT:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
