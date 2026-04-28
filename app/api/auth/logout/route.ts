import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, deleteCurrentSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await deleteCurrentSession();

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response, request);

  return response;
}
