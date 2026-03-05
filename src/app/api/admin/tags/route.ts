import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = await prisma.tag.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, imageUrl, sortOrder } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const tag = await prisma.tag.create({
    data: {
      name,
      imageUrl: imageUrl || null,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json({ tag }, { status: 201 });
}
