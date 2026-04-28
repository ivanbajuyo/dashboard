"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  LineChart,
  PieChart,
  CircleDot,
  BarChartBig,
  Plus,
  TrendingUp,
  TrendingDown,
  Hash,
  Search,
  Star,
  LayoutGrid,
  List,
  Folder,
  Pin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChartData } from "./ChartCanvas";
import { TYPE_LABELS, ALL_CHART_TYPES } from "./ChartCanvas";

interface DashboardGridProps {
  charts: ChartData[];
  onSelectChart: (chart: ChartData) => void;
  onOpenCreate: () => void;
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  typeFilter: string;
  onTypeFilterChange: (filter: string) => void;
  collections: string[];
  collectionFilter: string;
  onCollectionFilterChange: (filter: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onTogglePin: (chart: ChartData) => void;
}

const TILE_STYLES = [
  { bg: "from-emerald-500/15 to-emerald-600/5", border: "border-emerald-500/20 hover:border-emerald-500/40", icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  { bg: "from-amber-500/15 to-amber-600/5", border: "border-amber-500/20 hover:border-amber-500/40", icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  { bg: "from-rose-500/15 to-rose-600/5", border: "border-rose-500/20 hover:border-rose-500/40", icon: "bg-rose-500/15 text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  { bg: "from-sky-500/15 to-sky-600/5", border: "border-sky-500/20 hover:border-sky-500/40", icon: "bg-sky-500/15 text-sky-600 dark:text-sky-400", dot: "bg-sky-500" },
  { bg: "from-violet-500/15 to-violet-600/5", border: "border-violet-500/20 hover:border-violet-500/40", icon: "bg-violet-500/15 text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
  { bg: "from-orange-500/15 to-orange-600/5", border: "border-orange-500/20 hover:border-orange-500/40", icon: "bg-orange-500/15 text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  { bg: "from-teal-500/15 to-teal-600/5", border: "border-teal-500/20 hover:border-teal-500/40", icon: "bg-teal-500/15 text-teal-600 dark:text-teal-400", dot: "bg-teal-500" },
  { bg: "from-pink-500/15 to-pink-600/5", border: "border-pink-500/20 hover:border-pink-500/40", icon: "bg-pink-500/15 text-pink-600 dark:text-pink-400", dot: "bg-pink-500" },
];

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  doughnut: CircleDot,
  polarArea: PieChart,
  radar: BarChartBig,
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const isTrendingUp = data[data.length - 1] >= data[0];

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${data[0]}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isTrendingUp ? "#10b981" : "#f43f5e"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isTrendingUp ? "#10b981" : "#f43f5e"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#spark-${data[0]})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={isTrendingUp ? "#10b981" : "#f43f5e"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={w}
        cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
        r="3"
        fill={isTrendingUp ? "#10b981" : "#f43f5e"}
      />
    </svg>
  );
}

// ---------- Loading Skeleton ----------

function LoadingSkeleton() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Search + filters skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
      {/* Type pills skeleton */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {/* Tiles skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ---------- List View Row ----------

function ListRow({
  chart,
  onSelect,
  onTogglePin,
}: {
  chart: ChartData;
  onSelect: () => void;
  onTogglePin: () => void;
}) {
  const Icon = TYPE_ICON_MAP[chart.type] || BarChart3;
  const total = chart.data.reduce((s, v) => s + v, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
        className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left group cursor-pointer"
      >
        {/* Type icon */}
        <div className="shrink-0 p-2 rounded-lg bg-muted group-hover:bg-accent transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{chart.title}</span>
            {chart.isPinned && (
              <Pin className="h-3 w-3 text-amber-500 shrink-0" />
            )}
          </div>
          {chart.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {chart.description.length > 50
                ? chart.description.slice(0, 50) + "..."
                : chart.description}
            </p>
          )}
        </div>

        {/* Badges - hidden on small screens */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {TYPE_LABELS[chart.type]}
          </Badge>
          {chart.collection && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Folder className="h-2.5 w-2.5" />
              {chart.collection}
            </Badge>
          )}
        </div>

        {/* Data point count */}
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Hash className="h-3 w-3" />
          <span>{chart.labels.length}</span>
        </div>

        {/* Sparkline */}
        <div className="hidden md:block shrink-0">
          {chart.data.length >= 2 && <MiniSparkline data={chart.data} />}
        </div>

        {/* Total value */}
        <div className="hidden lg:block text-right shrink-0 w-16">
          <span className="text-sm font-semibold">{formatNumber(total)}</span>
        </div>

        {/* Pin button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
          title={chart.isPinned ? "Unpin chart" : "Pin chart"}
        >
          {chart.isPinned ? (
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
          ) : (
            <Star className="h-4 w-4 text-muted-foreground/40 hover:text-amber-500" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ---------- Grid Tile ----------

function ChartTile({
  chart,
  onSelect,
  onTogglePin,
}: {
  chart: ChartData;
  onSelect: () => void;
  onTogglePin: () => void;
}) {
  const style = TILE_STYLES[0]; // We'll compute a stable index from chart.id
  const stableIdx =
    chart.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    TILE_STYLES.length;
  const tileStyle = TILE_STYLES[stableIdx];
  const Icon = TYPE_ICON_MAP[chart.type] || BarChart3;
  const total = chart.data.reduce((s, v) => s + v, 0);
  const isTrendingUp =
    chart.data.length >= 2 && chart.data[chart.data.length - 1] >= chart.data[0];
  const TrendIcon = isTrendingUp ? TrendingUp : TrendingDown;
  const trendPercent =
    chart.data.length >= 2 && chart.data[0] !== 0
      ? (
          ((chart.data[chart.data.length - 1] - chart.data[0]) /
            chart.data[0]) *
          100
        ).toFixed(1)
      : "0";

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex flex-col rounded-2xl border ${tileStyle.border} bg-gradient-to-br ${tileStyle.bg} p-5 min-h-[200px] transition-all cursor-pointer text-left group overflow-hidden`}
    >
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-30">
        <div
          className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${tileStyle.dot} blur-2xl`}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-auto relative z-10">
        <div className={`p-2.5 rounded-xl ${tileStyle.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1.5">
          {/* Type badge */}
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {TYPE_LABELS[chart.type]}
          </span>
          {/* Pin button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="p-1 rounded-lg hover:bg-background/60 backdrop-blur-sm transition-colors"
            title={chart.isPinned ? "Unpin chart" : "Pin chart"}
          >
            {chart.isPinned ? (
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            ) : (
              <Star className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-amber-500" />
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 mt-4 space-y-2">
        <h3 className="text-base font-semibold leading-tight truncate">
          {chart.title}
        </h3>
        {/* Collection badge */}
        {chart.collection && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 gap-0.5 w-fit"
          >
            <Folder className="h-2.5 w-2.5" />
            {chart.collection}
          </Badge>
        )}
        {/* Description hint */}
        {chart.description && (
          <p className="text-xs text-muted-foreground/70 line-clamp-1">
            {chart.description.length > 50
              ? chart.description.slice(0, 50) + "..."
              : chart.description}
          </p>
        )}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold tracking-tight">
              {formatNumber(total)}
            </p>
            {chart.data.length >= 2 && (
              <div className="flex items-center gap-1 mt-0.5">
                <TrendIcon
                  className={`h-3 w-3 ${isTrendingUp ? "text-emerald-500" : "text-rose-500"}`}
                />
                <span
                  className={`text-xs font-medium ${isTrendingUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {isTrendingUp ? "+" : ""}
                  {trendPercent}%
                </span>
                <span className="text-[10px] text-muted-foreground ml-0.5">
                  vs first
                </span>
              </div>
            )}
          </div>
          {chart.data.length >= 2 && (
            <MiniSparkline data={chart.data} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-3 pt-3 border-t border-foreground/5 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {chart.labels.length} data points
        </span>
        <span className="text-[10px] text-muted-foreground">
          {chart.type === "pie" || chart.type === "doughnut" || chart.type === "polarArea"
            ? `${chart.labels.length} segments`
            : chart.type === "radar"
              ? `${chart.labels.length} axes`
              : `${chart.labels[0]} → ${chart.labels[chart.labels.length - 1]}`}
        </span>
      </div>
    </motion.div>
  );
}

// ---------- Main Component ----------

export default function DashboardGrid({
  charts,
  onSelectChart,
  onOpenCreate,
  isLoading,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  collections,
  collectionFilter,
  onCollectionFilterChange,
  viewMode,
  onViewModeChange,
  onTogglePin,
}: DashboardGridProps) {
  const stats = useMemo(() => {
    const pinnedCount = charts.filter((c) => c.isPinned).length;
    const uniqueCollections = new Set(
      charts.filter((c) => c.collection).map((c) => c.collection)
    );
    return {
      totalCharts: charts.length,
      pinnedCount,
      collectionCount: uniqueCollections.size,
    };
  }, [charts]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Search + Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search charts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {/* Collection filter */}
        <Select value={collectionFilter} onValueChange={onCollectionFilterChange}>
          <SelectTrigger size="sm" className="h-10 rounded-xl w-full sm:w-[180px]">
            <Folder className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="All Charts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Charts</SelectItem>
            <SelectItem value="__none__">Uncategorized</SelectItem>
            {collections.map((col) => (
              <SelectItem key={col} value={col}>
                {col}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex border rounded-xl overflow-hidden shrink-0">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-10 w-10 rounded-none"
            onClick={() => onViewModeChange("grid")}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-10 w-10 rounded-none"
            onClick={() => onViewModeChange("list")}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onTypeFilterChange("__all__")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            typeFilter === "__all__"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          All
        </button>
        {ALL_CHART_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() => onTypeFilterChange(ct.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              typeFilter === ct.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Charts",
            value: stats.totalCharts,
            icon: BarChartBig,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Pinned",
            value: stats.pinnedCount,
            icon: Star,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Collections",
            value: stats.collectionCount,
            icon: Folder,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Chart Types",
            value: new Set(charts.map((c) => c.type)).size,
            icon: PieChart,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-500/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Chart content */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your Charts
          </h2>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Chart
          </button>
        </div>

        {charts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-card/50">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <BarChartBig className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No charts found</h3>
            <p className="text-sm text-muted-foreground mb-5 text-center max-w-sm">
              {search || typeFilter !== "__all__" || collectionFilter !== "__all__"
                ? "No charts match your current filters. Try adjusting your search or filters."
                : "Create your first chart to get started with interactive data visualization."}
            </p>
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Your First Chart
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* ============ GRID VIEW ============ */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create New Tile */}
            <motion.button
              onClick={onOpenCreate}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 min-h-[200px] hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Create New Chart
              </span>
            </motion.button>

            {/* Chart Tiles */}
            {charts.map((chart) => (
              <ChartTile
                key={chart.id}
                chart={chart}
                onSelect={() => onSelectChart(chart)}
                onTogglePin={() => onTogglePin(chart)}
              />
            ))}
          </div>
        ) : (
          /* ============ LIST VIEW ============ */
          <div className="space-y-2">
            {/* Chart rows */}
            {charts.map((chart) => (
              <ListRow
                key={chart.id}
                chart={chart}
                onSelect={() => onSelectChart(chart)}
                onTogglePin={() => onTogglePin(chart)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
