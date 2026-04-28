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
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    displayName?: string;
    email?: string;
    password?: string;
  };
  const displayName = normalizeDisplayName(body.displayName ?? "");
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";

  if (displayName.length < 2) {
    return NextResponse.json({ message: "Add a display name to create your account." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Use a valid email address to continue." }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json({ message: "Use a password with at least 8 characters." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json({ message: "An account already exists for that email." }, { status: 409 });
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
  setSessionCookie(response, session.token, session.expiresAt);

  return response;
}
