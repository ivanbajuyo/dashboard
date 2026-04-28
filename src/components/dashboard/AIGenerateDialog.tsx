"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, BarChart3, RefreshCcw, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface AIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChartGenerated: (chart: {
    title: string;
    type: string;
    labels: string[];
    data: number[];
    description: string;
  }) => void;
  collections: string[];
}

interface GeneratedChart {
  title: string;
  type: string;
  labels: string[];
  data: number[];
  description: string;
}

type DialogStep = "input" | "loading" | "preview" | "error";

export default function AIGenerateDialog({
  open,
  onOpenChange,
  onChartGenerated,
  collections,
}: AIGenerateDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [collection, setCollection] = useState<string>("");
  const [step, setStep] = useState<DialogStep>("input");
  const [generated, setGenerated] = useState<GeneratedChart | null>(null);
  const [error, setError] = useState<string>("");

  // Reset state when dialog opens / closes
  useEffect(() => {
    if (open) {
      setStep("input");
      setPrompt("");
      setGenerated(null);
      setError("");
    }
  }, [open]);

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.error("Please describe the chart you want to create.");
      return;
    }

    setStep("loading");
    setError("");

    try {
      const payload: { prompt: string; collection?: string } = { prompt: trimmed };
      if (collection) {
        payload.collection = collection;
      }

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `Generation failed (${res.status})`);
      }

      const data = await res.json();

      // Validate the response structure
      if (!data.title || !data.type || !Array.isArray(data.labels) || !Array.isArray(data.data)) {
        throw new Error("AI returned an incomplete chart. Please try again.");
      }

      const chart: GeneratedChart = {
        title: String(data.title),
        type: String(data.type),
        labels: data.labels.map(String),
        data: data.data.map(Number),
        description: String(data.description ?? ""),
      };

      setGenerated(chart);
      setStep("preview");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate chart";
      setError(message);
      setStep("error");
      toast.error(message);
    }
  }, [prompt, collection]);

  const handleCreate = useCallback(() => {
    if (!generated) return;
    onChartGenerated(generated);
    onOpenChange(false);
    toast.success(`Chart "${generated.title}" created successfully!`);
  }, [generated, onChartGenerated, onOpenChange]);

  const handleTryAgain = useCallback(() => {
    setStep("input");
    setGenerated(null);
    setError("");
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (step === "input") {
          handleGenerate();
        }
      }
    },
    [step, handleGenerate]
  );

  const isGenerating = step === "loading";
  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">
                AI Chart Generator
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Describe your chart and let AI create it for you.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            {/* ---- Input Step ---- */}
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-4 space-y-4"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="ai-prompt"
                    className="text-sm font-medium text-foreground"
                  >
                    Describe your chart
                  </label>
                  <Textarea
                    id="ai-prompt"
                    placeholder="e.g. Create a bar chart showing monthly revenue for Q1-Q4 2024..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={4}
                    className="resize-none rounded-lg text-sm leading-relaxed"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono font-medium">⌘ Enter</kbd> to generate
                  </p>
                </div>

                {collections.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Collection{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </label>
                    <Select
                      value={collection}
                      onValueChange={setCollection}
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Select a collection..." />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="pt-1">
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="w-full gap-2 rounded-lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Chart
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ---- Loading Step ---- */}
            {step === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-8 space-y-5"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                    <span className="absolute -inset-1.5 rounded-2xl border-2 border-amber-500/20 animate-ping" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Generating your chart&hellip;
                    </p>
                    <p className="text-xs text-muted-foreground">
                      AI is crafting the perfect visualization
                    </p>
                  </div>
                </div>

                {/* Skeleton preview */}
                <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-5/6 rounded" />
                    <Skeleton className="h-3 w-4/5 rounded" />
                    <Skeleton className="h-3 w-3/4 rounded" />
                  </div>
                  <div className="flex items-end gap-1.5 pt-2 h-24">
                    {[0.5, 0.7, 0.6, 0.8, 0.65, 0.9].map((h, i) => (
                      <Skeleton
                        key={i}
                        className="flex-1 rounded-t-md"
                        style={{ height: `${h * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---- Preview Step ---- */}
            {step === "preview" && generated && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="px-6 py-4 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/10">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Chart generated successfully
                  </p>
                </div>

                {/* Preview card */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {generated.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {generated.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {generated.labels.length} data points
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10 shrink-0">
                        <BarChart3 className="h-4 w-4 text-amber-500" />
                      </div>
                    </div>

                    {generated.description && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2 leading-relaxed">
                        {generated.description}
                      </p>
                    )}

                    <Separator />

                    {/* Mini data table */}
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left font-medium text-muted-foreground px-3 py-2">
                              Label
                            </th>
                            <th className="text-right font-medium text-muted-foreground px-3 py-2">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {generated.labels
                            .slice(0, 6)
                            .map((label, i) => (
                              <tr
                                key={i}
                                className="border-t border-border/30"
                              >
                                <td className="px-3 py-1.5 text-foreground truncate max-w-[180px]">
                                  {label}
                                </td>
                                <td className="px-3 py-1.5 text-right font-mono text-foreground">
                                  {generated.data[i]?.toLocaleString() ?? "—"}
                                </td>
                              </tr>
                            ))}
                          {generated.labels.length > 6 && (
                            <tr className="border-t border-border/30">
                              <td
                                colSpan={2}
                                className="px-3 py-1.5 text-center text-muted-foreground"
                              >
                                +{generated.labels.length - 6} more
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mini bar visualization */}
                    {generated.data.length > 0 && (
                      <div className="pt-1">
                        <div className="flex items-end gap-1 h-16">
                          {generated.data.slice(0, 12).map((val, i) => {
                            const max = Math.max(...generated.data);
                            const height = max > 0 ? (val / max) * 100 : 0;
                            return (
                              <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(height, 4)}%` }}
                                transition={{
                                  delay: i * 0.05,
                                  duration: 0.4,
                                  ease: "easeOut",
                                }}
                                className="flex-1 rounded-t-sm bg-gradient-to-t from-amber-500/80 to-amber-400/60 min-w-[4px]"
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---- Error Step ---- */}
            {step === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 py-8 flex flex-col items-center text-center gap-4"
              >
                <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-destructive/10">
                  <BarChart3 className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">
                    Generation failed
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[300px] leading-relaxed">
                    {error}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTryAgain}
                  className="gap-2 rounded-lg mt-1"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer — only show action buttons in preview step */}
        {step === "preview" && generated && (
          <>
            <Separator />
            <DialogFooter className="px-6 py-4 shrink-0 gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={handleTryAgain}
                className="gap-2 rounded-lg"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={handleCreate} className="gap-2 rounded-lg">
                <Check className="h-4 w-4" />
                Create Chart
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Footer — loading state */}
        {step === "loading" && (
          <>
            <Separator />
            <DialogFooter className="px-6 py-4 shrink-0">
              <Button disabled className="w-full gap-2 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating&hellip;
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
