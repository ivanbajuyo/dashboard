"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Save,
  X,
  BarChart3,
  AlertCircle,
  Database,
} from "lucide-react";
import type { ChartData, ChartDataset } from "./ChartCanvas";

// Color palette for dataset indicators
const DATASET_COLORS = [
  "hsl(220, 70%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(30, 80%, 55%)",
  "hsl(340, 65%, 50%)",
  "hsl(270, 55%, 55%)",
  "hsl(190, 70%, 45%)",
  "hsl(50, 75%, 50%)",
  "hsl(0, 65%, 55%)",
  "hsl(120, 50%, 45%)",
  "hsl(280, 50%, 55%)",
];

interface LocalDataset {
  id: string;
  label: string;
  data: (number | "")[];
}

interface MultiDatasetEditorProps {
  chart: ChartData;
  onClose: () => void;
  onDatasetsSaved: (datasets: ChartDataset[]) => void;
}

export default function MultiDatasetEditor({
  chart,
  onClose,
  onDatasetsSaved,
}: MultiDatasetEditorProps) {
  const isMultiType = chart.type === "bar" || chart.type === "line";

  // Initialize datasets from existing chart data
  const initialDatasets = useMemo<LocalDataset[]>(() => {
    if (chart.datasets && chart.datasets.length > 0) {
      return chart.datasets.map((ds, idx) => ({
        id: `ds-${idx}-${Date.now()}`,
        label: ds.label,
        data: [...ds.data],
      }));
    }
    // Default: one extra dataset beyond the primary
    return [
      {
        id: `ds-0-${Date.now()}`,
        label: "",
        data: chart.labels.map(() => ""),
      },
    ];
  }, [chart.datasets, chart.labels]);

  const [datasets, setDatasets] = useState<LocalDataset[]>(initialDatasets);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddDataset = useCallback(() => {
    const newId = `ds-${Date.now()}`;
    setDatasets((prev) => [
      ...prev,
      {
        id: newId,
        label: "",
        data: chart.labels.map(() => ""),
      },
    ]);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[newId];
      return next;
    });
  }, [chart.labels]);

  const handleRemoveDataset = useCallback((id: string) => {
    setDatasets((prev) => prev.filter((ds) => ds.id !== id));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleLabelChange = useCallback((id: string, label: string) => {
    setDatasets((prev) =>
      prev.map((ds) => (ds.id === id ? { ...ds, label } : ds))
    );
    setErrors((prev) => {
      const next = { ...prev };
      if (label.trim()) {
        delete next[`${id}-label`];
      }
      return next;
    });
  }, []);

  const handleDataChange = useCallback(
    (id: string, index: number, value: string) => {
      const parsed = value === "" ? "" : parseFloat(value);
      setDatasets((prev) =>
        prev.map((ds) => {
          if (ds.id !== id) return ds;
          const newData = [...ds.data];
          newData[index] = isNaN(parsed as number) ? "" : parsed;
          return { ...ds, data: newData };
        })
      );
      setErrors((prev) => {
        const next = { ...prev };
        const key = `${id}-${index}`;
        if (value !== "" && !isNaN(parseFloat(value))) {
          delete next[key];
        }
        return next;
      });
    },
    []
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    datasets.forEach((ds) => {
      // Check label
      if (!ds.label.trim()) {
        newErrors[`${ds.id}-label`] = "Name is required";
      }
      // Check for duplicate labels
      const duplicateLabel = datasets.find(
        (other) =>
          other.id !== ds.id &&
          other.label.trim().toLowerCase() === ds.label.trim().toLowerCase() &&
          ds.label.trim() !== ""
      );
      if (duplicateLabel) {
        newErrors[`${ds.id}-label`] = "Duplicate dataset name";
      }
      // Check data values
      ds.data.forEach((val, idx) => {
        if (val === "" || val === null || val === undefined || isNaN(val as number)) {
          newErrors[`${ds.id}-${idx}`] = "Required";
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [datasets]);

  const handleSave = useCallback(() => {
    if (!validate()) {
      toast.error("Please fix the validation errors before saving");
      return;
    }

    const savedDatasets: ChartDataset[] = datasets.map((ds) => ({
      label: ds.label.trim(),
      data: ds.data.map((v) => v as number),
    }));

    onDatasetsSaved(savedDatasets);
    toast.success(
      `${savedDatasets.length} dataset${savedDatasets.length > 1 ? "s" : ""} saved`
    );
  }, [datasets, onDatasetsSaved, validate]);

  // If chart type doesn't support multi-dataset, show unsupported message
  if (!isMultiType) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border bg-background p-8"
      >
        <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-amber-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-foreground">
              Multi-Dataset Not Available
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Multiple datasets are only supported for{" "}
              <Badge variant="secondary" className="mx-0.5">Bar</Badge> and{" "}
              <Badge variant="secondary" className="mx-0.5">Line</Badge> chart types.
              Your current chart is a{" "}
              <Badge variant="outline" className="mx-0.5">
                {chart.type}
              </Badge>{" "}
              chart.
            </p>
          </div>
          <Button variant="outline" onClick={onClose} className="mt-2">
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Database className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Multi-Dataset Editor
            </h3>
            <p className="text-xs text-muted-foreground">
              {chart.type === "bar" ? "Bar" : "Line"} Chart &middot;{" "}
              {chart.labels.length} labels &middot; {datasets.length} dataset
              {datasets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6 space-y-6">
          {/* Primary Dataset (Read-only) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-foreground">
                Primary Dataset
              </Label>
              <Badge variant="secondary" className="text-[10px] px-1.5">
                Read-only
              </Badge>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider min-w-[140px]">
                        Label
                      </th>
                      {chart.labels.map((label, i) => (
                        <th
                          key={i}
                          className="text-right px-3 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider min-w-[80px]"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{
                              backgroundColor: DATASET_COLORS[0],
                            }}
                          />
                          {chart.title}
                        </div>
                      </td>
                      {chart.data.map((value, i) => (
                        <td
                          key={i}
                          className="text-right px-3 py-2.5 tabular-nums text-muted-foreground"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Datasets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">
                Additional Datasets
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddDataset}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Dataset
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              {datasets.length === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-dashed border-border bg-muted/10 flex flex-col items-center justify-center py-8 gap-2"
                >
                  <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No additional datasets yet
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddDataset}
                    className="gap-1.5 h-8 text-xs mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add First Dataset
                  </Button>
                </motion.div>
              )}

              {datasets.map((ds, dsIdx) => {
                const colorIdx = (dsIdx + 1) % DATASET_COLORS.length;
                const hasError = Object.keys(errors).some((key) =>
                  key.startsWith(ds.id)
                );

                return (
                  <motion.div
                    key={ds.id}
                    layout
                    initial={{ opacity: 0, y: -12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.97 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`rounded-xl border overflow-hidden transition-colors ${
                      hasError
                        ? "border-destructive/50 bg-destructive/5"
                        : "border-border bg-background"
                    }`}
                  >
                    {/* Dataset Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-muted/20">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-background shadow-sm"
                        style={{ backgroundColor: DATASET_COLORS[colorIdx] }}
                      />
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder={`Dataset ${dsIdx + 1} name (e.g. "2024 Revenue")`}
                          value={ds.label}
                          onChange={(e) =>
                            handleLabelChange(ds.id, e.target.value)
                          }
                          className="h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDataset(ds.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Remove dataset</span>
                      </Button>
                    </div>

                    {/* Dataset Error */}
                    {errors[`${ds.id}-label`] && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-[11px] text-destructive px-4 pt-2 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {errors[`${ds.id}-label`]}
                      </motion.p>
                    )}

                    {/* Data Values */}
                    <div className="px-4 py-3 overflow-x-auto">
                      <div className="flex items-center gap-2 min-w-max">
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider w-20 shrink-0">
                          Values
                        </span>
                        {chart.labels.map((label, valIdx) => (
                          <div key={valIdx} className="flex flex-col gap-0.5 w-20 shrink-0">
                            <span className="text-[10px] text-muted-foreground truncate">
                              {label}
                            </span>
                            <Input
                              type="number"
                              step="any"
                              placeholder="0"
                              value={ds.data[valIdx] === "" ? "" : ds.data[valIdx]}
                              onChange={(e) =>
                                handleDataChange(ds.id, valIdx, e.target.value)
                              }
                              className={`h-8 text-sm text-right tabular-nums ${
                                errors[`${ds.id}-${valIdx}`]
                                  ? "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/30"
                                  : ""
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
        <p className="text-xs text-muted-foreground">
          {datasets.length} additional dataset{datasets.length !== 1 ? "s" : ""} configured
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Save Datasets
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
