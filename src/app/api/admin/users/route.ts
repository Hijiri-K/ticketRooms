import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tickets: true } },
    },
  });

  return NextResponse.json({ users });
}
