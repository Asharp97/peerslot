import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

const url = process.env.DATABASE_URL ?? process.env.db_url;

if (!url) {
  throw new Error(
    "Missing DATABASE_URL. Add your Neon connection string to .env.local.",
  );
}

export default defineConfig({
  schema: ["./db/auth-schema.ts", "./db/schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
