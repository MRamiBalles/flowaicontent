import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Twitter, Linkedin, Instagram, Download, FileJson, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface GeneratedContent {
  twitter: string;
  linkedin: string;
  instagram: string;
}

interface ContentResultsProps {
  content: GeneratedContent | null;
  remainingGenerations?: number;
  rateLimitStatus?: number; // 0-100 percentage
  onRemix?: (platform: string, content: string) => void;
}

/**
 * ContentResults - Display and manage generated content
 * 
 * Features:
 * - Tabbed interface for 3 platforms (Twitter, LinkedIn, Instagram)
 * - Copy to clipboard with visual feedback
 * - Download individual platform content as .txt
 * - Bulk export as JSON or CSV
 * - Remix button to regenerate specific platform
 * - Rate limit progress bar
 * 
 * Export Formats:
 * - JSON: Pretty-printed with 2-space indent
 * - CSV: Escaped quotes, platform + content columns
 * 
 * @param content - Generated content for all platforms
 * @param remainingGenerations - Number of generations left (0-10)
 * @param rateLimitStatus - Percentage used (0-100)
 * @param onRemix - Callback to regenerate specific platform
 */
export const ContentResults = ({ content, remainingGenerations, rateLimitStatus, onRemix }: ContentResultsProps) => {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  /**
   * Copy content to clipboard and show success feedback
   * Resets copy icon after 2 seconds
   */
  const copyToClipboard = async (text: string, platform: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    toast.success(`${platform} content copied!`);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  /**
   * Download single platform content as text file
   * Creates blob, triggers download, then cleanup
   */
  const downloadContent = (text: string, platform: string, extension: string = 'txt') => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}-content.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${platform} content`);
  };

  /**
   * Export all content in JSON or CSV format
   * 
   * JSON: Pretty-printed for readability
   * CSV: Escaped quotes for Excel compatibility
   */
  const downloadAll = (format: 'json' | 'csv') => {
    if (!content) return;

    let contentStr = '';
    let mimeType = '';
    let extension = '';

    if (format === 'json') {
      contentStr = JSON.stringify(content, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // CSV format with proper escaping
      const headers = ['Platform', 'Content'];
      const rows = Object.entries(content).map(([platform, text]) => {
        // Excel-compatible quote escaping (double quotes)
        const safePlatform = platform.replace(/"/g, '""');
        const safeText = (text as string).replace(/"/g, '""');
        return `"${safePlatform}","${safeText}"`;
      });

      contentStr = [headers.join(','), ...rows].join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([contentStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-content.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded all content as ${format.toUpperCase()}`);
  };

  // Empty state: Show placeholder with rate limit
  if (!content) {
    return (
      <div className="flex flex-col h-full">
        {typeof remainingGenerations !== 'undefined' && (
          <div className="px-6 pt-6 pb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Hourly Generation Limit</span>
              <span className="font-medium">{remainingGenerations}/10 remaining</span>
            </div>
            <Progress value={rateLimitStatus} className="h-2" />
          </div>
        )}
        <div className="flex-1 flex items-center justify-center p-6">
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
      </div>
    );
  }

  // Content display: Tabbed interface with actions
  return (
    <div className="flex flex-col h-full">
      {/* Rate limit indicator */}
      {typeof remainingGenerations !== 'undefined' && (
        <div className="px-6 pt-6 pb-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Hourly Generation Limit</span>
            <span className="font-medium">{remainingGenerations}/10 remaining</span>
          </div>
          <Progress value={rateLimitStatus} className="h-2" />
        </div>
      )}

      {/* Bulk export buttons */}
      <div className="px-6 pt-4 flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => downloadAll('json')}>
          <FileJson className="w-4 h-4 mr-2" />
          JSON
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadAll('csv')}>
          <FileText className="w-4 h-4 mr-2" />
          CSV
        </Button>
      </div>

      {/* Platform tabs */}
      <Tabs defaultValue="twitter" className="flex-1 flex flex-col">
        <div className="border-b border-border px-6 pt-2">
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
          {/* Twitter tab - Thread format */}
          <TabsContent value="twitter" className="mt-0">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Twitter Thread
                  <div className="flex gap-2">
                    {onRemix && (
                      <Button variant="ghost" size="sm" onClick={() => onRemix("twitter", content.twitter)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadContent(content.twitter, "twitter")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
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
                  </div>
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

          {/* LinkedIn tab - Professional post */}
          <TabsContent value="linkedin" className="mt-0">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  LinkedIn Post
                  <div className="flex gap-2">
                    {onRemix && (
                      <Button variant="ghost" size="sm" onClick={() => onRemix("linkedin", content.linkedin)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadContent(content.linkedin, "linkedin")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
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
                  </div>
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

          {/* Instagram tab - Reel script */}
          <TabsContent value="instagram" className="mt-0">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Instagram Script
                  <div className="flex gap-2">
                    {onRemix && (
                      <Button variant="ghost" size="sm" onClick={() => onRemix("instagram", content.instagram)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadContent(content.instagram, "instagram")}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
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
                  </div>
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
