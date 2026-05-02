import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, isValidEmail, normalizeEmail } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { logError, logWarn } from "@/lib/logger";
import {
  consumeRateLimit,
  createRateLimitResponse,
  getClientIp,
  jsonWithRateLimit,
} from "@/lib/rate-limit";

const forgotPasswordRateLimit = {
  key: "auth-forgot-password",
  limit: 5,
  windowMs: 60 * 60 * 1000,
  blockDurationMs: 60 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
    };
    const email = normalizeEmail(body.email ?? "");
    const rateLimit = consumeRateLimit(request, forgotPasswordRateLimit, email);

    if (!rateLimit.ok) {
      logWarn("auth.forgot_password.rate_limited", {
        ip: getClientIp(request),
      });
      return createRateLimitResponse("Too many reset requests. Please wait before trying again.", rateLimit);
    }

    if (!isValidEmail(email)) {
      return jsonWithRateLimit({ message: "Use a valid email address to continue." }, { status: 400 }, rateLimit);
    }

    const resetToken = await createPasswordResetToken(email);

    if (resetToken) {
      await sendPasswordResetEmail({
        to: email,
        token: resetToken.token,
        expiresAt: resetToken.expiresAt,
      });
    }

    return jsonWithRateLimit(
      {
        message: "If that account exists, we recorded the reset request.",
      },
      undefined,
      rateLimit,
    );
  } catch (error) {
    logError("auth.forgot_password.failed", { error });
    return NextResponse.json({ message: "We couldn't send the reset email. Please try again." }, { status: 500 });
  }
}
