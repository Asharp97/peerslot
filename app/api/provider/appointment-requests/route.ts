import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { listPendingProviderAppointments } from "@/lib/provider-appointments";

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

  const appointments = await listPendingProviderAppointments(
    currentUser.user.id,
  );

  return NextResponse.json(
    { appointments },
    { headers: { "Cache-Control": "no-store" } },
  );
}
