import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const VALID_TYPES = ["bar", "line", "pie", "doughnut", "polarArea", "radar"];

// GET /api/charts - Fetch all charts with search, filter, collection, pin sort
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const collection = searchParams.get("collection") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.title = { contains: search };
    }
    if (type) {
      where.type = type;
    }
    if (collection === "__none__") {
      where.collection = null;
    } else if (collection) {
      where.collection = collection;
    }

    const charts = await db.chart.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    // Get all unique collections
    const collections = await db.chart.groupBy({
      by: ["collection"],
      where: { collection: { not: null } },
    });

    return NextResponse.json({
      charts,
      collections: collections.map((c) => c.collection).filter(Boolean),
    });
  } catch (error) {
    console.error("Error fetching charts:", error);
    return NextResponse.json(
      { error: "Failed to fetch charts" },
      { status: 500 }
    );
  }
}

// POST /api/charts - Create a new chart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, labels, data, datasets, description, isPinned, collection, colorPalette } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Chart type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!labels || !Array.isArray(labels) || labels.length === 0) {
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

    if (datasets !== undefined && datasets !== null) {
      if (!Array.isArray(datasets)) {
        return NextResponse.json({ error: "Datasets must be an array" }, { status: 400 });
      }
      for (const ds of datasets) {
        if (!ds.label || !Array.isArray(ds.data)) {
          return NextResponse.json({ error: "Each dataset must have a label and data array" }, { status: 400 });
        }
        if (!ds.data.every((v: unknown) => typeof v === "number" && !isNaN(v))) {
          return NextResponse.json({ error: "All dataset values must be valid numbers" }, { status: 400 });
        }
      }
    }

    if (data !== undefined && labels.length !== data.length) {
      return NextResponse.json(
        { error: `Labels count (${labels.length}) must match data count (${data.length})` },
        { status: 400 }
      );
    }

    const sanitizedLabels = labels.map((l: unknown) => String(l).trim());

    const chart = await db.chart.create({
      data: {
        title: title.trim(),
        type,
        labels: JSON.stringify(sanitizedLabels),
        data: JSON.stringify(data || []),
        datasets: datasets ? JSON.stringify(datasets) : null,
        description: description || "",
        isPinned: isPinned === true,
        collection: collection || null,
        colorPalette: colorPalette || "default",
      },
    });

    return NextResponse.json(chart, { status: 201 });
  } catch (error) {
    console.error("Error creating chart:", error);
    return NextResponse.json({ error: "Failed to create chart" }, { status: 500 });
  }
}
