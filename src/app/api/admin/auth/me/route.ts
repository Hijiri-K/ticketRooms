import { NextResponse } from "next/server";
import { getAdminFromSession } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    admin: { id: admin.id, email: admin.email, name: admin.name },
  });
}
