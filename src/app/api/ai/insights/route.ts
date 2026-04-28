import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// POST /api/ai/insights - Generate AI-powered insights from chart data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, labels, data, description } = body;

    if (!title || !type || !labels || !data) {
      return NextResponse.json(
        { error: "title, type, labels, and data are required" },
        { status: 400 }
      );
    }

    const chartContext = `Chart: "${title}" (Type: ${type})
Labels: ${JSON.stringify(labels)}
Data: ${JSON.stringify(data)}
${description ? `Description: ${description}` : ""}`;

    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      model: "glm-4-flash",
      messages: [
        {
          role: "assistant",
          content: `You are an expert data analyst. Analyze the provided chart data and deliver concise, actionable insights in **structured markdown format** (max 300 words).

Your response MUST include these sections:
1. **📊 Key Findings** — 2-3 major takeaways from the data
2. **📈 Trends** — Notable patterns, growth/decline, or cyclical behavior
3. **⚠️ Outliers** — Any data points that stand out significantly from the rest
4. **💡 Recommendations** — 2-3 actionable suggestions based on the analysis

Keep it concise, specific to the data provided, and focused on business value. Avoid generic statements.`,
        },
        {
          role: "user",
          content: `Analyze this chart data:\n\n${chartContext}`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const insights = response.choices?.[0]?.message?.content?.trim() || "Unable to generate insights at this time.";

    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
