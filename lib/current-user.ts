import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getCurrentUser(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return null;
  }

  await db
    .insert(profiles)
    .values({ userId: session.user.id })
    .onConflictDoNothing();

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  return {
    ...session,
    role: profile?.role ?? "student",
  };
}
