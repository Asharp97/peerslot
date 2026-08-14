import { NextResponse } from "next/server";

type RateLimitEntry = { count: number; resetsAt: number };

const rateLimits = new Map<string, RateLimitEntry>();

export function enforceRateLimit(
  request: Request,
  scope: string,
  options: { limit: number; windowSeconds: number; subject?: string },
) {
  const now = Date.now();
  const key = `${scope}:${requestIp(request)}:${options.subject ?? ""}`;
  const current = rateLimits.get(key);
  const entry =
    !current || current.resetsAt <= now
      ? { count: 1, resetsAt: now + options.windowSeconds * 1000 }
      : { ...current, count: current.count + 1 };

  rateLimits.set(key, entry);
  pruneRateLimits(now);

  if (entry.count <= options.limit) return null;

  const retryAfter = Math.max(1, Math.ceil((entry.resetsAt - now) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
      },
    },
  );
}

export function requireSameOriginJson(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 },
    );
  }

  const origin = request.headers.get("origin");
  if (!origin) return null;

  const allowedOrigin = new URL(
    process.env.BETTER_AUTH_URL ?? new URL(request.url).origin,
  ).origin;
  if (origin !== allowedOrigin) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  return null;
}

export function logFailedBookingAttempt(
  reason: string,
  context: { slug?: string; status: number },
) {
  console.warn("booking_attempt_failed", {
    reason,
    slug: context.slug,
    status: context.status,
  });
}

function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function pruneRateLimits(now: number) {
  if (rateLimits.size < 2_000) return;
  for (const [key, entry] of rateLimits) {
    if (entry.resetsAt <= now) rateLimits.delete(key);
  }
  while (rateLimits.size > 10_000) {
    const oldestKey = rateLimits.keys().next().value as string | undefined;
    if (!oldestKey) break;
    rateLimits.delete(oldestKey);
  }
}

export function clearRateLimitsForTests() {
  rateLimits.clear();
}
