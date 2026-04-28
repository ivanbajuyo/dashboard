import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/share?token=xxx - Get a shared chart by token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const chart = await db.chart.findUnique({
      where: { shareToken: token },
    });

    if (!chart) {
      return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: chart.id,
      title: chart.title,
      type: chart.type,
      labels: JSON.parse(chart.labels),
      data: JSON.parse(chart.data),
      datasets: chart.datasets ? JSON.parse(chart.datasets) : null,
      description: chart.description,
      colorPalette: chart.colorPalette,
    });
  } catch (error) {
    console.error("Error fetching shared chart:", error);
    return NextResponse.json({ error: "Failed to fetch chart" }, { status: 500 });
  }
}
