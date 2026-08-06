import { db } from "@/db";
import { profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { findProviderProfile } from "@/lib/provider-profiles";
import { resolveUserCapabilities } from "@/lib/user-capabilities";

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

  const providerProfile = await findProviderProfile(session.user.id);

  return {
    ...session,
    capabilities: resolveUserCapabilities(providerProfile !== null),
  };
}
