import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const VALID_TYPES = ["bar", "line", "pie", "doughnut", "polarArea", "radar"];

// POST /api/ai/generate - Generate chart data from text description
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, collection } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      model: "glm-4-flash",
      messages: [
        {
          role: "assistant",
          content: `You are a data visualization expert. Given a text description, generate a chart configuration as valid JSON.

Your response must be ONLY a valid JSON object with exactly these fields:
- "title": A concise, descriptive chart title (string)
- "type": One of: bar, line, pie, doughnut, polarArea, radar (string)
- "labels": Array of string labels for the chart axes/segments
- "data": Array of numeric values (must be same length as labels)
- "description": A brief description of the chart (string)

Rules:
- Choose the most appropriate chart type for the data being described
- Generate realistic, meaningful data values
- Use between 4-8 data points
- Make labels concise and clear
- Return ONLY the JSON object, no markdown formatting, no code blocks, no explanation`,
        },
        {
          role: "user",
          content: `Generate chart data for: ${prompt.trim()}${collection ? `\nCollection: ${collection}` : ""}`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const rawContent = response.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      return NextResponse.json(
        { error: "AI failed to generate a response" },
        { status: 500 }
      );
    }

    // Strip markdown code block markers if present
    const cleanedContent = rawContent
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    let chartConfig: {
      title: string;
      type: string;
      labels: string[];
      data: number[];
      description: string;
    };

    try {
      chartConfig = JSON.parse(cleanedContent);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 500 }
      );
    }

    // Validate the generated config
    if (!chartConfig.title || typeof chartConfig.title !== "string") {
      return NextResponse.json(
        { error: "Generated chart missing a valid title" },
        { status: 500 }
      );
    }

    if (!VALID_TYPES.includes(chartConfig.type)) {
      return NextResponse.json(
        { error: `Invalid chart type generated: ${chartConfig.type}` },
        { status: 500 }
      );
    }

    if (
      !Array.isArray(chartConfig.labels) ||
      chartConfig.labels.length === 0
    ) {
      return NextResponse.json(
        { error: "Generated chart missing valid labels" },
        { status: 500 }
      );
    }

    if (!Array.isArray(chartConfig.data) || chartConfig.data.length === 0) {
      return NextResponse.json(
        { error: "Generated chart missing valid data" },
        { status: 500 }
      );
    }

    if (chartConfig.labels.length !== chartConfig.data.length) {
      return NextResponse.json(
        { error: "Labels and data length mismatch in generated chart" },
        { status: 500 }
      );
    }

    if (!chartConfig.data.every((v: number) => typeof v === "number" && !isNaN(v))) {
      return NextResponse.json(
        { error: "All data values must be valid numbers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      title: chartConfig.title,
      type: chartConfig.type,
      labels: chartConfig.labels,
      data: chartConfig.data,
      description: chartConfig.description || "",
    });
  } catch (error) {
    console.error("Error generating chart with AI:", error);
    return NextResponse.json(
      { error: "Failed to generate chart" },
      { status: 500 }
    );
  }
}
