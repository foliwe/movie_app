import { NextRequest, NextResponse } from "next/server";
import { hashPasswordResetToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const body = (await request.json()) as {
    token?: string;
  };
  const token = body.token ?? "";

  if (!token) {
    return NextResponse.json({ message: "Token is required." }, { status: 400 });
  }

  await prisma.passwordResetToken.update({
    where: {
      tokenHash: hashPasswordResetToken(token),
    },
    data: {
      expiresAt: new Date(Date.now() - 60_000),
    },
  });

  return NextResponse.json({ ok: true });
}
