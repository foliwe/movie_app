import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin, getCurrentUser } from "@/lib/auth";
import { signCloudinaryParams } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in before uploading media." }, { status: 401 });
  }

  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Admin access is required." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      paramsToSign?: Record<string, string | number | boolean>;
    };

    if (!body.paramsToSign || typeof body.paramsToSign !== "object") {
      return NextResponse.json({ message: "Missing Cloudinary parameters to sign." }, { status: 400 });
    }

    const signature = signCloudinaryParams(body.paramsToSign);

    return NextResponse.json({ signature });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to sign Cloudinary request." },
      { status: 500 },
    );
  }
}
