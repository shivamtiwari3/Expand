import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { role, emirate, area, sectors, budget, result } = body;

  if (!role || !sectors || !budget) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const insight = await prisma.insightRequest.create({
    data: {
      role,
      emirate: emirate || null,
      area: area || null,
      sectors: Array.isArray(sectors) ? sectors.join(",") : sectors,
      budget,
      result: result || null,
    },
  });

  return NextResponse.json(insight, { status: 201 });
}

export async function GET() {
  const insights = await prisma.insightRequest.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  return NextResponse.json(insights);
}
