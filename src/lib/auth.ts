import prisma from "./prisma";

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

const MOCK_USER_ID = "mock-user-001";

export async function verifyLiffToken(accessToken: string): Promise<LineProfile | null> {
  // Mock mode: skip LINE API verification
  if (process.env.NEXT_PUBLIC_MOCK_LIFF === "true") {
    return {
      userId: MOCK_USER_ID,
      displayName: "テストユーザー",
    };
  }

  const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      access_token: accessToken,
      client_id: process.env.LINE_CHANNEL_ID!,
    }),
  });

  if (!verifyRes.ok) {
    const errBody = await verifyRes.text();
    console.error("LINE verify failed:", verifyRes.status, errBody, "channel_id:", process.env.LINE_CHANNEL_ID);
    return null;
  }

  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    const errBody = await profileRes.text();
    console.error("LINE profile failed:", profileRes.status, errBody);
    return null;
  }

  return profileRes.json() as Promise<LineProfile>;
}

export async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const accessToken = authHeader.slice(7);
  const profile = await verifyLiffToken(accessToken);
  if (!profile) return null;

  const user = await prisma.user.findUnique({
    where: { lineUserId: profile.userId },
  });

  return user;
}
