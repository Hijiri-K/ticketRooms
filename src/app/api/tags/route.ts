import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({
    where: {
      events: { some: { isPublished: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ tags });
}
