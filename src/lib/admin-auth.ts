import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "./prisma";

const COOKIE_NAME = "admin_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "fallback-secret-do-not-use-in-prod"
);

export async function createAdminSession(adminId: string) {
  const token = await new SignJWT({ adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const adminId = payload.adminId as string;
    if (!adminId) return null;

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });
    return admin;
  } catch {
    return null;
  }
}
