import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, resetPasswordWithToken } from "@/lib/auth";
import { logWarn } from "@/lib/logger";
import {
  consumeRateLimit,
  createRateLimitResponse,
  getClientIp,
  jsonWithRateLimit,
} from "@/lib/rate-limit";

const resetPasswordRateLimit = {
  key: "auth-reset-password",
  limit: 5,
  windowMs: 30 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    token?: string;
    password?: string;
  };
  const token = body.token ?? "";
  const password = body.password ?? "";
  const rateLimit = consumeRateLimit(request, resetPasswordRateLimit);

  if (!rateLimit.ok) {
    logWarn("auth.reset_password.rate_limited", {
      ip: getClientIp(request),
    });
    return createRateLimitResponse("Too many password reset attempts. Please wait and try again.", rateLimit);
  }

  if (!token) {
    return jsonWithRateLimit(
      { message: "This reset link is invalid or has expired." },
      { status: 400 },
      rateLimit,
    );
  }

  try {
    await resetPasswordWithToken(token, password);
    const response = NextResponse.json({
      message: "Password updated. Sign in with your new password.",
    });
    clearSessionCookie(response, request);
    response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", new Date(rateLimit.resetAt).toISOString());
    return response;
  } catch (error) {
    return jsonWithRateLimit(
      { message: error instanceof Error ? error.message : "Failed to reset your password." },
      { status: 400 },
      rateLimit,
    );
  }
}
