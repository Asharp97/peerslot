import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../db";
import { user } from "../db/auth-schema";
import { grantProviderCapability } from "../lib/provider-profiles";

async function main() {
  const [rawEmail] = process.argv.slice(2);

  if (!rawEmail) {
    console.error("Usage: pnpm user:grant-provider <email>");
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();

  const [accountUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!accountUser) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  await grantProviderCapability(accountUser.id);

  console.log(`Granted provider capability to ${email}.`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
