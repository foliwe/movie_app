-- CreateEnum
CREATE TYPE "TrailerSourceType" AS ENUM ('External', 'Cloudinary');

-- AlterTable
ALTER TABLE "GalleryImage" ADD COLUMN     "publicId" TEXT;

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "backdropPublicId" TEXT,
ADD COLUMN     "posterPublicId" TEXT,
ADD COLUMN     "trailerPublicId" TEXT,
ADD COLUMN     "trailerSourceType" "TrailerSourceType" NOT NULL DEFAULT 'External';
