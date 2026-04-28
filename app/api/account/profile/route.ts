import { NextRequest, NextResponse } from "next/server";
import { getAdminCatalogueLanguages } from "@/lib/catalog-data";
import { getCurrentUser, normalizeDisplayName, normalizeSingleLineText, normalizeTextarea } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to update your account." }, { status: 401 });
  }

  const body = (await request.json()) as {
    displayName?: string;
    location?: string;
    bio?: string;
    favoriteLanguages?: string[];
  };

  const displayName = normalizeDisplayName(body.displayName ?? "");
  const location = normalizeSingleLineText(body.location ?? "");
  const bio = normalizeTextarea(body.bio ?? "");
  const favoriteLanguages = Array.isArray(body.favoriteLanguages)
    ? [...new Set(body.favoriteLanguages.map((entry) => normalizeSingleLineText(String(entry ?? ""))).filter(Boolean))]
    : [];

  if (displayName.length < 2) {
    return NextResponse.json({ message: "Add a display name to update your account." }, { status: 400 });
  }

  if (location.length < 2) {
    return NextResponse.json({ message: "Add a location to update your account." }, { status: 400 });
  }

  if (bio.length < 10) {
    return NextResponse.json({ message: "Add a short bio so your profile is complete." }, { status: 400 });
  }

  const validLanguages = new Set((await getAdminCatalogueLanguages()).filter((language) => language !== "All"));

  if (favoriteLanguages.some((language) => !validLanguages.has(language))) {
    return NextResponse.json({ message: "Choose favorite languages from the available catalogue list." }, { status: 400 });
  }

  const profile = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      displayName,
      location,
      bio,
      favoriteLanguages,
    },
    select: {
      username: true,
      displayName: true,
      email: true,
      role: true,
      location: true,
      bio: true,
      favoriteLanguages: true,
      watchedCount: true,
      reviewCount: true,
      averageRating: true,
    },
  });

  return NextResponse.json({
    message: "Account profile updated.",
    profile: {
      username: profile.username,
      displayName: profile.displayName,
      email: profile.email,
      role: profile.role,
      location: profile.location,
      bio: profile.bio,
      favoriteLanguages: profile.favoriteLanguages,
      watched: profile.watchedCount,
      reviews: profile.reviewCount,
      averageRating: profile.averageRating,
    },
  });
}
