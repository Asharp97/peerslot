import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../db";
import { user } from "../db/auth-schema";
import { profiles, userRole } from "../db/schema";

async function main() {
  const [email, requestedRole] = process.argv.slice(2);
  const roles = userRole.enumValues;

  if (!email || !roles.includes(requestedRole as (typeof roles)[number])) {
    console.error("Usage: pnpm user:set-role <email> <teacher|student>");
    process.exit(1);
  }

  const role = requestedRole as (typeof roles)[number];

  const [accountUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!accountUser) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  await db
    .insert(profiles)
    .values({ userId: accountUser.id, role })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { role },
    });

  console.log(`Updated ${email} to ${role}.`);
}

void main();
