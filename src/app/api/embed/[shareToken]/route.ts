import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/embed/[shareToken] - Get chart data for embedding
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    if (!shareToken) {
      return NextResponse.json(
        { error: "Share token is required" },
        { status: 400 }
      );
    }

    const chart = await db.chart.findUnique({
      where: { shareToken },
    });

    if (!chart) {
      return NextResponse.json(
        { error: "Chart not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      title: chart.title,
      type: chart.type,
      labels: chart.labels,
      data: chart.data,
      datasets: chart.datasets,
      description: chart.description,
      colorPalette: chart.colorPalette,
    });
  } catch (error) {
    console.error("Error fetching shared chart:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart" },
      { status: 500 }
    );
  }
}
