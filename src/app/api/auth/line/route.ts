import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyLiffToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { accessToken } = await request.json();

  if (!accessToken) {
    return NextResponse.json({ error: "Access token required" }, { status: 400 });
  }

  const profile = await verifyLiffToken(accessToken);
  if (!profile) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { lineUserId: profile.userId },
    update: {
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    },
    create: {
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    },
  });

  return NextResponse.json({ user });
}
