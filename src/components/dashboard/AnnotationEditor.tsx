"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  Save,
  Type,
  FileText,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChartData } from "./ChartCanvas";
import { TYPE_LABELS } from "./ChartCanvas";

// ==================== Types ====================

interface Annotation {
  id: string;
  chartId: string;
  label: string;
  dataIndex: number;
  text: string;
  color: string;
  createdAt?: string;
}

interface AnnotationEditorProps {
  chart: ChartData;
  onClose: () => void;
  onAnnotationAdded: () => void;
}

// ==================== Constants ====================

const ANNOTATION_COLORS = [
  { name: "Red", value: "red", dot: "bg-red-500", ring: "ring-red-500/30", text: "text-red-600 dark:text-red-400" },
  { name: "Blue", value: "blue", dot: "bg-blue-500", ring: "ring-blue-500/30", text: "text-blue-600 dark:text-blue-400" },
  { name: "Green", value: "green", dot: "bg-emerald-500", ring: "ring-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400" },
  { name: "Amber", value: "amber", dot: "bg-amber-500", ring: "ring-amber-500/30", text: "text-amber-600 dark:text-amber-400" },
  { name: "Purple", value: "purple", dot: "bg-violet-500", ring: "ring-violet-500/30", text: "text-violet-600 dark:text-violet-400" },
];

function getColorDot(value: string): string {
  return ANNOTATION_COLORS.find((c) => c.value === value)?.dot || "bg-gray-500";
}

function getColorText(value: string): string {
  return ANNOTATION_COLORS.find((c) => c.value === value)?.text || "text-muted-foreground";
}

// ==================== Component ====================

export default function AnnotationEditor({
  chart,
  onClose,
  onAnnotationAdded,
}: AnnotationEditorProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState(false);
  const [activeDataIndex, setActiveDataIndex] = useState<number | null>(null);
  const [annotationText, setAnnotationText] = useState("");
  const [selectedColor, setSelectedColor] = useState("green");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch existing annotations
  const fetchAnnotations = useCallback(async () => {
    setIsLoadingAnnotations(true);
    try {
      const res = await fetch(`/api/annotations?chartId=${chart.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnnotations(Array.isArray(data) ? data : data.annotations || []);
      }
    } catch {
      // Silently fail - annotations are optional
    } finally {
      setIsLoadingAnnotations(false);
    }
  }, [chart.id]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  // Start adding annotation for a data point
  const startAnnotation = useCallback((dataIndex: number) => {
    setActiveDataIndex(dataIndex);
    setAnnotationText("");
    setSelectedColor("green");
  }, []);

  // Cancel annotation
  const cancelAnnotation = useCallback(() => {
    setActiveDataIndex(null);
    setAnnotationText("");
  }, []);

  // Save annotation
  const saveAnnotation = useCallback(async () => {
    if (activeDataIndex === null) return;
    if (!annotationText.trim()) {
      toast.error("Please enter annotation text");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        chartId: chart.id,
        label: chart.labels[activeDataIndex],
        dataIndex: activeDataIndex,
        text: annotationText.trim(),
        color: selectedColor,
      };

      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newAnnotation = await res.json();
        setAnnotations((prev) => [...prev, newAnnotation]);
        toast.success("Annotation added");
        setAnnotationText("");
        setActiveDataIndex(null);
        onAnnotationAdded();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save annotation");
      }
    } catch {
      toast.error("Network error while saving");
    } finally {
      setIsSaving(false);
    }
  }, [activeDataIndex, annotationText, selectedColor, chart, onAnnotationAdded]);

  // Delete annotation
  const deleteAnnotation = useCallback(async (annotationId: string) => {
    setIsDeleting(annotationId);
    try {
      const res = await fetch(`/api/annotations/${annotationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
        toast.success("Annotation deleted");
        onAnnotationAdded();
      } else {
        toast.error("Failed to delete annotation");
      }
    } catch {
      toast.error("Network error while deleting");
    } finally {
      setIsDeleting(null);
    }
  }, [onAnnotationAdded]);

  // Get annotations for a specific data index
  const getAnnotationsForIndex = useCallback(
    (dataIndex: number) => {
      return annotations.filter((a) => a.dataIndex === dataIndex);
    },
    [annotations]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Annotations</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add notes to data points in &quot;{chart.title}&quot;
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl"
          aria-label="Close annotation editor"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Chart Info */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{chart.title}</span>
        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full shrink-0">
          {TYPE_LABELS[chart.type]}
        </span>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {annotations.length} annotation{annotations.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Annotations List */}
      {isLoadingAnnotations ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading annotations...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {chart.labels.map((label, dataIndex) => {
            const pointAnnotations = getAnnotationsForIndex(dataIndex);
            const isActive = activeDataIndex === dataIndex;
            const value = chart.data[dataIndex] ?? 0;

            return (
              <motion.div
                key={dataIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dataIndex * 0.02, duration: 0.2 }}
                className={`rounded-xl border transition-all ${
                  isActive
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                }`}
              >
                {/* Data Point Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">
                      {dataIndex + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{label}</span>
                      <span className="text-xs font-semibold text-muted-foreground shrink-0">
                        {value.toLocaleString()}
                      </span>
                    </div>
                    {/* Show annotation count */}
                    {pointAnnotations.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {pointAnnotations.map((ann) => (
                          <span
                            key={ann.id}
                            className={`inline-block w-2 h-2 rounded-full ${getColorDot(ann.color)}`}
                            title={ann.text}
                          />
                        ))}
                        <span className="text-[10px] text-muted-foreground">
                          {pointAnnotations.length} note{pointAnnotations.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      isActive ? cancelAnnotation() : startAnnotation(dataIndex)
                    }
                    className="rounded-lg shrink-0"
                    disabled={activeDataIndex !== null && !isActive}
                  >
                    {isActive ? (
                      <>Cancel</>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        Note
                      </>
                    )}
                  </Button>
                </div>

                {/* Inline Annotation Editor */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
                        <Textarea
                          placeholder="Write your annotation..."
                          value={annotationText}
                          onChange={(e) => setAnnotationText(e.target.value)}
                          className="min-h-[80px] rounded-lg text-sm resize-none"
                          autoFocus
                        />

                        {/* Color Picker */}
                        <div className="flex items-center gap-2">
                          <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground font-medium shrink-0">
                            Color:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {ANNOTATION_COLORS.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => setSelectedColor(color.value)}
                                className={`w-6 h-6 rounded-full ${color.dot} transition-all ${
                                  selectedColor === color.value
                                    ? `ring-2 ${color.ring} ring-offset-2 ring-offset-background scale-110`
                                    : "opacity-60 hover:opacity-100 hover:scale-105"
                                }`}
                                title={color.name}
                                aria-label={`Select ${color.name} color`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelAnnotation}
                            className="rounded-lg"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveAnnotation}
                            disabled={isSaving || !annotationText.trim()}
                            className="rounded-lg"
                          >
                            {isSaving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            Save Note
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Existing Annotations */}
                <AnimatePresence>
                  {pointAnnotations.length > 0 && !isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-4 pb-3 space-y-2"
                    >
                      {pointAnnotations.map((ann) => (
                        <motion.div
                          key={ann.id}
                          layout
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/50 group"
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${getColorDot(ann.color)} mt-0.5 shrink-0`}
                          />
                          <p className="flex-1 text-sm text-foreground leading-relaxed">
                            {ann.text}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => deleteAnnotation(ann.id)}
                            disabled={isDeleting === ann.id}
                            aria-label="Delete annotation"
                          >
                            {isDeleting === ann.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {!isLoadingAnnotations && annotations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <p className="text-xs text-muted-foreground">
            {annotations.length} annotation{annotations.length !== 1 ? "s" : ""} across{" "}
            {new Set(annotations.map((a) => a.dataIndex)).size} data point
            {new Set(annotations.map((a) => a.dataIndex)).size !== 1 ? "s" : ""}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
