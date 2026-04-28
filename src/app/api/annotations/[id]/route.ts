import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/annotations/[id] - Update an annotation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text, color } = body;

    const existing = await db.annotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    if (text !== undefined && (!text || !String(text).trim())) {
      return NextResponse.json(
        { error: "Annotation text cannot be empty" },
        { status: 400 }
      );
    }

    const annotation = await db.annotation.update({
      where: { id },
      data: {
        ...(text !== undefined && { text: String(text).trim() }),
        ...(color !== undefined && { color: String(color) }),
      },
    });

    return NextResponse.json(annotation);
  } catch (error) {
    console.error("Error updating annotation:", error);
    return NextResponse.json(
      { error: "Failed to update annotation" },
      { status: 500 }
    );
  }
}

// DELETE /api/annotations/[id] - Delete an annotation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.annotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    await db.annotation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting annotation:", error);
    return NextResponse.json(
      { error: "Failed to delete annotation" },
      { status: 500 }
    );
  }
}
