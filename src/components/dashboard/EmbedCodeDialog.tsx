"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, Check, Link2, Code2, Eye, ExternalLink } from "lucide-react";
import type { ChartData } from "./ChartCanvas";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface EmbedCodeDialogProps {
  chart: ChartData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmbedCodeDialog({
  chart,
  open,
  onOpenChange,
}: EmbedCodeDialogProps) {
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Fetch share token when dialog opens
  useEffect(() => {
    if (!open || !chart.id) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/charts/${chart.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "share" }),
        });

        if (!res.ok) {
          toast.error("Failed to generate share link");
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setShareToken(data.shareToken);
        }
      } catch {
        if (!cancelled) {
          toast.error("Network error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, chart.id]);

  // Reset copy states when token changes
  useEffect(() => {
    setCopiedLink(false);
    setCopiedEmbed(false);
  }, [shareToken]);

  const shareLink = useMemo(() => {
    if (!shareToken) return "";
    if (typeof window !== "undefined") {
      return `${window.location.origin}/?share=${shareToken}`;
    }
    return `/?share=${shareToken}`;
  }, [shareToken]);

  const embedCode = useMemo(() => {
    if (!shareLink) return "";
    return `<iframe\n  src="${shareLink}"\n  width="100%"\n  height="500"\n  frameborder="0"\n  style="border: 1px solid #e5e7eb; border-radius: 12px;"\n  title="${chart.title}"\n></iframe>`;
  }, [shareLink, chart.title]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [shareLink]);

  const handleCopyEmbed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      toast.success("Embed code copied to clipboard");
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch {
      toast.error("Failed to copy embed code");
    }
  }, [embedCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Code2 className="h-4 w-4 text-primary" />
            </div>
            Share &amp; Embed
          </DialogTitle>
          <DialogDescription>
            Generate a share link or embed code for &ldquo;{chart.title}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="p-6 pt-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <span className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">
                  Generating share link&hellip;
                </p>
              </motion.div>
            ) : shareToken ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Tabs defaultValue="link" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="link" className="gap-2">
                      <Link2 className="h-3.5 w-3.5" />
                      Share Link
                    </TabsTrigger>
                    <TabsTrigger value="embed" className="gap-2">
                      <Code2 className="h-3.5 w-3.5" />
                      Embed Code
                    </TabsTrigger>
                  </TabsList>

                  {/* Share Link Tab */}
                  <TabsContent value="link" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Shareable Link
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-mono text-muted-foreground truncate">
                          {shareLink}
                        </div>
                        <Button
                          size="sm"
                          variant={copiedLink ? "default" : "outline"}
                          onClick={handleCopyLink}
                          className="shrink-0 gap-1.5"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Embed Preview */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        Embed Preview
                      </label>
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <div className="rounded-lg border border-border bg-background shadow-sm overflow-hidden">
                          {/* Mock browser bar */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                            <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                              <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                            </div>
                            <div className="flex-1 h-5 rounded bg-background border border-border/50 px-2 flex items-center">
                              <span className="text-[10px] text-muted-foreground truncate font-mono">
                                {shareLink}
                              </span>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                          {/* Mock chart area */}
                          <div className="relative h-44 bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
                            <div className="text-center space-y-2">
                              <div className="mx-auto w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Code2 className="h-5 w-5 text-primary" />
                              </div>
                              <p className="text-sm font-semibold text-foreground">
                                {chart.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Chart will render here when embedded
                              </p>
                            </div>
                            {/* Decorative mock chart bars */}
                            <div className="absolute bottom-4 left-6 right-6 flex items-end gap-1.5 h-16 opacity-20">
                              {[65, 45, 80, 55, 70, 40, 60].map((h, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${h}%` }}
                                  transition={{ delay: i * 0.06, duration: 0.4 }}
                                  className="flex-1 rounded-sm bg-primary"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Embed Code Tab */}
                  <TabsContent value="embed" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">
                          HTML Embed Code
                        </label>
                        <Button
                          size="sm"
                          variant={copiedEmbed ? "default" : "outline"}
                          onClick={handleCopyEmbed}
                          className="gap-1.5"
                        >
                          {copiedEmbed ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="rounded-xl border border-border overflow-hidden">
                        <SyntaxHighlighter
                          language="html"
                          style={oneDark}
                          customStyle={{
                            margin: 0,
                            borderRadius: 0,
                            fontSize: "0.8125rem",
                            lineHeight: "1.6",
                          }}
                          showLineNumbers={false}
                          wrapLongLines
                        >
                          {embedCode}
                        </SyntaxHighlighter>
                      </div>
                    </div>

                    {/* Usage Tips */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Usage Tips
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>
                          Paste this code into any HTML page to embed the chart
                        </li>
                        <li>
                          Adjust the <code className="font-mono bg-muted px-1 py-0.5 rounded">width</code> and{" "}
                          <code className="font-mono bg-muted px-1 py-0.5 rounded">height</code> attributes
                          to fit your layout
                        </li>
                        <li>
                          The embedded chart will update automatically when the
                          original is edited
                        </li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <ExternalLink className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Unable to generate share link. Please try again.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
