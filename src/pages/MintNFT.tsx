import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Video, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useUser } from "@/hooks/useUser";
import { AppLayout } from "@/components/layout/AppLayout";

export default function MintNFT() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<any>(null);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { user, isAdmin } = useUser();

  const handleMint = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint NFTs",
        variant: "destructive",
      });
      return;
    }

    if (!title || !videoId) {
      toast({
        title: "Missing information",
        description: "Please provide both title and video ID",
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);
    setMintResult(null);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke("mint-nft", {
        body: {
          video_id: videoId,
          title: title,
          description: description,
          wallet_address: address,
        },
      });

      if (functionError) throw functionError;

      setMintResult(functionData);
      toast({
        title: "NFT Minted!",
        description: `Successfully minted "${title}" as an NFT`,
      });
    } catch (error: any) {
      console.error("Minting error:", error);
      toast({
        title: "Minting failed",
        description: error.message || "Failed to mint NFT",
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <AppLayout user={user} isAdmin={isAdmin}>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Mint Video NFT</h1>
            <p className="text-muted-foreground">
              Transform your AI-generated videos into blockchain assets
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                NFT Details
              </CardTitle>
              <CardDescription>
                Enter the details for your video NFT. Each NFT will be fractionalized into 1,000,000 shares.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Wallet className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Connect your wallet to mint NFTs</p>
                  <ConnectButton />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="wallet">Connected Wallet</Label>
                    <Input
                      id="wallet"
                      value={address}
                      disabled
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-id">Video ID</Label>
                    <Input
                      id="video-id"
                      placeholder="video_123abc"
                      value={videoId}
                      onChange={(e) => setVideoId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The ID of your generated video
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">NFT Title</Label>
                    <Input
                      id="title"
                      placeholder="Epic AI-Generated Cinematic"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your video NFT..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {description.length}/500 characters
                    </p>
                  </div>

                  <Button
                    onClick={handleMint}
                    disabled={isMinting || !title || !videoId}
                    className="w-full"
                    size="lg"
                  >
                    {isMinting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Minting NFT...
                      </>
                    ) : (
                      "Mint as NFT"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {mintResult && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-primary">✅ NFT Minted Successfully!</CardTitle>
                <CardDescription>
                  Your video has been minted as a Fractional NFT on Polygon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contract Address</p>
                    <p className="text-sm font-mono break-all">{mintResult.contract_address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Token ID</p>
                    <p className="text-sm font-mono">{mintResult.token_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
                    <p className="text-sm">{mintResult.total_shares?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Network</p>
                    <p className="text-sm capitalize">{mintResult.network}</p>
                  </div>
                </div>

                {mintResult.explorer_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={mintResult.explorer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      View on Polygonscan
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {mintResult.message && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">{mintResult.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>What are Fractional NFTs?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Fractional NFTs allow multiple people to own shares of a single NFT. When you mint a video:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Your video is locked in a smart contract</li>
                <li>1,000,000 fungible share tokens are created</li>
                <li>You receive all shares initially</li>
                <li>You can sell shares to others on the marketplace</li>
                <li>Share holders can earn revenue from your video</li>
                <li>If one person owns all shares, they can redeem the original NFT</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
