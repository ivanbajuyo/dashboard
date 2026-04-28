"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pencil,
  Trash2,
  Copy,
  Share2,
  Download,
  Star,
  FileDown,
  Palette,
  Check,
} from "lucide-react";
import ChartCanvas, { type ChartData, ALL_PALETTES } from "./ChartCanvas";
import { toast } from "sonner";

interface ChartWorkspaceProps {
  chart: ChartData;
  chartRef: React.MutableRefObject<any>;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onTogglePin: () => void;
  onPaletteChange: (chart: ChartData) => void;
  isDeleting?: boolean;
}

// ---------- Helper: trigger file download ----------
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- Toolbar Button ----------
function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  variant = "ghost",
  disabled = false,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: "ghost" | "destructive";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={`gap-1.5 h-8 ${variant === "destructive" ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "hover:bg-accent"} ${className}`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ---------- Main Component ----------
export default function ChartWorkspace({
  chart,
  chartRef,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  onTogglePin,
  onPaletteChange,
  isDeleting = false,
}: ChartWorkspaceProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  // ---- Export PNG ----
  const handleExportPNG = useCallback(() => {
    if (!chartRef.current) return;
    const base64 = chartRef.current.toBase64Image();
    const link = document.createElement("a");
    link.download = `${chart.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
    link.href = base64;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [chartRef, chart.title]);

  // ---- Export CSV ----
  const handleExportCSV = useCallback(() => {
    const rows: string[] = [];

    if (chart.datasets && chart.datasets.length > 0) {
      // Multi-dataset CSV
      const header = ["Label", ...chart.datasets.map((ds) => ds.label)];
      rows.push(header.join(","));
      for (let i = 0; i < chart.labels.length; i++) {
        const row = [
          chart.labels[i],
          ...chart.datasets.map((ds) => ds.data[i] ?? ""),
        ];
        rows.push(row.join(","));
      }
    } else {
      // Single-dataset CSV
      rows.push("Label,Value");
      for (let i = 0; i < chart.labels.length; i++) {
        rows.push(`${chart.labels[i]},${chart.data[i]}`);
      }
    }

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${chart.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`);
  }, [chart]);

  // ---- Quick Palette Switch ----
  const handlePaletteSwitch = useCallback(
    async (paletteName: string) => {
      if (paletteName === chart.colorPalette) {
        setPaletteOpen(false);
        return;
      }
      try {
        const res = await fetch(`/api/charts/${chart.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ colorPalette: paletteName }),
        });
        if (!res.ok) {
          toast.error("Failed to update palette");
          return;
        }
        const updated = await res.json();
        onPaletteChange({
          ...chart,
          colorPalette: updated.colorPalette || undefined,
        });
        toast.success(`Palette changed to ${paletteName}`);
      } catch {
        toast.error("Network error");
      } finally {
        setPaletteOpen(false);
      }
    },
    [chart, onPaletteChange]
  );

  const currentPaletteName = chart.colorPalette || "Default";
  const currentPalette = ALL_PALETTES.find((p) => p.name === currentPaletteName) || ALL_PALETTES[0];

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Chart canvas */}
      <ChartCanvas chart={chart} chartRef={chartRef} />

      {/* Floating toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35, ease: "easeOut" }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5 px-2 py-1.5">
          {/* Left group: Pin toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                className={
                  chart.isPinned
                    ? "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 h-8 gap-1.5"
                    : "h-8 gap-1.5 hover:bg-accent"
                }
              >
                {chart.isPinned ? (
                  <Star className="h-4 w-4 shrink-0 fill-amber-500 text-amber-500" />
                ) : (
                  <Star className="h-4 w-4 shrink-0" />
                )}
                <span className="sr-only">{chart.isPinned ? "Unpin" : "Pin"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {chart.isPinned ? "Unpin" : "Pin"}
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Palette quick-switch */}
          <Popover open={paletteOpen} onOpenChange={setPaletteOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 hover:bg-accent"
              >
                <div className="flex -space-x-1">
                  {currentPalette.solid.slice(0, 3).map((color, i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-background"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="sr-only">Palette</span>
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-64 p-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">Color Palette</p>
              <div className="space-y-0.5">
                {ALL_PALETTES.map((palette) => {
                  const isActive = palette.name === currentPaletteName;
                  return (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => handlePaletteSwitch(palette.name)}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? "bg-primary/5 border border-primary/20"
                          : "hover:bg-accent border border-transparent"
                      }`}
                    >
                      <div className="flex -space-x-1 shrink-0">
                        {palette.solid.slice(0, 6).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border-2 border-background"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className={`text-sm font-medium flex-1 ${isActive ? "text-primary" : "text-foreground"}`}>
                        {palette.name}
                      </span>
                      {isActive && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Center group: Exports */}
          <ToolbarButton
            icon={Download}
            label="Export PNG"
            onClick={handleExportPNG}
          />
          <ToolbarButton
            icon={FileDown}
            label="Export CSV"
            onClick={handleExportCSV}
          />

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Right group: Actions */}
          <ToolbarButton icon={Pencil} label="Edit" onClick={onEdit} />
          <ToolbarButton icon={Copy} label="Duplicate" onClick={onDuplicate} />
          <ToolbarButton icon={Share2} label="Share" onClick={onShare} />
          <ToolbarButton
            icon={Trash2}
            label="Delete"
            onClick={onDelete}
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
            disabled={isDeleting}
          />
        </div>
      </motion.div>

      {/* Delete loading overlay */}
      {isDeleting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">
              Deleting chart&hellip;
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
