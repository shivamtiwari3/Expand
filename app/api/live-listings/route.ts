import { NextResponse } from "next/server";

const BASE_URL = "https://uae-data-api.evoost-ai.workers.dev/v1";

export async function GET(request: Request) {
  const apiKey = process.env.UAE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "UAE_DATA_API_KEY not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || "listings";
  const emirate = searchParams.get("emirate") || "Abu Dhabi";
  const transactionType = searchParams.get("transaction_type") || "sale";
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "100";

  try {
    let url: string;
    if (endpoint === "areas") {
      url = `${BASE_URL}/areas?emirate=${encodeURIComponent(emirate)}`;
    } else {
      url = `${BASE_URL}/listings/search?emirate=${encodeURIComponent(emirate)}&transaction_type=${encodeURIComponent(transactionType)}&page=${page}&limit=${limit}`;
    }

    const res = await fetch(url, {
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      ...data,
      source: "eVoost UAE Data API",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to fetch: ${err.message}` },
      { status: 500 }
    );
  }
}
