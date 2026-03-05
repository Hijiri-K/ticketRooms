import { messagingApi } from "@line/bot-sdk";

const { MessagingApiClient } = messagingApi;

async function getStatelessAccessToken(): Promise<string> {
  const res = await fetch("https://api.line.me/oauth2/v3/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.LINE_CHANNEL_ID!,
      client_secret: process.env.LINE_CHANNEL_SECRET!,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get stateless access token: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function sendPushMessage(userId: string, text: string) {
  const accessToken = await getStatelessAccessToken();
  const client = new MessagingApiClient({ channelAccessToken: accessToken });

  await client.pushMessage({
    to: userId,
    messages: [{ type: "text", text }],
  });
}
