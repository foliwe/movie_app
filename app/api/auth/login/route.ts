import { NextRequest, NextResponse } from "next/server";
import { createSession, isValidEmail, normalizeEmail, setSessionCookie, verifyPassword } from "@/lib/auth";
import { logWarn } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  consumeRateLimit,
  createRateLimitResponse,
  getClientIp,
  jsonWithRateLimit,
} from "@/lib/rate-limit";

const loginRateLimit = {
  key: "auth-login",
  limit: 10,
  windowMs: 10 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const rateLimit = consumeRateLimit(request, loginRateLimit, email);

  if (!rateLimit.ok) {
    logWarn("auth.login.rate_limited", {
      ip: getClientIp(request),
    });
    return createRateLimitResponse("Too many sign-in attempts. Please wait a few minutes and try again.", rateLimit);
  }

  if (!isValidEmail(email) || password.length === 0) {
    return jsonWithRateLimit(
      { message: "Use a valid email and password to continue." },
      { status: 400 },
      rateLimit,
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return jsonWithRateLimit({ message: "Email or password is incorrect." }, { status: 401 }, rateLimit);
  }

  const session = await createSession(user.id, request.headers.get("user-agent"));
  const response = NextResponse.json({
    user: {
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    },
  });
  setSessionCookie(response, request, session.token, session.expiresAt);
  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  response.headers.set("X-RateLimit-Reset", new Date(rateLimit.resetAt).toISOString());

  return response;
}
