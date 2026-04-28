"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, BarChartBig, Database } from "lucide-react";
import ChartCanvas, { type ChartData, TYPE_LABELS } from "./ChartCanvas";

// ==================== Types ====================

interface DashboardOverviewProps {
  charts: ChartData[];
  onSelectChart: (chart: ChartData) => void;
  isLoading: boolean;
}

// ==================== Helpers ====================

/** Map chart type to a subtle background tint class for the mini chart area */
function getChartTint(type: string): string {
  switch (type) {
    case "bar":
      return "bg-emerald-50 dark:bg-emerald-950/30";
    case "line":
      return "bg-amber-50 dark:bg-amber-950/30";
    case "pie":
      return "bg-rose-50 dark:bg-rose-950/30";
    case "doughnut":
      return "bg-violet-50 dark:bg-violet-950/30";
    case "polarArea":
      return "bg-sky-50 dark:bg-sky-950/30";
    case "radar":
      return "bg-teal-50 dark:bg-teal-950/30";
    default:
      return "bg-muted/40";
  }
}

/** Map chart type to a small icon for the card header */
function getChartIcon(type: string) {
  return <BarChart3 className="h-4 w-4" />;
}

// ==================== Animation ====================

const cardVariants: any = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

// ==================== Skeleton Card ====================

function SkeletonCard() {
  return (
    <Card className="py-4 gap-4 overflow-hidden">
      <CardHeader className="gap-2 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="w-full h-[180px] rounded-lg" />
        <div className="flex items-center gap-2 mt-3">
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Empty State ====================

function EmptyState({ onSelectChart }: { onSelectChart: (chart: ChartData) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <BarChartBig className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        No charts yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Create your first chart to see it appear here. Click the &quot;New&quot; button to get started with your data visualization journey.
      </p>
    </motion.div>
  );
}

// ==================== Chart Card ====================

function ChartCard({
  chart,
  index,
  onSelect,
}: {
  chart: ChartData;
  index: number;
  onSelect: (chart: ChartData) => void;
}) {
  const tintClass = getChartTint(chart.type);
  const typeLabel = TYPE_LABELS[chart.type] ?? chart.type;
  const dataPointCount = chart.labels.length;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <Card
        className="py-0 gap-0 overflow-hidden cursor-pointer group hover:shadow-md hover:border-primary/20 transition-all duration-200"
        onClick={() => onSelect(chart)}
      >
        {/* Card Header */}
        <CardHeader className="gap-2 py-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                {getChartIcon(chart.type)}
              </span>
              <h3 className="text-sm font-semibold truncate leading-tight" title={chart.title}>
                {chart.title}
              </h3>
            </div>
            <Badge variant="secondary" className="text-[11px] shrink-0">
              {typeLabel}
            </Badge>
          </div>
        </CardHeader>

        {/* Mini Chart */}
        <CardContent className="pt-0 pb-3">
          <div
            className={`w-full min-h-[180px] max-h-[220px] rounded-lg p-3 overflow-hidden ${tintClass} transition-colors group-hover:ring-1 group-hover:ring-primary/10`}
          >
            <ChartCanvas chart={chart} />
          </div>

          {/* Data Point Count */}
          <div className="flex items-center gap-1.5 mt-3 text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {dataPointCount} data point{dataPointCount !== 1 ? "s" : ""}
            </span>
            {chart.collection && (
              <>
                <span className="text-muted-foreground/40 mx-0.5">&middot;</span>
                <span className="text-xs font-medium truncate max-w-[120px]">
                  {chart.collection}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ==================== Main Component ====================

export default function DashboardOverview({
  charts,
  onSelectChart,
  isLoading,
}: DashboardOverviewProps) {
  const chartCount = charts.length;

  const totalDataPoints = useMemo(() => {
    return charts.reduce((sum, c) => sum + c.labels.length, 0);
  }, [charts]);

  // Skeleton grid
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>
        {/* Skeleton grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && chartCount === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight">Overview</h2>
          <Badge variant="outline" className="text-xs">
            0 charts
          </Badge>
        </div>
        <EmptyState onSelectChart={onSelectChart} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight">Overview</h2>
          <Badge variant="secondary" className="text-xs">
            {chartCount} chart{chartCount !== 1 ? "s" : ""}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {totalDataPoints.toLocaleString()} total data points
        </span>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {charts.map((chart, index) => (
            <ChartCard
              key={chart.id}
              chart={chart}
              index={index}
              onSelect={onSelectChart}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
