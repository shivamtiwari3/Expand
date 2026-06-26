import { NextRequest, NextResponse } from "next/server";
import { runXpandAI, type InsightsInput } from "@/lib/ai/graph";

// LangGraph + LangChain pipeline (gather across all datasets → K2 synthesis →
// finalize) lives server-side so the K2 key never reaches the browser.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: {
    mode?: string;
    district?: string;
    question?: string;
    insights?: InsightsInput;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (body.mode === "district" && !body.district) {
    return NextResponse.json({ error: "district required" }, { status: 400 });
  }

  try {
    const { text, source } = await runXpandAI({
      mode: body.mode ?? "district",
      district: body.district,
      question: body.question,
      insights: body.insights,
    });
    return NextResponse.json({ text, source });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ai error" },
      { status: 500 }
    );
  }
}
