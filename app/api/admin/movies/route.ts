import { NextResponse } from "next/server";
import { createAdminDraft } from "@/lib/admin-movies";
import { getCurrentAdmin, getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in before using the admin movie desk." }, { status: 401 });
  }

  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Admin access is required." }, { status: 403 });
  }

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
