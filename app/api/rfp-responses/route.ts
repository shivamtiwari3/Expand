import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { rfpId, district, name, org, message } = body;

  if (!rfpId || !name || !org || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const response = await prisma.rfpResponse.create({
    data: { rfpId, district: district || "", name, org, message },
  });

  return NextResponse.json(response, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get("district");

  const where = district ? { district } : {};
  const responses = await prisma.rfpResponse.findMany({ where, orderBy: { createdAt: "desc" } });

  return NextResponse.json(responses);
}
