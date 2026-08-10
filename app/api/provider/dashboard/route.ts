import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { loadProviderWorkspace } from "@/lib/provider-workspace";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!currentUser.capabilities.canProvide) {
    return NextResponse.json(
      { error: "Provider setup required" },
      { status: 403 },
    );
  }

  const workspace = await loadProviderWorkspace(currentUser.user.id);

  if (!workspace) {
    return NextResponse.json(
      { error: "Provider setup required" },
      { status: 404 },
    );
  }

  return NextResponse.json(workspace, {
    headers: { "Cache-Control": "no-store" },
  });
}
