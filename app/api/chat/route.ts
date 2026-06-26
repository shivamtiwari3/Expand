import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { role, content, district } = body;

  if (!role || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const msg = await prisma.chatMessage.create({
    data: { role, content, district: district || null },
  });

  return NextResponse.json(msg, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get("district");

  const where = district ? { district } : {};
  const messages = await prisma.chatMessage.findMany({ where, orderBy: { createdAt: "asc" }, take: 50 });

  return NextResponse.json(messages);
}
