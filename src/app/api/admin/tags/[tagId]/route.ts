import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tagId } = await params;
  const body = await request.json();
  const { name, imageUrl, sortOrder } = body;

  const tag = await prisma.tag.update({
    where: { id: tagId },
    data: {
      ...(name !== undefined && { name }),
      ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return NextResponse.json({ tag });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tagId } = await params;

  await prisma.tag.delete({ where: { id: tagId } });

  return NextResponse.json({ success: true });
}
