import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, isValidEmail, normalizeEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
  };
  const email = normalizeEmail(body.email ?? "");

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Use a valid email address to continue." }, { status: 400 });
  }

  const reset = await createPasswordResetToken(email);
  const responseBody: { message: string; resetHref?: string } = {
    message: "If that account exists, a local reset link is ready.",
  };

  if (reset && process.env.NODE_ENV !== "production") {
    responseBody.resetHref = `/reset-password/${reset.token}`;
  }

  return NextResponse.json(responseBody);
}
