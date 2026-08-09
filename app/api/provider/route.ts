import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { providerOnboardingSchema } from "@/lib/provider-onboarding";
import {
  completeProviderOnboarding,
  findProviderSetup,
} from "@/lib/provider-profiles";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setup = await findProviderSetup(currentUser.user.id);

  return NextResponse.json({
    status: setup?.profile && setup.bookingPage ? "active" : "setup_required",
    user: {
      id: currentUser.user.id,
      email: currentUser.user.email,
      name: currentUser.user.name,
    },
    profile: setup?.profile ?? null,
    bookingPage: setup?.bookingPage ?? null,
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = providerOnboardingSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!input.success) {
    return NextResponse.json(
      {
        error: "Invalid provider settings",
        issues: input.error.issues,
      },
      { status: 400 },
    );
  }

  const existingSetup = await findProviderSetup(currentUser.user.id);
  const setup = await completeProviderOnboarding(
    currentUser.user.id,
    input.data,
  );

  return NextResponse.json(
    {
      status: "active",
      profile: setup.profile,
      bookingPage: setup.bookingPage,
      capabilities: { canBook: true, canProvide: true },
    },
    { status: existingSetup?.bookingPage ? 200 : 201 },
  );
}
