import { NextResponse } from "next/server";

import { providerStudentCreateSchema } from "@/lib/provider-appointment";
import {
  createProviderStudent,
  listProviderStudents,
} from "@/lib/provider-appointments";
import { getCurrentUser } from "@/lib/current-user";

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

  return NextResponse.json({
    students: await listProviderStudents(currentUser.user.id),
  });
}

export async function POST(request: Request) {
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

  const input = providerStudentCreateSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!input.success) {
    return NextResponse.json(
      { error: "Invalid student", issues: input.error.issues },
      { status: 400 },
    );
  }

  const student = await createProviderStudent(currentUser.user.id, input.data);
  return NextResponse.json({ student }, { status: 201 });
}
