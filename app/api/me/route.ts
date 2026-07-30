import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: currentUser.user,
    role: currentUser.role,
    session: {
      expiresAt: currentUser.session.expiresAt,
    },
  });
}
