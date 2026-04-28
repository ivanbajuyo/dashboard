"use client";

import { useRef, useMemo, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Pie, Doughnut, PolarArea, Radar } from "react-chartjs-2";
import { motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ==================== Types ====================

export type ChartType = "bar" | "line" | "pie" | "doughnut" | "polarArea" | "radar";

export interface ChartDataset {
  label: string;
  data: number[];
}

export interface ChartData {
  id: string;
  title: string;
  type: ChartType;
  labels: string[];
  data: number[];
  datasets?: ChartDataset[];
  description?: string;
  colorPalette?: string;
  isPinned?: boolean;
  collection?: string | null;
}

// ==================== Color Palettes ====================

interface ColorPalette {
  name: string;
  solid: string[];
  alpha: string[];
}

const PALETTE_DEFAULT: ColorPalette = {
  name: "Default",
  solid: [
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
    "hsl(210, 80%, 55%)",
    "hsl(80, 65%, 45%)",
  ],
  alpha: [
    "hsla(220, 70%, 55%, 0.75)",
    "hsla(160, 60%, 45%, 0.75)",
    "hsla(30, 80%, 55%, 0.75)",
    "hsla(340, 65%, 50%, 0.75)",
    "hsla(270, 55%, 55%, 0.75)",
    "hsla(190, 70%, 45%, 0.75)",
    "hsla(50, 75%, 50%, 0.75)",
    "hsla(0, 65%, 55%, 0.75)",
    "hsla(120, 50%, 45%, 0.75)",
    "hsla(280, 50%, 55%, 0.75)",
    "hsla(210, 80%, 55%, 0.75)",
    "hsla(80, 65%, 45%, 0.75)",
  ],
};

const PALETTE_OCEAN: ColorPalette = {
  name: "Ocean",
  solid: [
    "hsl(210, 80%, 55%)",
    "hsl(195, 75%, 50%)",
    "hsl(180, 65%, 45%)",
    "hsl(220, 70%, 60%)",
    "hsl(200, 85%, 45%)",
    "hsl(170, 60%, 42%)",
    "hsl(230, 65%, 55%)",
    "hsl(185, 70%, 48%)",
    "hsl(205, 75%, 58%)",
    "hsl(175, 55%, 40%)",
    "hsl(215, 70%, 50%)",
    "hsl(190, 60%, 52%)",
  ],
  alpha: [
    "hsla(210, 80%, 55%, 0.75)",
    "hsla(195, 75%, 50%, 0.75)",
    "hsla(180, 65%, 45%, 0.75)",
    "hsla(220, 70%, 60%, 0.75)",
    "hsla(200, 85%, 45%, 0.75)",
    "hsla(170, 60%, 42%, 0.75)",
    "hsla(230, 65%, 55%, 0.75)",
    "hsla(185, 70%, 48%, 0.75)",
    "hsla(205, 75%, 58%, 0.75)",
    "hsla(175, 55%, 40%, 0.75)",
    "hsla(215, 70%, 50%, 0.75)",
    "hsla(190, 60%, 52%, 0.75)",
  ],
};

const PALETTE_SUNSET: ColorPalette = {
  name: "Sunset",
  solid: [
    "hsl(25, 90%, 55%)",
    "hsl(10, 80%, 55%)",
    "hsl(45, 85%, 55%)",
    "hsl(350, 75%, 55%)",
    "hsl(35, 85%, 50%)",
    "hsl(0, 70%, 55%)",
    "hsl(330, 65%, 55%)",
    "hsl(15, 80%, 50%)",
    "hsl(40, 90%, 50%)",
    "hsl(340, 70%, 50%)",
    "hsl(20, 85%, 55%)",
    "hsl(50, 80%, 50%)",
  ],
  alpha: [
    "hsla(25, 90%, 55%, 0.75)",
    "hsla(10, 80%, 55%, 0.75)",
    "hsla(45, 85%, 55%, 0.75)",
    "hsla(350, 75%, 55%, 0.75)",
    "hsla(35, 85%, 50%, 0.75)",
    "hsla(0, 70%, 55%, 0.75)",
    "hsla(330, 65%, 55%, 0.75)",
    "hsla(15, 80%, 50%, 0.75)",
    "hsla(40, 90%, 50%, 0.75)",
    "hsla(340, 70%, 50%, 0.75)",
    "hsla(20, 85%, 55%, 0.75)",
    "hsla(50, 80%, 50%, 0.75)",
  ],
};

const PALETTE_FOREST: ColorPalette = {
  name: "Forest",
  solid: [
    "hsl(140, 50%, 40%)",
    "hsl(120, 45%, 38%)",
    "hsl(80, 40%, 42%)",
    "hsl(30, 45%, 35%)",
    "hsl(160, 45%, 38%)",
    "hsl(100, 40%, 40%)",
    "hsl(150, 55%, 35%)",
    "hsl(25, 50%, 32%)",
    "hsl(170, 40%, 42%)",
    "hsl(90, 45%, 38%)",
    "hsl(110, 50%, 36%)",
    "hsl(20, 40%, 38%)",
  ],
  alpha: [
    "hsla(140, 50%, 40%, 0.75)",
    "hsla(120, 45%, 38%, 0.75)",
    "hsla(80, 40%, 42%, 0.75)",
    "hsla(30, 45%, 35%, 0.75)",
    "hsla(160, 45%, 38%, 0.75)",
    "hsla(100, 40%, 40%, 0.75)",
    "hsla(150, 55%, 35%, 0.75)",
    "hsla(25, 50%, 32%, 0.75)",
    "hsla(170, 40%, 42%, 0.75)",
    "hsla(90, 45%, 38%, 0.75)",
    "hsla(110, 50%, 36%, 0.75)",
    "hsla(20, 40%, 38%, 0.75)",
  ],
};

const PALETTE_BERRY: ColorPalette = {
  name: "Berry",
  solid: [
    "hsl(300, 55%, 50%)",
    "hsl(330, 60%, 50%)",
    "hsl(280, 50%, 55%)",
    "hsl(320, 55%, 45%)",
    "hsl(350, 65%, 55%)",
    "hsl(270, 45%, 55%)",
    "hsl(340, 50%, 50%)",
    "hsl(310, 60%, 48%)",
    "hsl(290, 55%, 50%)",
    "hsl(325, 55%, 52%)",
    "hsl(260, 50%, 58%)",
    "hsl(345, 60%, 48%)",
  ],
  alpha: [
    "hsla(300, 55%, 50%, 0.75)",
    "hsla(330, 60%, 50%, 0.75)",
    "hsla(280, 50%, 55%, 0.75)",
    "hsla(320, 55%, 45%, 0.75)",
    "hsla(350, 65%, 55%, 0.75)",
    "hsla(270, 45%, 55%, 0.75)",
    "hsla(340, 50%, 50%, 0.75)",
    "hsla(310, 60%, 48%, 0.75)",
    "hsla(290, 55%, 50%, 0.75)",
    "hsla(325, 55%, 52%, 0.75)",
    "hsla(260, 50%, 58%, 0.75)",
    "hsla(345, 60%, 48%, 0.75)",
  ],
};

const PALETTE_MONOCHROME: ColorPalette = {
  name: "Monochrome",
  solid: [
    "hsl(0, 0%, 20%)",
    "hsl(0, 0%, 30%)",
    "hsl(0, 0%, 40%)",
    "hsl(0, 0%, 50%)",
    "hsl(0, 0%, 60%)",
    "hsl(0, 0%, 70%)",
    "hsl(0, 0%, 25%)",
    "hsl(0, 0%, 35%)",
    "hsl(0, 0%, 45%)",
    "hsl(0, 0%, 55%)",
    "hsl(0, 0%, 65%)",
    "hsl(0, 0%, 75%)",
  ],
  alpha: [
    "hsla(0, 0%, 20%, 0.75)",
    "hsla(0, 0%, 30%, 0.75)",
    "hsla(0, 0%, 40%, 0.75)",
    "hsla(0, 0%, 50%, 0.75)",
    "hsla(0, 0%, 60%, 0.75)",
    "hsla(0, 0%, 70%, 0.75)",
    "hsla(0, 0%, 25%, 0.75)",
    "hsla(0, 0%, 35%, 0.75)",
    "hsla(0, 0%, 45%, 0.75)",
    "hsla(0, 0%, 55%, 0.75)",
    "hsla(0, 0%, 65%, 0.75)",
    "hsla(0, 0%, 75%, 0.75)",
  ],
};

export const ALL_PALETTES: ColorPalette[] = [
  PALETTE_DEFAULT,
  PALETTE_OCEAN,
  PALETTE_SUNSET,
  PALETTE_FOREST,
  PALETTE_BERRY,
  PALETTE_MONOCHROME,
];

// ==================== Chart Types & Labels ====================

export const ALL_CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
  { value: "doughnut", label: "Doughnut" },
  { value: "polarArea", label: "Polar Area" },
  { value: "radar", label: "Radar" },
];

export const TYPE_LABELS: Record<string, string> = {
  bar: "Bar Chart",
  line: "Line Chart",
  pie: "Pie Chart",
  doughnut: "Doughnut",
  polarArea: "Polar Area",
  radar: "Radar",
};

const VALID_TYPES = new Set<string>(ALL_CHART_TYPES.map((t) => t.value));

export function isValidChartType(type: string): boolean {
  return VALID_TYPES.has(type);
}

// ==================== Helpers ====================

function isArcType(type: ChartType): boolean {
  return type === "pie" || type === "doughnut" || type === "polarArea";
}

function isRadialType(type: ChartType): boolean {
  return type === "radar" || type === "polarArea";
}

function isMultiColorPerBar(type: ChartType): boolean {
  return type === "bar" || type === "radar" || isArcType(type);
}

/** Resolve a palette by name, falling back to Default */
function resolvePalette(paletteName?: string): ColorPalette {
  if (paletteName) {
    const found = ALL_PALETTES.find((p) => p.name === paletteName);
    if (found) return found;
  }
  return PALETTE_DEFAULT;
}

/** Chart types where multi-dataset is rendered (bar and line) */
function supportsMultiDataset(type: ChartType): boolean {
  return type === "bar" || type === "line";
}

// ==================== Component ====================

interface ChartCanvasProps {
  chart: ChartData;
  chartRef?: React.MutableRefObject<any>;
}

export default function ChartCanvas({ chart, chartRef }: ChartCanvasProps) {
  const localChartRef = useRef<ChartJS<"bar" | "line" | "pie" | "doughnut" | "polarArea" | "radar"> | null>(null);

  // Callback ref: store chart instance locally and sync to external ref
  const getChartRef = useCallback(
    (node: ChartJS<"bar" | "line" | "pie" | "doughnut" | "polarArea" | "radar"> | null) => {
      localChartRef.current = node;
      if (chartRef) {
        chartRef.current = node;
      }
    },
    [chartRef]
  );

  const palette = useMemo(() => resolvePalette(chart.colorPalette), [chart.colorPalette]);

  const hasMultiDataset = useMemo(() => {
    return (
      supportsMultiDataset(chart.type) &&
      !!chart.datasets &&
      chart.datasets.length > 0
    );
  }, [chart.type, chart.datasets]);

  const chartData = useMemo(() => {
    if (!chart) return null;

    const multiColor = isMultiColorPerBar(chart.type);
    const arc = isArcType(chart.type);
    const isLine = chart.type === "line";
    const isRadar = chart.type === "radar";

    // ---- Multi-dataset path (bar / line) ----
    if (hasMultiDataset && chart.datasets) {
      const datasets = chart.datasets.map((ds, idx) => {
        const colorIdx = idx % palette.solid.length;
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor:
            chart.type === "bar"
              ? palette.alpha[colorIdx]
              : palette.alpha[colorIdx].replace("0.75", "0.15"),
          borderColor: palette.solid[colorIdx],
          borderWidth: 2,
          borderRadius: chart.type === "bar" ? 8 : 0,
          tension: isLine ? 0.4 : 0,
          fill: isLine ? true : undefined,
          pointBackgroundColor: isLine ? palette.solid[colorIdx] : undefined,
          pointBorderColor: isLine ? "#fff" : undefined,
          pointBorderWidth: isLine ? 2 : undefined,
          pointRadius: isLine ? 5 : undefined,
          pointHoverRadius: isLine ? 8 : undefined,
        };
      });

      return { labels: chart.labels, datasets };
    }

    // ---- Single dataset path (all types) ----
    return {
      labels: chart.labels,
      datasets: [
        {
          label: chart.title,
          data: chart.data,
          backgroundColor: multiColor
            ? chart.labels.map((_, i) => palette.alpha[i % palette.alpha.length])
            : isLine
              ? palette.alpha[0].replace("0.75", "0.15")
              : isRadar
                ? palette.alpha[0].replace("0.75", "0.2")
                : palette.alpha[0],
          borderColor: multiColor
            ? chart.labels.map((_, i) => palette.solid[i % palette.solid.length])
            : palette.solid[0],
          borderWidth: arc ? 2 : 2,
          borderRadius: chart.type === "bar" ? 8 : 0,
          tension: isLine ? 0.4 : 0,
          fill: isLine || isRadar ? true : undefined,
          pointBackgroundColor: isLine || isRadar ? palette.solid[0] : undefined,
          pointBorderColor: isLine || isRadar ? "#fff" : undefined,
          pointBorderWidth: isLine || isRadar ? 2 : undefined,
          pointRadius: isLine || isRadar ? 5 : undefined,
          pointHoverRadius: isLine || isRadar ? 8 : undefined,
        },
      ],
    };
  }, [chart, palette, hasMultiDataset]);

  const chartOptions = useMemo(() => {
    if (!chart) return {};

    const arc = isArcType(chart.type);
    const noScales = arc || chart.type === "radar";
    const showLegend = arc || chart.type === "radar" || hasMultiDataset;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 700,
        easing: "easeOutQuart" as const,
      },
      plugins: {
        legend: {
          display: showLegend,
          position: "bottom" as const,
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 12, family: "inherit" },
            color: "hsl(0, 0%, 35%)",
          },
        },
        title: { display: false },
        tooltip: {
          backgroundColor: "hsl(0, 0%, 10%)",
          titleFont: { size: 13, weight: "600" as const },
          bodyFont: { size: 12 },
          padding: 14,
          cornerRadius: 10,
          displayColors: true,
          boxPadding: 6,
        },
      },
      scales: noScales
        ? chart.type === "radar"
          ? {
              r: {
                grid: { color: "hsl(0, 0%, 88%)" },
                angleLines: { color: "hsl(0, 0%, 88%)" },
                pointLabels: { font: { size: 12 }, color: "hsl(0, 0%, 40%)" },
                ticks: { display: false },
                beginAtZero: true,
              },
            }
          : {}
        : {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { font: { size: 12 }, padding: 8 },
            },
            y: {
              grid: { color: "hsl(0, 0%, 92%)", lineWidth: 1 },
              border: { display: false },
              ticks: { font: { size: 12 }, padding: 12 },
              beginAtZero: true,
            },
          },
    };
  }, [chart, hasMultiDataset]);

  const ChartComponent: Record<ChartType, React.ComponentType<any>> = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut,
    polarArea: PolarArea,
    radar: Radar,
  };

  const Component = ChartComponent[chart.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full flex flex-col gap-2 p-6"
    >
      <div className="flex items-center justify-between shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight truncate">{chart.title}</h3>
            {chart.collection && (
              <span className="shrink-0 inline-flex items-center rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {chart.collection}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {TYPE_LABELS[chart.type]} &middot; {chart.labels.length} data points
          </p>
          {chart.description && (
            <p className="text-sm text-muted-foreground italic mt-1 line-clamp-2">
              {chart.description}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-medium shrink-0 ml-4">
          {TYPE_LABELS[chart.type]}
        </span>
      </div>
      <div className="flex-1 min-h-0 relative">
        <Component ref={getChartRef} data={chartData!} options={chartOptions} />
      </div>
    </motion.div>
  );
}
