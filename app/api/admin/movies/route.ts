import { NextResponse } from "next/server";
import { createAdminDraft } from "@/lib/admin-movies";

export async function POST() {
  try {
    const movie = await createAdminDraft();
    return NextResponse.json(movie, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create draft." },
      { status: 500 },
    );
  }
}
