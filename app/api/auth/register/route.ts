import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  hashPassword,
  isValidEmail,
  isValidPassword,
  makeUniqueUsername,
  makeUsername,
  normalizeDisplayName,
  normalizeEmail,
  setSessionCookie,
} from "@/lib/auth";
import { logWarn } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitResponse,
  getClientIp,
  jsonWithRateLimit,
} from "@/lib/rate-limit";

const registerRateLimit = {
  key: "auth-register",
  limit: 5,
  windowMs: 60 * 60 * 1000,
  blockDurationMs: 60 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    displayName?: string;
    email?: string;
    password?: string;
  };
  const displayName = normalizeDisplayName(body.displayName ?? "");
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const rateLimit = consumeRateLimit(request, registerRateLimit, email);

  if (!rateLimit.ok) {
    logWarn("auth.register.rate_limited", {
      ip: getClientIp(request),
    });
    return createRateLimitResponse("Too many registration attempts. Please wait before trying again.", rateLimit);
  }

  if (displayName.length < 2) {
    return jsonWithRateLimit(
      { message: "Add a display name to create your account." },
      { status: 400 },
      rateLimit,
    );
  }

  if (!isValidEmail(email)) {
    return jsonWithRateLimit({ message: "Use a valid email address to continue." }, { status: 400 }, rateLimit);
  }

  if (!isValidPassword(password)) {
    return jsonWithRateLimit(
      { message: "Use a password with at least 8 characters." },
      { status: 400 },
      rateLimit,
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return jsonWithRateLimit(
      { message: "An account already exists for that email." },
      { status: 409 },
      rateLimit,
    );
  }

  const username = await makeUniqueUsername(makeUsername(displayName, email));
  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      email,
      location: "Community",
      bio: "New Mboko Reels member.",
      favoriteLanguages: [],
      watchedCount: 0,
      reviewCount: 0,
      averageRating: 0,
      passwordHash: hashPassword(password),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
    },
  });

  const session = await createSession(user.id, request.headers.get("user-agent"));
  const response = NextResponse.json({ user }, { status: 201 });
  setSessionCookie(response, request, session.token, session.expiresAt);
  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  response.headers.set("X-RateLimit-Reset", new Date(rateLimit.resetAt).toISOString());

  return response;
}
