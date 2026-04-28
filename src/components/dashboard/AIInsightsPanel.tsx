"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, RotateCcw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import type { ChartData } from "./ChartCanvas";

interface AIInsightsPanelProps {
  chart: ChartData;
}

type PanelState = "closed" | "idle" | "loading" | "loaded" | "error";

export default function AIInsightsPanel({ chart }: AIInsightsPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [insights, setInsights] = useState<string>("");
  const [error, setError] = useState<string>("");

  const isOpen = panelState !== "closed";
  const isLoading = panelState === "loading";

  const handleToggle = useCallback(() => {
    if (isOpen) {
      setPanelState("closed");
      return;
    }
    setPanelState("idle");
    setInsights("");
    setError("");
  }, [isOpen]);

  const handleGenerate = useCallback(async () => {
    setPanelState("loading");
    setError("");

    try {
      const payload = {
        title: chart.title,
        type: chart.type,
        labels: chart.labels,
        data: chart.data,
        description: chart.description ?? "",
      };

      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const markdown: string = data.insights ?? data.markdown ?? data.text ?? "";
      if (!markdown) {
        throw new Error("No insights returned from AI");
      }
      setInsights(markdown);
      setPanelState("loaded");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate insights";
      setError(message);
      setPanelState("error");
    }
  }, [chart]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  return (
    <>
      {/* Toggle button — always visible when panel is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={handleToggle}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 rounded-l-xl border border-r-0 border-border/60 bg-background/90 backdrop-blur-xl shadow-lg shadow-black/5 pl-3 pr-2.5 py-2.5 text-sm font-medium text-foreground hover:bg-accent/80 transition-colors"
            aria-label="Open AI Insights"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">Insights</span>
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground sm:ml-0.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-in panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] md:w-[460px] bg-background border-l border-border/60 shadow-2xl shadow-black/10 flex flex-col"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight">
                    AI Insights
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {chart.title}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className="h-8 w-8 p-0 rounded-lg hover:bg-accent"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Panel body */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Idle state — prompt to generate */}
                {panelState === "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex flex-col items-center text-center gap-4 py-12"
                  >
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                      <Sparkles className="h-7 w-7 text-amber-500" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-foreground">
                        Analyze this chart
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                        Get AI-powered insights, trends, and observations about
                        your <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mx-0.5">{chart.type}</Badge> chart
                        data.
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerate}
                      className="gap-2 rounded-lg mt-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate Insights
                    </Button>
                  </motion.div>
                )}

                {/* Loading state */}
                {panelState === "loading" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 py-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Analyzing your chart&hellip;
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-[90%] rounded" />
                      <Skeleton className="h-4 w-[80%] rounded" />
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-[70%] rounded" />
                      <Skeleton className="h-4 w-[85%] rounded" />
                      <Skeleton className="h-4 w-[60%] rounded" />
                    </div>
                    <div className="space-y-3 pt-2">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-[75%] rounded" />
                      <Skeleton className="h-4 w-[90%] rounded" />
                      <Skeleton className="h-4 w-[50%] rounded" />
                    </div>
                  </motion.div>
                )}

                {/* Error state */}
                {panelState === "error" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center gap-4 py-10"
                  >
                    <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-destructive/10">
                      <X className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-foreground">
                        Something went wrong
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                        {error}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRegenerate}
                      className="gap-2 rounded-lg mt-1"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                  </motion.div>
                )}

                {/* Loaded state — rendered markdown */}
                {panelState === "loaded" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-4"
                  >
                    <Card className="border-0 shadow-none bg-muted/40">
                      <CardContent className="p-4">
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-code:text-primary prose-pre:bg-muted [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:leading-relaxed">
                          <ReactMarkdown>{insights}</ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRegenerate}
                        className="gap-2 rounded-lg"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Regenerate
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm sm:hidden"
            onClick={handleToggle}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
