import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { birthday, gender, prefecture } = await request.json();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      birthday: birthday ? new Date(birthday) : null,
      gender,
      prefecture,
      isRegistered: true,
    },
  });

  return NextResponse.json({ user: updated });
}
