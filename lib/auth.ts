import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const sessionCookieName = "mboko_session";

const sessionDurationDays = 30;
const passwordKeyLength = 64;
const passwordResetDurationMinutes = 30;

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: "Member" | "Admin";
  location: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ");
}

export function normalizeSingleLineText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeTextarea(value: string) {
  return value.trim();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return password.length >= 8;
}

export function makeUsername(displayName: string, email: string) {
  const source = displayName.trim().length > 0 ? displayName : email.split("@")[0] ?? "critic";
  const slug = source
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "critic";
}

export async function makeUniqueUsername(baseUsername: string) {
  let username = baseUsername;
  let suffix = 2;

  while (await prisma.user.findUnique({ where: { username }, select: { id: true } })) {
    username = `${baseUsername}-${suffix}`;
    suffix += 1;
  }

  return username;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, passwordKeyLength).toString("base64url");

  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, passwordHash: string | null) {
  if (!passwordHash) {
    return false;
  }

  const [algorithm, salt, storedHash] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const candidate = Buffer.from(scryptSync(password, salt, passwordKeyLength).toString("base64url"));
  const expected = Buffer.from(storedHash);

  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      userAgent: userAgent?.slice(0, 240),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export function shouldUseSecureCookies(request: Pick<NextRequest, "headers" | "nextUrl">) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedSsl = request.headers.get("x-forwarded-ssl")?.trim().toLowerCase();

  return request.nextUrl.protocol === "https:" || forwardedProto === "https" || forwardedSsl === "on";
}

export function setSessionCookie(
  response: NextResponse,
  request: Pick<NextRequest, "headers" | "nextUrl">,
  token: string,
  expiresAt: Date,
) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(request),
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse, request: Pick<NextRequest, "headers" | "nextUrl">) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(request),
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          role: true,
          location: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return session.user;
}

export async function getCurrentAdmin() {
  const user = await getCurrentUser();

  return user?.role === "Admin" ? user : null;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      tokenHash: hashSessionToken(token),
    },
  });
}

export async function deleteSessionsForUser(userId: string) {
  await prisma.session.deleteMany({
    where: {
      userId,
    },
  });
}

export async function createPasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + passwordResetDurationMinutes * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashPasswordResetToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt, userId: user.id };
}

export async function getPasswordResetTokenRecord(token: string) {
  return prisma.passwordResetToken.findUnique({
    where: {
      tokenHash: hashPasswordResetToken(token),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
}

export function isUsablePasswordResetToken(
  tokenRecord: { expiresAt: Date; usedAt: Date | null } | null,
) {
  return Boolean(tokenRecord && tokenRecord.usedAt === null && tokenRecord.expiresAt > new Date());
}

export async function resetPasswordWithToken(token: string, password: string) {
  if (!isValidPassword(password)) {
    throw new Error("Use a password with at least 8 characters.");
  }

  return prisma.$transaction(async (tx) => {
    const tokenHash = hashPasswordResetToken(token);
    const consumedAt = new Date();
    const tokenRecord = await tx.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new Error("This reset link is invalid or has expired.");
    }

    const consumeResult = await tx.passwordResetToken.updateMany({
      where: {
        id: tokenRecord.id,
        usedAt: null,
        expiresAt: {
          gt: consumedAt,
        },
      },
      data: {
        usedAt: consumedAt,
      },
    });

    if (consumeResult.count !== 1) {
      throw new Error("This reset link is invalid or has expired.");
    }

    await tx.user.update({
      where: {
        id: tokenRecord.userId,
      },
      data: {
        passwordHash: hashPassword(password),
      },
    });

    await tx.passwordResetToken.deleteMany({
      where: {
        userId: tokenRecord.userId,
        id: {
          not: tokenRecord.id,
        },
      },
    });

    await tx.session.deleteMany({
      where: {
        userId: tokenRecord.userId,
      },
    });

    return {
      userId: tokenRecord.userId,
      email: tokenRecord.user.email,
    };
  });
}

export async function changePasswordForUser(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user || !currentPassword || !verifyPassword(currentPassword, user.passwordHash)) {
    throw new Error("Current password is incorrect.");
  }

  if (!isValidPassword(newPassword)) {
    throw new Error("Use a password with at least 8 characters.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash: hashPassword(newPassword),
      },
    });

    await tx.session.deleteMany({
      where: {
        userId: user.id,
      },
    });
  });

  return user;
}
