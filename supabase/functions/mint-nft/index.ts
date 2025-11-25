import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { video_id, title, description, wallet_address } = await req.json();

    if (!video_id || !title || !wallet_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: video_id, title, wallet_address" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // Store NFT record in database (you'll need to create this table)
    // await supabaseClient.from('nfts').insert({
    //   id: mockNFT.nft_id,
    //   user_id: user.id,
    //   video_id: video_id,
    //   contract_address: mockNFT.contract_address,
    //   token_id: mockNFT.token_id,
    //   transaction_hash: mockNFT.transaction_hash,
    //   title: title,
    //   description: description,
    //   total_shares: mockNFT.total_shares,
    //   network: mockNFT.network
    // });

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
