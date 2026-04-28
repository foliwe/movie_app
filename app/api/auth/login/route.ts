import { NextRequest, NextResponse } from "next/server";
import { createSession, isValidEmail, normalizeEmail, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";

  if (!isValidEmail(email) || password.length === 0) {
    return NextResponse.json({ message: "Use a valid email and password to continue." }, { status: 400 });
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
    return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
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
  setSessionCookie(response, session.token, session.expiresAt);

  return response;
}
