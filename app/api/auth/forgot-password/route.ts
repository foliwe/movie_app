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

  await createPasswordResetToken(email);

  return NextResponse.json({
    message: "If that account exists, we recorded the reset request.",
  });
}
