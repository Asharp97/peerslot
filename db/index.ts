import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL ?? process.env.db_url;

if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL. Add your Neon connection string to .env.local.",
  );
}

export const db = drizzle(databaseUrl);
