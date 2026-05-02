import { NextRequest, NextResponse } from "next/server";
import {
  isValidMovieRequestEmail,
  normalizeMovieRequestEmail,
  type MovieRequestInput,
  validateMovieRequestInput,
} from "@/lib/movie-request";
import {
  sendMovieRequestAcknowledgementEmail,
  sendMovieRequestAdminNotificationEmail,
} from "@/lib/email";

const submissionErrorMessage = "We couldn't send your request right now. Please try again later.";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MovieRequestInput;
    const validation = validateMovieRequestInput(body);

    if (!validation.ok) {
      return NextResponse.json({ message: validation.message }, { status: 400 });
    }

    const adminEmail = normalizeMovieRequestEmail(process.env.MOVIE_REQUEST_ADMIN_EMAIL ?? "");

    if (!adminEmail || !isValidMovieRequestEmail(adminEmail)) {
      return NextResponse.json({ message: submissionErrorMessage }, { status: 500 });
    }

    const submittedAt = new Date();

    await sendMovieRequestAdminNotificationEmail({
      to: adminEmail,
      request: validation.data,
      submittedAt,
    });

    await sendMovieRequestAcknowledgementEmail({
      to: validation.data.contactEmail,
      request: validation.data,
      submittedAt,
    });

    return NextResponse.json({
      message: "We received your movie request and sent a confirmation email.",
    });
  } catch {
    return NextResponse.json({ message: submissionErrorMessage }, { status: 500 });
  }
}
