import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { ventureId, district, name, firm, capital, message } = body;

  if (!ventureId || !name || !firm || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const connection = await prisma.ventureConnect.create({
    data: { ventureId, district: district || "", name, firm, capital: capital || "", message },
  });

  return NextResponse.json(connection, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get("district");

  const where = district ? { district } : {};
  const connections = await prisma.ventureConnect.findMany({ where, orderBy: { createdAt: "desc" } });

  return NextResponse.json(connections);
}
