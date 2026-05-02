import { NextRequest, NextResponse } from "next/server";
import { getMovieRequestAdminEmail } from "@/lib/env";
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
import { logError, logWarn } from "@/lib/logger";
import {
  consumeRateLimit,
  createRateLimitResponse,
  getClientIp,
  jsonWithRateLimit,
} from "@/lib/rate-limit";

const submissionErrorMessage = "We couldn't send your request right now. Please try again later.";
const movieRequestRateLimit = {
  key: "contact-movie-request",
  limit: 5,
  windowMs: 60 * 60 * 1000,
  blockDurationMs: 60 * 60 * 1000,
};

export async function POST(request: NextRequest) {
  try {
    const rateLimit = consumeRateLimit(request, movieRequestRateLimit);

    if (!rateLimit.ok) {
      logWarn("contact.movie_request.rate_limited", {
        ip: getClientIp(request),
      });
      return createRateLimitResponse("Too many movie requests. Please wait before sending another one.", rateLimit);
    }

    const body = (await request.json()) as MovieRequestInput;
    const validation = validateMovieRequestInput(body);

    if (!validation.ok) {
      return jsonWithRateLimit({ message: validation.message }, { status: 400 }, rateLimit);
    }

    const adminEmail = normalizeMovieRequestEmail(getMovieRequestAdminEmail());

    if (!adminEmail || !isValidMovieRequestEmail(adminEmail)) {
      return jsonWithRateLimit({ message: submissionErrorMessage }, { status: 500 }, rateLimit);
    }

    const submittedAt = new Date();

    await sendMovieRequestAcknowledgementEmail({
      to: validation.data.contactEmail,
      request: validation.data,
      submittedAt,
    });

    await sendMovieRequestAdminNotificationEmail({
      to: adminEmail,
      request: validation.data,
      submittedAt,
    });

    return jsonWithRateLimit(
      {
        message: "We received your movie request and sent a confirmation email.",
      },
      undefined,
      rateLimit,
    );
  } catch (error) {
    logError("contact.movie_request.failed", { error });
    return NextResponse.json({ message: submissionErrorMessage }, { status: 500 });
  }
}
