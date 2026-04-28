import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const TEMPLATE_CHARTS = [
  {
    title: "Monthly Sales 2025",
    type: "bar",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    data: [12400, 19200, 15800, 22100, 18700, 24500],
    collection: "Sales",
    description: "Monthly sales figures for the first half of 2025",
    colorPalette: "default",
  },
  {
    title: "Revenue Growth",
    type: "line",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    data: [45000, 62000, 58000, 78000],
    collection: "Finance",
    description: "Quarterly revenue growth tracking",
    colorPalette: "default",
  },
  {
    title: "Market Share by Region",
    type: "pie",
    labels: ["North America", "Europe", "Asia Pacific", "Latin America", "Africa"],
    data: [35, 28, 22, 10, 5],
    collection: "Marketing",
    description: "Distribution of market share across global regions",
    colorPalette: "default",
  },
  {
    title: "Weekly Active Users",
    type: "line",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [3200, 4100, 3800, 4500, 5200, 2800, 2100],
    collection: "Product",
    description: "Daily active users across the week",
    colorPalette: "default",
  },
  {
    title: "Department Budget",
    type: "doughnut",
    labels: ["Engineering", "Marketing", "Sales", "Operations", "HR"],
    data: [40, 25, 15, 12, 8],
    collection: "Finance",
    description: "Budget allocation by department as percentages",
    colorPalette: "default",
  },
  {
    title: "Team Skills Radar",
    type: "radar",
    labels: ["Frontend", "Backend", "DevOps", "Design", "Testing", "Communication"],
    data: [85, 78, 65, 72, 80, 90],
    collection: "HR",
    description: "Team competency assessment across key skill areas",
    colorPalette: "default",
  },
  {
    title: "Product Performance",
    type: "polarArea",
    labels: ["Product A", "Product B", "Product C", "Product D", "Product E"],
    data: [450, 380, 520, 290, 410],
    collection: "Sales",
    description: "Performance metrics comparison across product lines",
    colorPalette: "default",
  },
  {
    title: "Quarterly Target vs Actual",
    type: "bar",
    labels: ["Q1", "Q2", "Q3", "Q4"],
    data: [85000, 92000, 78000, 105000],
    collection: "Sales",
    description: "Comparison of quarterly sales targets vs actual results",
    colorPalette: "default",
  },
];

// POST /api/charts/seed - Seed database with template charts
export async function POST(_request: NextRequest) {
  try {
    const existingCount = await db.chart.count();

    if (existingCount > 0) {
      return NextResponse.json({
        seeded: false,
        count: 0,
        message: "Charts already exist in the database",
      });
    }

    const charts = await Promise.all(
      TEMPLATE_CHARTS.map((template) =>
        db.chart.create({
          data: {
            title: template.title,
            type: template.type,
            labels: JSON.stringify(template.labels),
            data: JSON.stringify(template.data),
            description: template.description || "",
            collection: template.collection || null,
            colorPalette: template.colorPalette || "default",
          },
        })
      )
    );

    return NextResponse.json({
      seeded: true,
      count: charts.length,
    });
  } catch (error) {
    console.error("Error seeding charts:", error);
    return NextResponse.json(
      { error: "Failed to seed charts" },
      { status: 500 }
    );
  }
}
