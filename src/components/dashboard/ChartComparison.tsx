"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, TrendingUp, TrendingDown, ArrowUpDown, Hash, Minus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChartData } from "./ChartCanvas";
import { TYPE_LABELS } from "./ChartCanvas";
import ChartCanvas from "./ChartCanvas";

// ==================== Types ====================

interface ChartComparisonProps {
  charts: ChartData[];
  onClose: () => void;
}

interface StatItem {
  label: string;
  valueA: string;
  valueB: string;
  highlight?: "higher" | "lower";
}

// ==================== Helpers ====================

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// ==================== Component ====================

export default function ChartComparison({ charts, onClose }: ChartComparisonProps) {
  const [chartAId, setChartAId] = useState<string>("");
  const [chartBId, setChartBId] = useState<string>("");

  const chartA = useMemo(() => charts.find((c) => c.id === chartAId), [charts, chartAId]);
  const chartB = useMemo(() => charts.find((c) => c.id === chartBId), [charts, chartBId]);

  const hasBothCharts = chartA && chartB;

  const stats = useMemo<StatItem[]>(() => {
    if (!hasBothCharts) return [];

    const totalA = chartA.data.reduce((s, v) => s + v, 0);
    const totalB = chartB.data.reduce((s, v) => s + v, 0);
    const avgA = chartA.data.length > 0 ? totalA / chartA.data.length : 0;
    const avgB = chartB.data.length > 0 ? totalB / chartB.data.length : 0;
    const minA = chartA.data.length > 0 ? Math.min(...chartA.data) : 0;
    const minB = chartB.data.length > 0 ? Math.min(...chartB.data) : 0;
    const maxA = chartA.data.length > 0 ? Math.max(...chartA.data) : 0;
    const maxB = chartB.data.length > 0 ? Math.max(...chartB.data) : 0;

    const statDefs: StatItem[] = [
      {
        label: "Total",
        valueA: formatNumber(totalA),
        valueB: formatNumber(totalB),
        highlight: totalA > totalB ? "higher" : totalA < totalB ? "lower" : undefined,
      },
      {
        label: "Average",
        valueA: formatNumber(avgA),
        valueB: formatNumber(avgB),
        highlight: avgA > avgB ? "higher" : avgA < avgB ? "lower" : undefined,
      },
      {
        label: "Min",
        valueA: formatNumber(minA),
        valueB: formatNumber(minB),
        highlight: minA > minB ? "higher" : minA < minB ? "lower" : undefined,
      },
      {
        label: "Max",
        valueA: formatNumber(maxA),
        valueB: formatNumber(maxB),
        highlight: maxA > maxB ? "higher" : maxA < maxB ? "lower" : undefined,
      },
      {
        label: "Data Points",
        valueA: chartA.labels.length.toString(),
        valueB: chartB.labels.length.toString(),
      },
    ];

    return statDefs;
  }, [hasBothCharts, chartA, chartB]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <ArrowUpDown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Chart Comparison</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select two charts to compare side by side
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-xl"
          aria-label="Close comparison"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Chart Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Chart A
          </label>
          <Select value={chartAId} onValueChange={setChartAId}>
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder="Select first chart..." />
            </SelectTrigger>
            <SelectContent>
              {charts
                .filter((c) => c.id !== chartBId)
                .map((chart) => (
                  <SelectItem key={chart.id} value={chart.id}>
                    <span className="flex items-center gap-2">
                      <span className="truncate">{chart.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({TYPE_LABELS[chart.type]})
                      </span>
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            Chart B
          </label>
          <Select value={chartBId} onValueChange={setChartBId}>
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder="Select second chart..." />
            </SelectTrigger>
            <SelectContent>
              {charts
                .filter((c) => c.id !== chartAId)
                .map((chart) => (
                  <SelectItem key={chart.id} value={chart.id}>
                    <span className="flex items-center gap-2">
                      <span className="truncate">{chart.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({TYPE_LABELS[chart.type]})
                      </span>
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty State */}
      <AnimatePresence mode="wait">
        {!hasBothCharts && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-card/50"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Select two charts to compare</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Use the dropdowns above to pick two charts from your collection. They will be displayed
              side by side with statistical comparisons.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts + Stats */}
      <AnimatePresence mode="wait">
        {hasBothCharts && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Stats Comparison Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Comparison Statistics
                </h3>
              </div>
              <div className="divide-y divide-border">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    className="grid grid-cols-3 items-center px-5 py-3"
                  >
                    <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                    <span
                      className={`text-sm font-semibold text-center ${
                        stat.highlight === "higher"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : stat.highlight === "lower"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-foreground"
                      }`}
                    >
                      {stat.valueA}
                      {stat.highlight === "higher" && (
                        <TrendingUp className="inline h-3 w-3 ml-1" />
                      )}
                      {stat.highlight === "lower" && (
                        <TrendingDown className="inline h-3 w-3 ml-1" />
                      )}
                    </span>
                    <span
                      className={`text-sm font-semibold text-center ${
                        stat.highlight === "lower"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : stat.highlight === "higher"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-foreground"
                      }`}
                    >
                      {stat.valueB}
                      {stat.highlight === "higher" && (
                        <TrendingUp className="inline h-3 w-3 ml-1" />
                      )}
                      {stat.highlight === "lower" && (
                        <TrendingDown className="inline h-3 w-3 ml-1" />
                      )}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Column headers under stats */}
              <div className="grid grid-cols-3 px-5 py-2 bg-muted/20 border-t border-border text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <span>Stat</span>
                <span className="text-center flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  {chartA.title}
                </span>
                <span className="text-center flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  {chartB.title}
                </span>
              </div>
            </div>

            {/* Side by Side Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="rounded-2xl border border-emerald-500/20 bg-card overflow-hidden"
              >
                <div className="px-4 py-2.5 border-b border-border bg-emerald-500/5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold truncate">{chartA.title}</span>
                  <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[chartA.type]}
                  </span>
                </div>
                <div className="h-[320px] md:h-[400px]">
                  <ChartCanvas chart={chartA} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="rounded-2xl border border-violet-500/20 bg-card overflow-hidden"
              >
                <div className="px-4 py-2.5 border-b border-border bg-violet-500/5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span className="text-sm font-semibold truncate">{chartB.title}</span>
                  <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[chartB.type]}
                  </span>
                </div>
                <div className="h-[320px] md:h-[400px]">
                  <ChartCanvas chart={chartB} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
