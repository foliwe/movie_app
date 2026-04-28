import { NextRequest, NextResponse } from "next/server";
import { changePasswordForUser, createSession, getCurrentUser, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to change your password." }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ message: "Use the same new password in both fields." }, { status: 400 });
  }

  try {
    await changePasswordForUser(user.id, currentPassword, newPassword);
    const session = await createSession(user.id, request.headers.get("user-agent"));
    const response = NextResponse.json({ message: "Password updated." });
    setSessionCookie(response, request, session.token, session.expiresAt);
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "We could not update your password." },
      { status: 400 },
    );
  }
}
