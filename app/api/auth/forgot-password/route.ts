import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, isValidEmail, normalizeEmail } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
    };
    const email = normalizeEmail(body.email ?? "");

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Use a valid email address to continue." }, { status: 400 });
    }

    const resetToken = await createPasswordResetToken(email);

    if (resetToken) {
      await sendPasswordResetEmail({
        to: email,
        token: resetToken.token,
        expiresAt: resetToken.expiresAt,
      });
    }

    return NextResponse.json({
      message: "If that account exists, we recorded the reset request.",
    });
  } catch {
    return NextResponse.json({ message: "We couldn't send the reset email. Please try again." }, { status: 500 });
  }
}
