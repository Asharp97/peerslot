import { eq } from "drizzle-orm";

import { db } from "@/db";
import { providerProfiles } from "@/db/schema";

export type ProviderProfile = typeof providerProfiles.$inferSelect;

export async function findProviderProfile(
  userId: string,
): Promise<ProviderProfile | null> {
  const [providerProfile] = await db
    .select()
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);

  return providerProfile ?? null;
}

export async function grantProviderCapability(
  userId: string,
): Promise<ProviderProfile> {
  const [createdProfile] = await db
    .insert(providerProfiles)
    .values({ userId })
    .onConflictDoNothing()
    .returning();

  if (createdProfile) {
    return createdProfile;
  }

  const existingProfile = await findProviderProfile(userId);

  if (!existingProfile) {
    throw new Error("Unable to create or load the provider profile.");
  }

  return existingProfile;
}
