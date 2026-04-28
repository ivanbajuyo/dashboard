import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/dashboards/[id] - Get a single dashboard with its charts
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dashboard = await db.customDashboard.findUnique({
      where: { id },
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

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}

// PUT /api/dashboards/[id] - Update a dashboard
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, chartIds, columns } = body;

    const existing = await db.customDashboard.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    if (name !== undefined && (!name || !String(name).trim())) {
      return NextResponse.json(
        { error: "Dashboard name cannot be empty" },
        { status: 400 }
      );
    }

    // If chartIds are provided, replace all dashboard charts
    if (Array.isArray(chartIds)) {
      // Verify all chart IDs exist
      if (chartIds.length > 0) {
        const existingCharts = await db.chart.findMany({
          where: { id: { in: chartIds } },
          select: { id: true },
        });

        const foundIds = new Set(existingCharts.map((c) => c.id));
        const missingIds = chartIds.filter((cid: string) => !foundIds.has(cid));

        if (missingIds.length > 0) {
          return NextResponse.json(
            { error: `Chart(s) not found: ${missingIds.join(", ")}` },
            { status: 400 }
          );
        }
      }

      // Delete existing dashboard-chart associations
      await db.dashboardChart.deleteMany({
        where: { dashboardId: id },
      });

      // Create new associations
      if (chartIds.length > 0) {
        await db.dashboardChart.createMany({
          data: chartIds.map((chartId: string, index: number) => ({
            dashboardId: id,
            chartId,
            order: index,
            width: 1,
          })),
        });
      }

      // Update layout JSON
      const layout = {
        chartIds,
        columns: columns || 2,
      };

      const dashboard = await db.customDashboard.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: String(name).trim() }),
          ...(description !== undefined && {
            description: description?.trim() || null,
          }),
          layout: JSON.stringify(layout),
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

      return NextResponse.json(dashboard);
    }

    // No chartIds — just update name/description/layout
    const dashboard = await db.customDashboard.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
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

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error("Error updating dashboard:", error);
    return NextResponse.json(
      { error: "Failed to update dashboard" },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboards/[id] - Delete a dashboard
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.customDashboard.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    // DashboardChart records are deleted via cascade
    await db.customDashboard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dashboard:", error);
    return NextResponse.json(
      { error: "Failed to delete dashboard" },
      { status: 500 }
    );
  }
}
