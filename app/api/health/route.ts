import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRawUnsafe("SELECT 1");

    return NextResponse.json(
      {
        status: "ok",
        database: "ok",
        uptimeSeconds: Math.round(process.uptime()),
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    logError("healthcheck.failed", { error });

    return NextResponse.json(
      {
        status: "degraded",
        database: "unavailable",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
