import { v2 as cloudinary } from "cloudinary";
export {
  cloudinaryImageVariants,
  getCloudinaryImageProps,
  getCloudinaryUploadFolder,
  type CloudinaryImageVariant,
} from "@/lib/cloudinary-media";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export function signCloudinaryParams(paramsToSign: Record<string, string | number | boolean>) {
  if (!apiSecret) {
    throw new Error("Missing CLOUDINARY_API_SECRET.");
  }

  return cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
}

export async function deleteCloudinaryAsset(publicId: string, resourceType: "image" | "video") {
  if (!publicId.trim()) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: resourceType,
  });
}
