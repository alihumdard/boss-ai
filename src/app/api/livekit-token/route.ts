import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

/**
 * Issues a short-lived LiveKit access token for a fresh room + random
 * identity. The API secret never leaves the server.
 */
export async function POST() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!url || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit is not configured on the server." },
      { status: 500 },
    );
  }

  const identity = `boss-${Math.random().toString(36).slice(2, 10)}`;
  const room = `boss-${Math.random().toString(36).slice(2, 10)}`;

  const token = new AccessToken(apiKey, apiSecret, { identity });
  token.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({
    token: await token.toJwt(),
    url,
    room,
    identity,
  });
}
