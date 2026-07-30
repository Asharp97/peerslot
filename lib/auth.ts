import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account" as const,
      }
    : undefined;

const microsoft =
  process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
    ? {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
        prompt: "select_account" as const,
        // Microsoft can return a large base64 profile image. Do not persist it.
        mapProfileToUser: () => ({ image: "" }),
      }
    : undefined;

export const auth = betterAuth({
  appName: "PeerSlot",
  baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
  },
  socialProviders: {
    ...(google ? { google } : {}),
    ...(microsoft ? { microsoft } : {}),
  },
  trustedOrigins: [baseURL],
});
