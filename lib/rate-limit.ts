import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RateLimitPolicy = {
  key: string;
  limit: number;
  windowMs: number;
  blockDurationMs?: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
  blockedUntil: number | null;
};

type RateLimitResult =
  | {
      ok: true;
      limit: number;
      remaining: number;
      resetAt: number;
    }
  | {
      ok: false;
      limit: number;
      remaining: 0;
      resetAt: number;
      retryAfterSeconds: number;
    };

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore__: Map<string, RateLimitState> | undefined;
}

const rateLimitStore = global.__rateLimitStore__ ?? new Map<string, RateLimitState>();

if (!global.__rateLimitStore__) {
  global.__rateLimitStore__ = rateLimitStore;
}

function normalizeKeyPart(value: string) {
  return value.trim().toLowerCase().slice(0, 160) || "unknown";
}

export function getClientIp(request: Pick<NextRequest, "headers">) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cloudflareIp = request.headers.get("cf-connecting-ip");

  return normalizeKeyPart(
    forwardedFor?.split(",")[0] ??
      realIp ??
      cloudflareIp ??
      "unknown",
  );
}

function buildStoreKey(request: Pick<NextRequest, "headers">, policyKey: string, keyParts: string[]) {
  return [policyKey, getClientIp(request), ...keyParts.map(normalizeKeyPart)].join(":");
}

function sweepExpiredEntries(now: number) {
  if (rateLimitStore.size < 1_000) {
    return;
  }

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now && (!value.blockedUntil || value.blockedUntil <= now)) {
      rateLimitStore.delete(key);
    }
  }
}

export function consumeRateLimit(
  request: Pick<NextRequest, "headers">,
  policy: RateLimitPolicy,
  ...keyParts: string[]
): RateLimitResult {
  const now = Date.now();
  const storeKey = buildStoreKey(request, policy.key, keyParts);
  const blockDurationMs = policy.blockDurationMs ?? policy.windowMs;

  sweepExpiredEntries(now);

  const current = rateLimitStore.get(storeKey);

  if (current?.blockedUntil && current.blockedUntil > now) {
    return {
      ok: false,
      limit: policy.limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.blockedUntil - now) / 1000)),
    };
  }

  if (!current || current.resetAt <= now) {
    const nextState: RateLimitState = {
      count: 1,
      resetAt: now + policy.windowMs,
      blockedUntil: null,
    };
    rateLimitStore.set(storeKey, nextState);

    return {
      ok: true,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - nextState.count),
      resetAt: nextState.resetAt,
    };
  }

  current.count += 1;

  if (current.count > policy.limit) {
    current.blockedUntil = now + blockDurationMs;
    rateLimitStore.set(storeKey, current);

    return {
      ok: false,
      limit: policy.limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil(blockDurationMs / 1000)),
    };
  }

  rateLimitStore.set(storeKey, current);

  return {
    ok: true,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - current.count),
    resetAt: current.resetAt,
  };
}

export function createRateLimitResponse(message: string, result: Extract<RateLimitResult, { ok: false }>) {
  const response = NextResponse.json({ message }, { status: 429 });
  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", "0");
  response.headers.set("X-RateLimit-Reset", new Date(result.resetAt).toISOString());

  return response;
}

export function setRateLimitHeaders(
  response: NextResponse,
  result: Extract<RateLimitResult, { ok: true }>,
) {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", new Date(result.resetAt).toISOString());
}

export function jsonWithRateLimit<T>(
  body: T,
  init: ResponseInit | undefined,
  result: Extract<RateLimitResult, { ok: true }>,
) {
  const response = NextResponse.json(body, init);
  setRateLimitHeaders(response, result);
  return response;
}

export function resetRateLimitStoreForTests() {
  rateLimitStore.clear();
}
