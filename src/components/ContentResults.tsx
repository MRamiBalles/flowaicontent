import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Twitter, Linkedin, Instagram } from "lucide-react";
import { toast } from "sonner";

interface GeneratedContent {
  twitter: string;
  linkedin: string;
  instagram: string;
}

interface ContentResultsProps {
  content: GeneratedContent | null;
}

export const ContentResults = ({ content }: ContentResultsProps) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  const copyToClipboard = async (text: string, platform: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    toast.success(`${platform} content copied!`);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  if (!content) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Twitter className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No content generated yet</h3>
          <p className="text-muted-foreground">
            Enter your original content and click "Generate Content" to see the magic happen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="twitter" className="flex-1 flex flex-col">
        <div className="border-b border-border px-6 pt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="twitter" className="space-x-2">
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="space-x-2">
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </TabsTrigger>
            <TabsTrigger value="instagram" className="space-x-2">
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <TabsContent value="twitter" className="mt-0">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Twitter Thread
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(content.twitter, "Twitter")}
                  >
                    {copiedPlatform === "Twitter" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Optimized 5-tweet thread for maximum engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {content.twitter}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linkedin" className="mt-0">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  LinkedIn Post
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(content.linkedin, "LinkedIn")}
                  >
                    {copiedPlatform === "LinkedIn" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Professional post with strong hooks and engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {content.linkedin}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instagram" className="mt-0">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Instagram Script
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(content.instagram, "Instagram")}
                  >
                    {copiedPlatform === "Instagram" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Short, punchy script for Reels/TikTok
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {content.instagram}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
