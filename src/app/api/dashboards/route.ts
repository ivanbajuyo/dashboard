import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/dashboards - Fetch all custom dashboards with their charts
export async function GET() {
  try {
    const dashboards = await db.customDashboard.findMany({
      include: {
        charts: {
          include: {
            chart: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(dashboards);
  } catch (error) {
    console.error("Error fetching dashboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboards" },
      { status: 500 }
    );
  }
}

// POST /api/dashboards - Create a new dashboard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, chartIds, columns } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Dashboard name is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(chartIds)) {
      return NextResponse.json(
        { error: "chartIds must be an array of chart IDs" },
        { status: 400 }
      );
    }

    // Verify all chart IDs exist
    if (chartIds.length > 0) {
      const existingCharts = await db.chart.findMany({
        where: { id: { in: chartIds } },
        select: { id: true },
      });

      const foundIds = new Set(existingCharts.map((c) => c.id));
      const missingIds = chartIds.filter((id: string) => !foundIds.has(id));

      if (missingIds.length > 0) {
        return NextResponse.json(
          { error: `Chart(s) not found: ${missingIds.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const layout = {
      chartIds,
      columns: columns || 2,
    };

    const dashboard = await db.customDashboard.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        layout: JSON.stringify(layout),
        isDefault: false,
        charts: {
          create: chartIds.map((chartId: string, index: number) => ({
            chartId,
            order: index,
            width: 1,
          })),
        },
      },
      include: {
        charts: {
          include: {
            chart: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error("Error creating dashboard:", error);
    return NextResponse.json(
      { error: "Failed to create dashboard" },
      { status: 500 }
    );
  }
}
