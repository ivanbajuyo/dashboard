"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  BarChartBig,
  ArrowLeft,
  Plus,
  X,
  Pencil,
  Save,
  Trash2,
  Upload,
  LayoutDashboard,
  Sparkles,
  BrainCircuit,
  GitCompare,
  Columns3,
  MessageSquareQuote,
  Code2,
  Layers,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  ALL_CHART_TYPES,
  ALL_PALETTES,
  TYPE_LABELS,
  type ChartData,
  type ChartType,
} from "./ChartCanvas";
import ChartCanvas from "./ChartCanvas";
import DashboardGrid from "./DashboardGrid";
import ChartWorkspace from "./ChartWorkspace";
import DashboardOverview from "./DashboardOverview";
import AIGenerateDialog from "./AIGenerateDialog";
import AIInsightsPanel from "./AIInsightsPanel";
import ChartComparison from "./ChartComparison";
import DashboardBuilder from "./DashboardBuilder";
import AnnotationEditor from "./AnnotationEditor";
import EmbedCodeDialog from "./EmbedCodeDialog";
import MultiDatasetEditor from "./MultiDatasetEditor";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { toast } from "sonner";
import { saveApiCache } from "@/lib/api-cache";

// ---------- Row-based data entry type ----------
interface DataRow {
  id: string;
  label: string;
  value: string;
}

let _rowId = 0;
function nextRowId() {
  return `r${++_rowId}`;
}

function makeRows(labels: string[], data: number[]): DataRow[] {
  return labels.map((label, i) => ({
    id: nextRowId(),
    label,
    value: String(data[i] ?? ""),
  }));
}

function extractFromRows(rows: DataRow[]): { labels: string[]; data: number[] } {
  return {
    labels: rows.map((r) => r.label.trim()).filter(Boolean),
    data: rows.map((r) => Number(r.value)),
  };
}

// ---------- Chart Templates ----------
const CHART_TEMPLATES: { name: string; title: string; type: ChartType; labels: string[]; data: number[]; description: string; collection: string }[] = [
  {
    name: "Monthly Sales",
    title: "Monthly Sales 2025",
    type: "bar",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    data: [12400, 19200, 15800, 22100, 18700, 24500],
    description: "Monthly sales performance tracking",
    collection: "Sales",
  },
  {
    name: "Revenue Growth",
    title: "Revenue Growth",
    type: "line",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    data: [45000, 62000, 58000, 78000],
    description: "Quarterly revenue trend analysis",
    collection: "Finance",
  },
  {
    name: "Market Share",
    title: "Market Share by Region",
    type: "pie",
    labels: ["North America", "Europe", "Asia Pacific", "Latin America", "Africa"],
    data: [35, 28, 22, 10, 5],
    description: "Regional market distribution",
    collection: "Marketing",
  },
  {
    name: "User Engagement",
    title: "Weekly Active Users",
    type: "line",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [3200, 4100, 3800, 4500, 5200, 2800, 2100],
    description: "Weekly user activity pattern",
    collection: "Product",
  },
  {
    name: "Budget Breakdown",
    title: "Department Budget",
    type: "doughnut",
    labels: ["Engineering", "Marketing", "Sales", "Operations", "HR"],
    data: [40, 25, 15, 12, 8],
    description: "Annual department budget allocation",
    collection: "Finance",
  },
  {
    name: "Skill Assessment",
    title: "Team Skills Radar",
    type: "radar",
    labels: ["Frontend", "Backend", "DevOps", "Design", "Testing", "Communication"],
    data: [85, 78, 65, 72, 80, 90],
    description: "Team competency assessment",
    collection: "HR",
  },
  {
    name: "Product Comparison",
    title: "Product Performance",
    type: "polarArea",
    labels: ["Product A", "Product B", "Product C", "Product D", "Product E"],
    data: [450, 380, 520, 290, 410],
    description: "Product performance comparison",
    collection: "Sales",
  },
  {
    name: "Quarterly Targets",
    title: "Quarterly Target vs Actual",
    type: "bar",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    data: [85000, 92000, 78000, 105000],
    description: "Sales targets vs actual performance",
    collection: "Sales",
  },
];

// ---------- Shared chart form ----------
function ChartForm({
  title, onTitleChange,
  type, onTypeChange,
  rows, onRowsChange,
  description, onDescriptionChange,
  collection, onCollectionChange,
  collections,
  colorPalette, onColorPaletteChange,
}: {
  title: string; onTitleChange: (v: string) => void;
  type: ChartType; onTypeChange: (v: ChartType) => void;
  rows: DataRow[]; onRowsChange: (rows: DataRow[]) => void;
  description: string; onDescriptionChange: (v: string) => void;
  collection: string; onCollectionChange: (v: string) => void;
  collections: string[];
  colorPalette: string; onColorPaletteChange: (v: string) => void;
}) {
  const addRow = () => {
    onRowsChange([...rows, { id: nextRowId(), label: "", value: "" }]);
  };

  const removeRow = (id: string) => {
    onRowsChange(rows.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: "label" | "value", val: string) => {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Title</Label>
        <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. Monthly Sales 2025" />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Chart Type</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {ALL_CHART_TYPES.map((ct) => (
            <button
              key={ct.value}
              type="button"
              onClick={() => onTypeChange(ct.value)}
              className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                type === ct.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-accent text-foreground"
              }`}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add notes or context for this chart..."
          className="resize-none h-16 text-sm"
        />
      </div>

      {/* Collection */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Collection <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <div className="flex gap-2">
          <Input
            value={collection}
            onChange={(e) => onCollectionChange(e.target.value)}
            placeholder="e.g. Sales Q1"
            className="flex-1 h-9 text-sm"
            list="collection-options"
          />
          <datalist id="collection-options">
            {collections.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Color Palette */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Color Palette</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {ALL_PALETTES.map((palette) => (
            <button
              key={palette.name}
              type="button"
              onClick={() => onColorPaletteChange(palette.name)}
              className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-medium transition-all ${
                colorPalette === palette.name
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-accent text-foreground"
              }`}
            >
              <div className="flex -space-x-0.5">
                {palette.solid.slice(0, 3).map((color, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full border border-background"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span>{palette.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Data rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Data Points</Label>
          <span className="text-xs text-muted-foreground">{rows.filter((r) => r.label.trim()).length} items</span>
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_1fr_32px] gap-1.5 px-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Label</span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Value</span>
            <span />
          </div>

          <AnimatePresence initial={false}>
            {rows.map((row, idx) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-[1fr_1fr_32px] gap-1.5 items-center">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium w-4 text-right">
                      {idx + 1}
                    </span>
                    <Input
                      className="pl-7 h-9 text-sm"
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => updateRow(row.id, "label", e.target.value)}
                    />
                  </div>
                  <Input
                    className="h-9 text-sm"
                    type="number"
                    placeholder="0"
                    value={row.value}
                    onChange={(e) => updateRow(row.id, "value", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full border-dashed">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Data Point
        </Button>
      </div>
    </div>
  );
}

// ---------- Build preview from rows ----------
function buildPreview(title: string, type: ChartType, rows: DataRow[], description: string, colorPalette: string, collection: string): ChartData | null {
  const valid = rows.filter((r) => r.label.trim() && r.value !== "" && !isNaN(Number(r.value)));
  if (!title.trim() || valid.length === 0) return null;
  return {
    id: "preview",
    title,
    type,
    labels: valid.map((r) => r.label.trim()),
    data: valid.map((r) => Number(r.value)),
    description: description || undefined,
    colorPalette: colorPalette || undefined,
    collection: collection || undefined,
  };
}

// ---------- Validate rows ----------
function validateRows(title: string, rows: DataRow[]): string | null {
  if (!title.trim()) return "Title is required";
  const filled = rows.filter((r) => r.label.trim() || r.value !== "");
  if (filled.length === 0) return "Add at least one data point with a label and value";
  for (const r of rows) {
    if (r.label.trim() && r.value !== "" && isNaN(Number(r.value))) {
      return `"${r.value}" is not a valid number`;
    }
    if (r.label.trim() && !r.value) {
      return `Missing value for "${r.label.trim()}"`;
    }
    if (!r.label.trim() && r.value) {
      return `Missing label for value "${r.value}"`;
    }
  }
  return null;
}

// ---------- Parse CSV text ----------
function parseCSV(text: string): { labels: string[]; data: number[] } | { error: string } {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { error: "CSV must have a header row and at least one data row" };

  const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  if (header.length < 2) return { error: "CSV header must have at least 2 columns (Label, Value)" };

  const labels: string[] = [];
  const data: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 2) continue;
    const label = cols[0];
    const value = Number(cols[1]);
    if (!label) continue;
    if (isNaN(value)) return { error: `Invalid number "${cols[1]}" on row ${i + 1}` };
    labels.push(label);
    data.push(value);
  }

  if (labels.length === 0) return { error: "No valid data rows found" };
  return { labels, data };
}

// ===================================================================
// Main page
// ===================================================================

type ViewType = "dashboard" | "workspace" | "create" | "overview" | "comparison" | "builder";

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewType>("dashboard");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // New feature states
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  // Removed unused comparisonOpen/dashboardBuilderOpen - using view state instead
  const [annotationEditorOpen, setAnnotationEditorOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [multiDatasetOpen, setMultiDatasetOpen] = useState(false);

  // Dashboard grid filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("__all__");
  const [collectionFilter, setCollectionFilter] = useState("__all__");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [collections, setCollections] = useState<string[]>([]);

  // Edit form
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<ChartType>("bar");
  const [editRows, setEditRows] = useState<DataRow[]>([]);
  const [editDescription, setEditDescription] = useState("");
  const [editCollection, setEditCollection] = useState("");
  const [editColorPalette, setEditColorPalette] = useState("Default");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Chart instance ref for workspace
  const chartRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Fetch charts ----
  const fetchCharts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter && typeFilter !== "__all__") params.set("type", typeFilter);
      if (collectionFilter && collectionFilter !== "__all__") params.set("collection", collectionFilter);
      const qs = params.toString();
      const res = await fetch(`/api/charts${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const chartsArr = Array.isArray(data) ? data : (data.charts || []);
      setCharts(
        chartsArr.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          title: c.title as string,
          type: c.type as ChartType,
          labels: JSON.parse(c.labels as string),
          data: JSON.parse(c.data as string),
          datasets: c.datasets ? JSON.parse(c.datasets as string) : undefined,
          description: (c.description as string) || undefined,
          isPinned: c.isPinned as boolean || false,
          collection: (c.collection as string) || undefined,
          colorPalette: (c.colorPalette as string) || undefined,
        }))
      );
      if (data.collections) setCollections(data.collections);
      // Cache successful API response for offline support (only unfiltered requests)
      if (!search && typeFilter === "__all__" && collectionFilter === "__all__") {
        saveApiCache({ charts: chartsArr, collections: data.collections || [] });
      }
    } catch {
      toast.error("Failed to load charts");
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, collectionFilter]);

  // Fetch collections separately (unfiltered)
  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/charts");
      if (!res.ok) return;
      const data = await res.json();
      if (data.collections) setCollections(data.collections);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCharts(); }, [fetchCharts]);
  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const handleSelectChart = useCallback((chart: ChartData) => {
    setSelectedChart(chart);
    setView("workspace");
  }, []);

  const handleBack = useCallback(() => {
    setView("dashboard");
    setSelectedChart(null);
    fetchCharts();
  }, [fetchCharts]);

  const handleOpenCreate = useCallback(() => setView("create"), []);
  const handleOpenOverview = useCallback(() => setView("overview"), []);

  // ---- Edit ----
  const openEditDialog = useCallback(() => {
    if (!selectedChart) return;
    setEditTitle(selectedChart.title);
    setEditType(selectedChart.type);
    setEditRows(makeRows(selectedChart.labels, selectedChart.data));
    setEditDescription(selectedChart.description || "");
    setEditCollection(selectedChart.collection || "");
    setEditColorPalette(selectedChart.colorPalette || "Default");
    setEditError("");
    setEditOpen(true);
  }, [selectedChart]);

  const handleEditSave = useCallback(async () => {
    if (!selectedChart) return;
    const err = validateRows(editTitle, editRows);
    if (err) { setEditError(err); return; }
    setEditError("");
    setEditSaving(true);
    const { labels, data } = extractFromRows(editRows);
    try {
      const res = await fetch(`/api/charts/${selectedChart.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          type: editType,
          labels,
          data,
          description: editDescription,
          collection: editCollection || null,
          colorPalette: editColorPalette,
        }),
      });
      if (!res.ok) { const e = await res.json(); setEditError(e.error || "Update failed"); return; }
      const u = await res.json();
      setSelectedChart({
        id: u.id, title: u.title, type: u.type,
        labels: JSON.parse(u.labels), data: JSON.parse(u.data),
        datasets: u.datasets ? JSON.parse(u.datasets) : undefined,
        description: u.description || undefined,
        isPinned: u.isPinned,
        collection: u.collection || undefined,
        colorPalette: u.colorPalette || undefined,
      });
      toast.success("Chart updated!");
      setEditOpen(false);
    } catch { setEditError("Network error"); } finally { setEditSaving(false); }
  }, [selectedChart, editTitle, editType, editRows, editDescription, editCollection, editColorPalette]);

  // ---- Delete ----
  const handleDeleteClick = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedChart) return;
    setDeleteConfirmOpen(false);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/charts/${selectedChart.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      toast.success("Chart deleted");
      handleBack();
    } catch { toast.error("Network error"); } finally { setIsDeleting(false); }
  }, [selectedChart, handleBack]);

  // ---- Create ----
  const handleCreateSubmit = useCallback(
    async (title: string, type: ChartType, labels: string[], data: number[], description: string, collection: string, colorPalette: string) => {
      try {
        const res = await fetch("/api/charts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, type, labels, data, description, collection: collection || null, colorPalette }),
        });
        if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed"); return null; }
        const c = await res.json();
        toast.success("Chart created!");
        return {
          id: c.id, title: c.title, type: c.type,
          labels: JSON.parse(c.labels), data: JSON.parse(c.data),
          description: c.description || undefined,
          isPinned: c.isPinned,
          collection: c.collection || undefined,
          colorPalette: c.colorPalette || undefined,
        } as ChartData;
      } catch { toast.error("Network error"); return null; }
    }, []
  );

  const handleCreated = useCallback((chart: ChartData) => {
    setCharts((prev) => [chart, ...prev]);
    setSelectedChart(chart);
    setView("workspace");
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  // ---- Duplicate ----
  const handleDuplicate = useCallback(async () => {
    if (!selectedChart) return;
    try {
      const res = await fetch(`/api/charts/${selectedChart.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });
      if (!res.ok) { toast.error("Failed to duplicate chart"); return; }
      toast.success("Chart duplicated!");
      fetchCharts();
    } catch { toast.error("Network error"); }
  }, [selectedChart, fetchCharts]);

  // ---- Share ----
  const handleShare = useCallback(async () => {
    if (!selectedChart) return;
    try {
      const res = await fetch(`/api/charts/${selectedChart.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share" }),
      });
      if (!res.ok) { toast.error("Failed to generate share link"); return; }
      const { shareToken } = await res.json();
      const shareUrl = `${window.location.origin}/?share=${shareToken}`;
      if (navigator.share) {
        navigator.share({ title: selectedChart.title, text: `Check out: ${selectedChart.title}`, url: shareUrl });
      } else {
        navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      }
    } catch { toast.error("Network error"); }
  }, [selectedChart]);

  // ---- Toggle Pin ----
  const handleTogglePin = useCallback(async (chart: ChartData) => {
    const newPinned = !chart.isPinned;

    // Force synchronous DOM commit so the user sees the change instantly
    flushSync(() => {
      setSelectedChart((prev) =>
        prev && prev.id === chart.id ? { ...prev, isPinned: newPinned } : prev
      );
      setCharts((prev) => {
        const updated = prev.map((c) => (c.id === chart.id ? { ...c, isPinned: newPinned } : c));
        // Re-sort: pinned first, preserve relative order within groups
        return [
          ...updated.filter((c) => c.isPinned),
          ...updated.filter((c) => !c.isPinned),
        ];
      });
    });

    toast.success(newPinned ? "Chart pinned" : "Chart unpinned");

    try {
      const res = await fetch(`/api/charts/${chart.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: newPinned }),
      });
      if (!res.ok) throw new Error();
      // Do NOT call fetchCharts() here — it races with the PUT write
      // and overwrites the optimistic state with stale data.
      // Charts will refresh naturally on next navigation/filter change.
    } catch {
      // Rollback optimistically
      flushSync(() => {
        setCharts((prev) => {
          const rolled = prev.map((c) => (c.id === chart.id ? { ...c, isPinned: chart.isPinned } : c));
          return [
            ...rolled.filter((c) => c.isPinned),
            ...rolled.filter((c) => !c.isPinned),
          ];
        });
        setSelectedChart((prev) =>
          prev && prev.id === chart.id ? { ...prev, isPinned: chart.isPinned } : prev
        );
      });
      toast.error("Failed to update pin");
    }
  }, []);

  // ---- CSV Import ----
  const handleCSVImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCSV(text);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      // Will be consumed by the create view
      setView("create");
      // Store imported data for the CreateView to pick up
      window.__csvImportData = { labels: result.labels, data: result.data, filename: file.name };
      toast.success(`Imported ${result.labels.length} data points from ${file.name}`);
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ---- Create from Template ----
  const handleCreateFromTemplate = useCallback(async (template: typeof CHART_TEMPLATES[0]) => {
    try {
      const res = await fetch("/api/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.title,
          type: template.type,
          labels: template.labels,
          data: template.data,
          description: template.description,
          collection: template.collection,
        }),
      });
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed"); return; }
      const c = await res.json();
      const chart: ChartData = {
        id: c.id, title: c.title, type: c.type,
        labels: JSON.parse(c.labels), data: JSON.parse(c.data),
        description: c.description || undefined,
        collection: c.collection || undefined,
      };
      toast.success(`"${template.title}" created from template!`);
      setCharts((prev) => [chart, ...prev]);
      setSelectedChart(chart);
      setView("workspace");
      setTemplatesOpen(false);
    } catch { toast.error("Network error"); }
  }, []);

  const editPreview = useMemo(
    () => buildPreview(editTitle, editType, editRows, editDescription, editColorPalette, editCollection),
    [editTitle, editType, editRows, editDescription, editColorPalette, editCollection]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {view !== "dashboard" && (
                <motion.div key="back" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0" title="Back">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary text-primary-foreground"><BarChartBig className="h-4 w-4" /></div>
              <AnimatePresence mode="wait">
                <motion.h1 key={view} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="text-lg font-semibold tracking-tight">
                  {view === "dashboard" ? "Chart Studio" : view === "create" ? "Create New Chart" : view === "overview" ? "Dashboard Overview" : view === "comparison" ? "Chart Comparison" : view === "builder" ? "Dashboard Builder" : selectedChart?.title ?? "Chart Studio"}
                </motion.h1>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {view === "dashboard" && (
              <>
                <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">{charts.length} chart{charts.length !== 1 ? "s" : ""}</span>
                <Button variant="outline" size="sm" onClick={handleOpenOverview} className="mr-1 hidden sm:inline-flex" title="Overview">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" />
                  <span>Overview</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)} className="mr-1" title="Templates">
                  <Sparkles className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Templates</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mr-1" title="Import CSV">
                  <Upload className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenCreate} className="mr-1">
                  <Plus className="h-4 w-4 mr-1.5" /><span className="hidden sm:inline">New</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAiGenerateOpen(true)} className="mr-1" title="AI Generate">
                  <BrainCircuit className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">AI Create</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setView("comparison")} className="mr-1 hidden sm:inline-flex" title="Compare Charts">
                  <GitCompare className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Compare</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setView("builder")} className="mr-1 hidden sm:inline-flex" title="Dashboard Builder">
                  <Columns3 className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Builder</span>
                </Button>
                <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden" onChange={handleCSVImport} />
              </>
            )}
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.main key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto">
              <DashboardGrid
                charts={charts}
                onSelectChart={handleSelectChart}
                onOpenCreate={handleOpenCreate}
                isLoading={isLoading}
                search={search}
                onSearchChange={setSearch}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                collections={collections}
                collectionFilter={collectionFilter}
                onCollectionFilterChange={setCollectionFilter}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onTogglePin={handleTogglePin}
              />
            </motion.main>
          )}
          {view === "workspace" && selectedChart && (
            <motion.div key={`ws-${selectedChart.id}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="absolute inset-0 flex overflow-hidden">
              <ChartWorkspace
                chart={selectedChart}
                chartRef={chartRef}
                onEdit={openEditDialog}
                onDelete={handleDeleteClick}
                onDuplicate={handleDuplicate}
                onShare={handleShare}
                onTogglePin={() => handleTogglePin(selectedChart)}
                onPaletteChange={(updated) => setSelectedChart(updated)}
                isDeleting={isDeleting}
              />
              {selectedChart && <AIInsightsPanel chart={selectedChart} />}
              {/* Extra workspace toolbar */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setEmbedOpen(true)} className="h-8 gap-1.5 bg-background/80 backdrop-blur-sm">
                  <Code2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Embed</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAnnotationEditorOpen(true)} className="h-8 gap-1.5 bg-background/80 backdrop-blur-sm">
                  <MessageSquareQuote className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Notes</span>
                </Button>
                {(selectedChart?.type === "bar" || selectedChart?.type === "line") && (
                  <Button variant="outline" size="sm" onClick={() => setMultiDatasetOpen(true)} className="h-8 gap-1.5 bg-background/80 backdrop-blur-sm">
                    <Layers className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Datasets</span>
                  </Button>
                )}
              </div>
            </motion.div>
          )}
          {view === "create" && (
            <motion.div key="create" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="absolute inset-0 flex overflow-hidden">
              <CreateView onSubmit={handleCreateSubmit} onCreated={handleCreated} onCancel={handleBack} collections={collections} />
            </motion.div>
          )}
          {view === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto">
              <DashboardOverview charts={charts} onSelectChart={handleSelectChart} isLoading={isLoading} />
            </motion.div>
          )}
          {view === "comparison" && (
            <motion.div key="comparison" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto">
              <ChartComparison charts={charts} onClose={handleBack} />
            </motion.div>
          )}
          {view === "builder" && (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 overflow-hidden">
              <DashboardBuilder allCharts={charts} onClose={handleBack} onRefreshCharts={fetchCharts} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[95vw] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5" /> Edit Chart</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-1 pb-2">
              <div className="space-y-4 pr-1">
                <ChartForm
                  title={editTitle} onTitleChange={setEditTitle}
                  type={editType} onTypeChange={setEditType}
                  rows={editRows} onRowsChange={setEditRows}
                  description={editDescription} onDescriptionChange={setEditDescription}
                  collection={editCollection} onCollectionChange={setEditCollection}
                  collections={collections}
                  colorPalette={editColorPalette} onColorPaletteChange={setEditColorPalette}
                />
                {editError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-3">{editError}</p>}
              </div>
              <div className="min-h-[340px] rounded-xl border bg-muted/30 overflow-hidden">
                {editPreview ? <ChartCanvas chart={editPreview} /> : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-6 text-center">
                    Fill in the fields to see a preview
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 shrink-0 pt-2 border-t mt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><Save className="h-4 w-4 mr-1.5" />Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={templatesOpen} onOpenChange={(open) => { if (!open) setTemplatesOpen(false); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Chart Templates</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              {CHART_TEMPLATES.map((template) => {
                const typeLabel = TYPE_LABELS[template.type];
                return (
                  <motion.button
                    key={template.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCreateFromTemplate(template)}
                    className="relative flex flex-col rounded-xl border border-border bg-card p-4 text-left hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm truncate">{template.title}</h3>
                      <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">{typeLabel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                      <Badge variant="outline" className="text-[10px]">{template.collection}</Badge>
                      <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Use Template →
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!open) setDeleteConfirmOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Chart
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{selectedChart?.title}&quot;</span>? This action cannot be undone and the chart data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Deleting...</span>
              ) : (
                <><Trash2 className="h-4 w-4 mr-1.5" />Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Generate Dialog */}
      <AIGenerateDialog
        open={aiGenerateOpen}
        onOpenChange={setAiGenerateOpen}
        onChartGenerated={async (generated) => {
          const chart = await handleCreateSubmit(generated.title, generated.type as ChartType, generated.labels, generated.data, generated.description || "", "", "Default");
          if (chart) handleCreated(chart);
        }}
        collections={collections}
      />

      {/* Embed Code Dialog */}
      {selectedChart && (
        <EmbedCodeDialog
          chart={selectedChart}
          open={embedOpen}
          onOpenChange={setEmbedOpen}
        />
      )}

      {/* Annotation Editor Dialog */}
      {selectedChart && (
        <Dialog open={annotationEditorOpen} onOpenChange={setAnnotationEditorOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] w-[95vw] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><MessageSquareQuote className="h-5 w-5" /> Data Annotations</DialogTitle>
            </DialogHeader>
            <AnnotationEditor
              chart={selectedChart}
              onClose={() => setAnnotationEditorOpen(false)}
              onAnnotationAdded={() => {}}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Multi-Dataset Editor Dialog */}
      {selectedChart && (
        <Dialog open={multiDatasetOpen} onOpenChange={setMultiDatasetOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] w-[95vw] flex flex-col overflow-hidden p-0">
            <MultiDatasetEditor
              chart={selectedChart}
              onClose={() => setMultiDatasetOpen(false)}
              onDatasetsSaved={async (datasets) => {
                try {
                  const res = await fetch(`/api/charts/${selectedChart.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ datasets }),
                  });
                  if (res.ok) {
                    toast.success("Datasets saved!");
                    const u = await res.json();
                    setSelectedChart(prev => prev ? {
                      ...prev,
                      datasets: u.datasets ? JSON.parse(u.datasets) : undefined,
                    } : prev);
                    setMultiDatasetOpen(false);
                  } else {
                    toast.error("Failed to save datasets");
                  }
                } catch {
                  toast.error("Network error");
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* PWA Install Prompt */}
      <PwaInstallPrompt />
    </div>
  );
}

/* ========== Create View ========== */

function CreateView({
  onSubmit,
  onCreated,
  onCancel,
  collections,
}: {
  onSubmit: (title: string, type: ChartType, labels: string[], data: number[], description: string, collection: string, colorPalette: string) => Promise<ChartData | null>;
  onCreated: (chart: ChartData) => void;
  onCancel: () => void;
  collections: string[];
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ChartType>("bar");
  const [rows, setRows] = useState<DataRow[]>([
    { id: nextRowId(), label: "", value: "" },
    { id: nextRowId(), label: "", value: "" },
    { id: nextRowId(), label: "", value: "" },
  ]);
  const [description, setDescription] = useState("");
  const [collection, setCollection] = useState("");
  const [colorPalette, setColorPalette] = useState("Default");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pick up CSV import data if available (using ref to avoid setState in effect)
  const csvImportProcessed = useRef(false);
  useEffect(() => {
    if (csvImportProcessed.current) return;
    const csvData = window.__csvImportData;
    if (csvData) {
      csvImportProcessed.current = true;
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setTitle(csvData.filename.replace(/\.csv$/i, ""));
        setRows(makeRows(csvData.labels, csvData.data));
        toast.info(`Loaded ${csvData.labels.length} rows from CSV`);
        delete window.__csvImportData;
      });
    }
  }, []);

  const preview = useMemo(
    () => buildPreview(title, type, rows, description, colorPalette, collection),
    [title, type, rows, description, colorPalette, collection]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateRows(title, rows);
    if (err) { setError(err); return; }
    setError("");
    setIsSubmitting(true);
    const { labels, data } = extractFromRows(rows);
    const result = await onSubmit(title.trim(), type, labels, data, description, collection, colorPalette);
    if (result) onCreated(result);
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="w-full md:w-[440px] h-full min-h-0 shrink-0 border-r bg-card/50 flex flex-col">
        <div className="p-6 pb-4 space-y-5 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Chart Details</h2>
            <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
          <form id="create-chart-form" onSubmit={handleSubmit} className="space-y-5">
            <ChartForm
              title={title} onTitleChange={setTitle}
              type={type} onTypeChange={setType}
              rows={rows} onRowsChange={setRows}
              description={description} onDescriptionChange={setDescription}
              collection={collection} onCollectionChange={setCollection}
              collections={collections}
              colorPalette={colorPalette} onColorPaletteChange={setColorPalette}
            />
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
          </form>
        </div>
        <div className="shrink-0 border-t bg-background px-6 py-3">
          <div className="flex gap-2">
            <Button type="submit" form="create-chart-form" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Creating...</span>
              ) : (<><Plus className="h-4 w-4 mr-1.5" />Create Chart</>)}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        {preview ? (
          <ChartCanvas chart={preview} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 p-8">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <BarChartBig className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium">Live Preview</p>
              <p className="text-sm mt-1">Add data points to see your chart</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
