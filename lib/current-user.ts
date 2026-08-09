import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { findProviderProfile } from "@/lib/provider-profiles";
import { resolveUserCapabilities } from "@/lib/user-capabilities";

export async function getCurrentUser(request: Request) {
  const token = getBearerToken(request.headers.get("authorization"));

  if (!token) {
    return null;
  }

  const { payload } = await auth.api.verifyJWT({ body: { token } });

  if (!payload?.sub) {
    return null;
  }

  const [currentUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, payload.sub))
    .limit(1);

  if (!currentUser) {
    return null;
  }

  await db
    .insert(profiles)
    .values({ userId: currentUser.id })
    .onConflictDoNothing();

  const providerProfile = await findProviderProfile(currentUser.id);

  return {
    user: currentUser,
    provider: providerProfile,
    authentication: "jwt" as const,
    capabilities: resolveUserCapabilities(providerProfile !== null),
  };
}

function getBearerToken(authorization: string | null) {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.trim().split(/\s+/, 2);

  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}
