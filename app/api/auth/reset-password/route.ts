import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, resetPasswordWithToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    token?: string;
    password?: string;
  };
  const token = body.token ?? "";
  const password = body.password ?? "";

  if (!token) {
    return NextResponse.json({ message: "This reset link is invalid or has expired." }, { status: 400 });
  }

  try {
    await resetPasswordWithToken(token, password);
    const response = NextResponse.json({
      message: "Password updated. Sign in with your new password.",
    });
    clearSessionCookie(response, request);
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to reset your password." },
      { status: 400 },
    );
  }
}
