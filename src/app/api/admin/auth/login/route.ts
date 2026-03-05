import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import { createAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!admin) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const isValid = await bcrypt.compare(password, admin.hashedPassword);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  await createAdminSession(admin.id);

  return NextResponse.json({
    admin: { id: admin.id, email: admin.email, name: admin.name },
  });
}
