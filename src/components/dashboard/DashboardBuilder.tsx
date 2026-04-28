"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  X,
  Plus,
  GripVertical,
  Save,
  FolderOpen,
  Trash2,
  LayoutDashboard,
  BarChart3,
  LineChart,
  PieChart,
  CircleDot,
  BarChartBig,
  Folder,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChartData } from "./ChartCanvas";
import { TYPE_LABELS } from "./ChartCanvas";
import ChartCanvas from "./ChartCanvas";

// ==================== Types ====================

interface ChartDashboardItem {
  id: string;
  chartId: string;
  chart: ChartData;
}

interface CustomDashboardData {
  id: string;
  name: string;
  description?: string;
  layout: string;
  charts: { id: string; chartId: string; order: number; width: number; chart: ChartData }[];
}

interface DashboardBuilderProps {
  allCharts: ChartData[];
  onClose: () => void;
  onRefreshCharts: () => void;
}

// ==================== Constants ====================

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  doughnut: CircleDot,
  polarArea: PieChart,
  radar: BarChartBig,
};

// ==================== Component ====================

export default function DashboardBuilder({
  allCharts,
  onClose,
  onRefreshCharts,
}: DashboardBuilderProps) {
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardItems, setDashboardItems] = useState<ChartDashboardItem[]>([]);
  const [savedDashboards, setSavedDashboards] = useState<CustomDashboardData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDashboards, setIsLoadingDashboards] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [loadedDashboardId, setLoadedDashboardId] = useState<string | null>(null);

  // Fetch saved dashboards
  const fetchDashboards = useCallback(async () => {
    setIsLoadingDashboards(true);
    try {
      const res = await fetch("/api/dashboards");
      if (res.ok) {
        const data = await res.json();
        setSavedDashboards(Array.isArray(data) ? data : data.dashboards || []);
      }
    } catch {
      toast.error("Failed to load dashboards");
    } finally {
      setIsLoadingDashboards(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  // Charts available to add (not already in dashboard)
  const availableCharts = useMemo(() => {
    const usedIds = new Set(dashboardItems.map((item) => item.chartId));
    return allCharts.filter((c) => !usedIds.has(c.id));
  }, [allCharts, dashboardItems]);

  // Add chart to dashboard
  const addChart = useCallback((chart: ChartData) => {
    const newItem: ChartDashboardItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      chartId: chart.id,
      chart,
    };
    setDashboardItems((prev) => [...prev, newItem]);
    setIsMobileDrawerOpen(false);
  }, []);

  // Remove chart from dashboard
  const removeChart = useCallback((itemId: string) => {
    setDashboardItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // Save dashboard
  const saveDashboard = useCallback(async () => {
    if (!dashboardName.trim()) {
      toast.error("Please enter a dashboard name");
      return;
    }
    if (dashboardItems.length === 0) {
      toast.error("Add at least one chart to save");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: dashboardName.trim(),
        chartIds: dashboardItems.map((item) => item.chartId),
        columns: 2,
      };

      const url = loadedDashboardId
        ? `/api/dashboards/${loadedDashboardId}`
        : "/api/dashboards";
      const method = loadedDashboardId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          loadedDashboardId ? "Dashboard updated successfully" : "Dashboard saved successfully"
        );
        fetchDashboards();
        onRefreshCharts();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save dashboard");
      }
    } catch {
      toast.error("Network error while saving");
    } finally {
      setIsSaving(false);
    }
  }, [dashboardName, dashboardItems, loadedDashboardId, fetchDashboards, onRefreshCharts]);

  // Load dashboard
  const loadDashboard = useCallback(
    async (dashboardId: string) => {
      setIsLoadingDashboards(true);
      try {
        const res = await fetch(`/api/dashboards/${dashboardId}`);
        if (res.ok) {
          const dashboard: CustomDashboardData = await res.json();
          setDashboardName(dashboard.name);

          if (dashboard.charts && Array.isArray(dashboard.charts)) {
            const items: ChartDashboardItem[] = dashboard.charts.map((dc) => ({
              id: dc.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              chartId: dc.chartId,
              chart: dc.chart,
            }));
            setDashboardItems(items.sort((a, b) => {
              const orderA = dashboard.charts.find((c) => c.chartId === a.chartId)?.order ?? 0;
              const orderB = dashboard.charts.find((c) => c.chartId === b.chartId)?.order ?? 0;
              return orderA - orderB;
            }));
          }

          setLoadedDashboardId(dashboard.id);
          toast.success(`Loaded "${dashboard.name}"`);
        } else {
          toast.error("Failed to load dashboard");
        }
      } catch {
        toast.error("Network error while loading");
      } finally {
        setIsLoadingDashboards(false);
      }
    },
    []
  );

  // Delete dashboard
  const deleteDashboard = useCallback(
    async (dashboardId: string) => {
      try {
        const res = await fetch(`/api/dashboards/${dashboardId}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Dashboard deleted");
          fetchDashboards();
          if (loadedDashboardId === dashboardId) {
            setDashboardName("");
            setDashboardItems([]);
            setLoadedDashboardId(null);
          }
        } else {
          toast.error("Failed to delete dashboard");
        }
      } catch {
        toast.error("Network error while deleting");
      }
    },
    [fetchDashboards, loadedDashboardId]
  );

  // Clear loaded state
  const clearDashboard = useCallback(() => {
    setDashboardName("");
    setDashboardItems([]);
    setLoadedDashboardId(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col h-[calc(100vh-4rem)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Dashboard Builder</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create custom dashboards with your charts
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl"
          aria-label="Close builder"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-muted/30 shrink-0 flex-wrap">
        <Input
          placeholder="Dashboard name..."
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
          className="h-9 w-48 rounded-xl flex-shrink-0"
        />

        <Button
          onClick={saveDashboard}
          disabled={isSaving || !dashboardName.trim() || dashboardItems.length === 0}
          size="sm"
          className="rounded-xl"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loadedDashboardId ? "Update" : "Save"}
        </Button>

        {loadedDashboardId && (
          <Button onClick={clearDashboard} variant="outline" size="sm" className="rounded-xl">
            New Dashboard
          </Button>
        )}

        {/* Load Dashboard Select */}
        <Select onValueChange={(val) => val && loadDashboard(val)}>
          <SelectTrigger size="sm" className="h-9 w-48 rounded-xl">
            <FolderOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Load dashboard..." />
          </SelectTrigger>
          <SelectContent>
            {savedDashboards.length === 0 ? (
              <SelectItem value="__none__" disabled>
                No saved dashboards
              </SelectItem>
            ) : (
              savedDashboards.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  <span className="flex items-center gap-2">
                    <span className="truncate">{d.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      ({d.charts?.length || 0})
                    </span>
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Delete Dashboard */}
        {loadedDashboardId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-xl text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{dashboardName}&quot;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteDashboard(loadedDashboardId)}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <span className="ml-auto text-sm text-muted-foreground hidden sm:inline">
          {dashboardItems.length} chart{dashboardItems.length !== 1 ? "s" : ""} added
        </span>

        {/* Mobile add button */}
        <div className="sm:hidden ml-auto">
          <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
            <DrawerTrigger asChild>
              <Button size="sm" className="rounded-xl">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Add Charts</DrawerTitle>
                <DrawerDescription>
                  Tap a chart to add it to your dashboard
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4">
                <AvailableChartList
                  charts={availableCharts}
                  onAdd={addChart}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Desktop only */}
        <aside className="hidden sm:flex w-80 lg:w-96 flex-col border-r border-border bg-card/50 shrink-0">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              Available Charts
              <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {availableCharts.length}
              </span>
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <AvailableChartList charts={availableCharts} onAdd={addChart} />
          </ScrollArea>
        </aside>

        {/* Right Panel - Dashboard Grid */}
        <main className="flex-1 min-w-0 overflow-auto">
          {dashboardItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-6">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <LayoutDashboard className="h-9 w-9 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Your dashboard is empty</h3>
              <p className="text-sm text-muted-foreground mb-5 text-center max-w-sm">
                {allCharts.length === 0
                  ? "Create some charts first, then come back to build your dashboard."
                  : "Add charts from the sidebar to start building your custom dashboard. You can reorder them by dragging."}
              </p>
              {availableCharts.length > 0 && (
                <div className="sm:hidden">
                  <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button className="rounded-xl">
                        <Plus className="h-4 w-4" />
                        Add Your First Chart
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Add Charts</DrawerTitle>
                        <DrawerDescription>
                          Tap a chart to add it to your dashboard
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="px-4 pb-4">
                        <AvailableChartList
                          charts={availableCharts}
                          onAdd={addChart}
                        />
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-4">
              <Reorder.Group
                axis="y"
                values={dashboardItems}
                onReorder={setDashboardItems}
                className="space-y-4"
              >
                <AnimatePresence>
                  {dashboardItems.map((item) => (
                    <Reorder.Item
                      key={item.id}
                      value={item}
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -16, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="cursor-grab active:cursor-grabbing rounded-2xl border border-border bg-card overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/20">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
                            {(() => {
                              const Icon = TYPE_ICON_MAP[item.chart.type] || BarChart3;
                              return <Icon className="h-2.5 w-2.5" />;
                            })()}
                            {TYPE_LABELS[item.chart.type]}
                          </Badge>
                          <span className="text-sm font-semibold truncate">
                            {item.chart.title}
                          </span>
                          {item.chart.collection && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 gap-0.5 hidden sm:inline-flex"
                            >
                              <Folder className="h-2.5 w-2.5" />
                              {item.chart.collection}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={() => removeChart(item.id)}
                          aria-label={`Remove ${item.chart.title}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="h-[220px] md:h-[260px]">
                        <ChartCanvas chart={item.chart} />
                      </div>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            </div>
          )}
        </main>
      </div>
    </motion.div>
  );
}

// ==================== Sub-components ====================

function AvailableChartList({
  charts,
  onAdd,
}: {
  charts: ChartData[];
  onAdd: (chart: ChartData) => void;
}) {
  if (charts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-sm text-muted-foreground text-center">
          No charts available. Create charts first.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {charts.map((chart, i) => (
        <motion.div
          key={chart.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.2 }}
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors group"
        >
          <div className="p-2 rounded-lg bg-muted shrink-0">
            {(() => {
              const Icon = TYPE_ICON_MAP[chart.type] || BarChart3;
              return <Icon className="h-4 w-4 text-muted-foreground" />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{chart.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {TYPE_LABELS[chart.type]}
              </span>
              {chart.collection && (
                <>
                  <span className="text-[10px] text-muted-foreground/40">·</span>
                  <span className="text-[10px] text-muted-foreground">{chart.collection}</span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAdd(chart)}
            className="rounded-lg shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
