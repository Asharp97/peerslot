import { NextResponse } from "next/server";
import { z } from "zod";

import { providerAppointmentErrorResponse } from "../../appointments/error-response";

import { getCurrentUser } from "@/lib/current-user";
import { providerAppointmentReviewSchema } from "@/lib/provider-appointment";
import { reviewProviderAppointment } from "@/lib/provider-appointments";

const idSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const id = idSchema.safeParse((await context.params).id);
  const input = providerAppointmentReviewSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!id.success || !input.success) {
    return NextResponse.json(
      {
        error: "Invalid appointment decision",
        issues: id.success ? input.error?.issues : id.error.issues,
      },
      { status: 400 },
    );
  }

  try {
    const appointment = await reviewProviderAppointment(
      currentUser.user.id,
      id.data,
      input.data.decision,
    );
    return NextResponse.json({ appointment });
  } catch (error) {
    return providerAppointmentErrorResponse(error);
  }
}
