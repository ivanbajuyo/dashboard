import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

const VALID_TYPES = ["bar", "line", "pie", "doughnut", "polarArea", "radar"];

// PUT /api/charts/[id] - Update a chart
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, type, labels, data, datasets, description, isPinned, collection, colorPalette } = body;

    const existing = await db.chart.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }

    if (title !== undefined && (!title || !String(title).trim())) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }

    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Chart type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (labels !== undefined && (!Array.isArray(labels) || labels.length === 0)) {
      return NextResponse.json({ error: "Labels must be a non-empty array" }, { status: 400 });
    }

    if (data !== undefined) {
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ error: "Data must be a non-empty array of numbers" }, { status: 400 });
      }
      if (!data.every((v: unknown) => typeof v === "number" && !isNaN(v))) {
        return NextResponse.json({ error: "All data values must be valid numbers" }, { status: 400 });
      }
    }

    if (labels !== undefined && data !== undefined && labels.length !== data.length) {
      return NextResponse.json(
        { error: `Labels count (${labels.length}) must match data count (${data.length})` },
        { status: 400 }
      );
    }

    if (datasets !== undefined && datasets !== null) {
      if (!Array.isArray(datasets)) {
        return NextResponse.json({ error: "Datasets must be an array" }, { status: 400 });
      }
      for (const ds of datasets) {
        if (!ds.label || !Array.isArray(ds.data)) {
          return NextResponse.json({ error: "Each dataset must have a label and data array" }, { status: 400 });
        }
      }
    }

    const sanitizedLabels = labels
      ? labels.map((l: unknown) => String(l).trim())
      : undefined;

    const chart = await db.chart.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(type !== undefined && { type }),
        ...(sanitizedLabels !== undefined && { labels: JSON.stringify(sanitizedLabels) }),
        ...(data !== undefined && { data: JSON.stringify(data) }),
        ...(datasets !== undefined && { datasets: datasets ? JSON.stringify(datasets) : null }),
        ...(description !== undefined && { description: String(description) }),
        ...(isPinned !== undefined && { isPinned: Boolean(isPinned) }),
        ...(collection !== undefined && { collection: collection || null }),
        ...(colorPalette !== undefined && { colorPalette: String(colorPalette) }),
      },
    });

    return NextResponse.json(chart);
  } catch (error) {
    console.error("Error updating chart:", error);
    return NextResponse.json({ error: "Failed to update chart" }, { status: 500 });
  }
}

// DELETE /api/charts/[id] - Delete a chart
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.chart.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }

    await db.chart.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chart:", error);
    return NextResponse.json({ error: "Failed to delete chart" }, { status: 500 });
  }
}

// POST /api/charts/[id] - Duplicate a chart or generate share token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const existing = await db.chart.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Chart not found" }, { status: 404 });
    }

    if (action === "duplicate") {
      const duplicated = await db.chart.create({
        data: {
          title: `${existing.title} (Copy)`,
          type: existing.type,
          labels: existing.labels,
          data: existing.data,
          datasets: existing.datasets,
          description: existing.description,
          isPinned: false,
          collection: existing.collection,
          colorPalette: existing.colorPalette,
        },
      });
      return NextResponse.json(duplicated, { status: 201 });
    }

    if (action === "share") {
      const token = randomUUID().replace(/-/g, "").slice(0, 12);
      const updated = await db.chart.update({
        where: { id },
        data: { shareToken: token },
      });
      return NextResponse.json({ shareToken: updated.shareToken });
    }

    return NextResponse.json({ error: "Invalid action. Use 'duplicate' or 'share'." }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/charts/[id]:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
