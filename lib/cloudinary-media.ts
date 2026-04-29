export type CloudinaryImageVariant =
  | "posterCard"
  | "posterDetail"
  | "posterAdminPreview"
  | "posterSidebar"
  | "posterRail"
  | "posterEditor"
  | "posterReviewThumb"
  | "backdropHero"
  | "galleryStill"
  | "avatarSm";

export const cloudinaryImageVariants: Record<
  CloudinaryImageVariant,
  {
    width: number;
    height: number;
    crop: "fill";
    gravity: "auto" | "face";
    sizes: string;
  }
> = {
  posterCard: {
    width: 320,
    height: 480,
    crop: "fill",
    gravity: "auto",
    sizes: "(max-width: 780px) 42vw, 220px",
  },
  posterDetail: {
    width: 640,
    height: 960,
    crop: "fill",
    gravity: "auto",
    sizes: "(max-width: 920px) 78vw, 360px",
  },
  posterAdminPreview: {
    width: 520,
    height: 780,
    crop: "fill",
    gravity: "auto",
    sizes: "(max-width: 920px) 100vw, 280px",
  },
  posterSidebar: {
    width: 184,
    height: 272,
    crop: "fill",
    gravity: "auto",
    sizes: "46px",
  },
  posterRail: {
    width: 640,
    height: 294,
    crop: "fill",
    gravity: "auto",
    sizes: "(max-width: 780px) 48vw, 220px",
  },
  posterEditor: {
    width: 560,
    height: 780,
    crop: "fill",
    gravity: "auto",
    sizes: "(max-width: 780px) 45vw, 220px",
  },
  posterReviewThumb: {
    width: 260,
    height: 204,
    crop: "fill",
    gravity: "auto",
    sizes: "98px",
  },
  backdropHero: {
    width: 1600,
    height: 900,
    crop: "fill",
    gravity: "auto",
    sizes: "100vw",
  },
  galleryStill: {
    width: 900,
    height: 600,
    crop: "fill",
    gravity: "auto",
    sizes: "(max-width: 780px) 100vw, 33vw",
  },
  avatarSm: {
    width: 104,
    height: 104,
    crop: "fill",
    gravity: "face",
    sizes: "52px",
  },
};

export function getCloudinaryImageProps(variant: CloudinaryImageVariant) {
  const config = cloudinaryImageVariants[variant];

  return {
    width: config.width,
    height: config.height,
    crop: config.crop,
    gravity: config.gravity,
    format: "auto",
    quality: "auto",
    sizes: config.sizes,
  } as const;
}

export function getCloudinaryUploadFolder(movieId: string, kind: "poster" | "backdrop" | "gallery" | "trailers") {
  return `movies/${movieId}/${kind}`;
}
