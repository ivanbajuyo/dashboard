import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/annotations?chartId=xxx - Get annotations for a chart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chartId = searchParams.get("chartId");

    if (!chartId) {
      return NextResponse.json(
        { error: "chartId query parameter is required" },
        { status: 400 }
      );
    }

    const annotations = await db.annotation.findMany({
      where: { chartId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(annotations);
  } catch (error) {
    console.error("Error fetching annotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch annotations" },
      { status: 500 }
    );
  }
}

// POST /api/annotations - Create a new annotation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chartId, label, dataIndex, text, color } = body;

    if (!chartId) {
      return NextResponse.json(
        { error: "chartId is required" },
        { status: 400 }
      );
    }

    if (dataIndex === undefined || dataIndex === null) {
      return NextResponse.json(
        { error: "dataIndex is required" },
        { status: 400 }
      );
    }

    if (typeof dataIndex !== "number" || dataIndex < 0) {
      return NextResponse.json(
        { error: "dataIndex must be a non-negative number" },
        { status: 400 }
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    // Verify the chart exists
    const chart = await db.chart.findUnique({ where: { id: chartId } });
    if (!chart) {
      return NextResponse.json(
        { error: "Chart not found" },
        { status: 404 }
      );
    }

    const annotation = await db.annotation.create({
      data: {
        chartId,
        label: label?.trim() || null,
        dataIndex,
        text: text.trim(),
        color: color || "#ef4444",
      },
    });

    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error("Error creating annotation:", error);
    return NextResponse.json(
      { error: "Failed to create annotation" },
      { status: 500 }
    );
  }
}
