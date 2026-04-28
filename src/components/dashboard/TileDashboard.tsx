"use client";

import { useEffect, useRef } from "react";
import type { ChartData } from "./ChartCanvas";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  LineChart,
  PieChart,
  CircleDot,
  BarChartBig,
} from "lucide-react";

interface TileDashboardProps {
  charts: ChartData[];
  selectedChart: ChartData | null;
  onSelectChart: (chart: ChartData | null) => void;
}

const TILE_COLORS = [
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "bg-pink-500/10 text-pink-600 dark:text-pink-400",
];

const CATEGORY_TILES = [
  { label: "Sales", icon: BarChart3, color: TILE_COLORS[0] },
  { label: "Revenue", icon: LineChart, color: TILE_COLORS[1] },
  { label: "Plans", icon: PieChart, color: TILE_COLORS[2] },
  { label: "Shares", icon: BarChartBig, color: TILE_COLORS[3] },
  { label: "Growth", icon: LineChart, color: TILE_COLORS[4] },
  { label: "Users", icon: CircleDot, color: TILE_COLORS[5] },
  { label: "Orders", icon: BarChart3, color: TILE_COLORS[6] },
  { label: "Metrics", icon: BarChartBig, color: TILE_COLORS[7] },
];

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  doughnut: CircleDot,
};

export default function TileDashboard({
  charts,
  selectedChart,
  onSelectChart,
}: TileDashboardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && selectedChart) {
      const activeEl = scrollRef.current.querySelector("[data-active='true']");
      activeEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedChart]);

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="p-4 space-y-4">
        {/* Category tiles */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Categories
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_TILES.map((tile) => (
              <button
                key={tile.label}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className={`p-2.5 rounded-lg ${tile.color} group-hover:scale-110 transition-transform`}>
                  <tile.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground">{tile.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Saved charts list */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Saved Charts
          </h3>
          {charts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <BarChartBig className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No charts available</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Create your first chart using the editor
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {charts.map((chart, idx) => {
                const Icon = TYPE_ICON_MAP[chart.type] || BarChart3;
                const isSelected = selectedChart?.id === chart.id;
                const tileColor = TILE_COLORS[idx % TILE_COLORS.length];

                return (
                  <button
                    key={chart.id}
                    data-active={isSelected}
                    onClick={() => onSelectChart(isSelected ? null : chart)}
                    className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-all group ${
                      isSelected
                        ? "bg-primary/10 border border-primary/20"
                        : "border border-transparent hover:bg-accent"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${tileColor} shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{chart.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {chart.type} · {chart.labels.length} items
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
