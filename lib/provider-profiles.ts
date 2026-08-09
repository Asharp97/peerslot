import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { bookingPages, providerProfiles } from "@/db/schema";
import {
  generateBookingSlug,
  type ProviderOnboardingInput,
} from "@/lib/provider-onboarding";

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

export async function findProviderSetup(userId: string) {
  const [result] = await db
    .select({
      profile: providerProfiles,
      bookingPage: bookingPages,
    })
    .from(providerProfiles)
    .leftJoin(
      bookingPages,
      eq(bookingPages.providerUserId, providerProfiles.userId),
    )
    .where(eq(providerProfiles.userId, userId))
    .limit(1);

  return result ?? null;
}

export async function completeProviderOnboarding(
  userId: string,
  input: ProviderOnboardingInput,
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = generateBookingSlug();

    try {
      await db.batch([
        db
          .insert(providerProfiles)
          .values({ userId, ...input })
          .onConflictDoUpdate({
            target: providerProfiles.userId,
            set: { ...input, updatedAt: new Date() },
          }),
        db
          .insert(bookingPages)
          .values({ providerUserId: userId, slug })
          .onConflictDoNothing({ target: bookingPages.providerUserId }),
        db
          .update(user)
          .set({ name: input.displayName })
          .where(eq(user.id, userId)),
      ]);

      const setup = await findProviderSetup(userId);

      if (setup?.bookingPage) {
        return setup;
      }
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  throw new Error("Unable to generate a unique booking page slug.");
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
