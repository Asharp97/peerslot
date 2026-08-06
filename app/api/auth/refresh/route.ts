import { NextResponse } from "next/server";

import { auth, jwtExpiresInSeconds } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await auth.api.getToken({ headers: request.headers });

  return NextResponse.json(
    {
      token,
      tokenType: "Bearer",
      expiresIn: jwtExpiresInSeconds,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    },
  );
}
