-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Member', 'Admin');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('Draft', 'Pending', 'Published', 'Hidden');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'Member';

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'Published';

-- CreateIndex
CREATE INDEX "Movie_workflowStatus_sortOrder_idx" ON "Movie"("workflowStatus", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Review_authorId_movieId_key" ON "Review"("authorId", "movieId");

-- CreateIndex
CREATE INDEX "Review_status_publishedAt_idx" ON "Review"("status", "publishedAt");

-- AddConstraint
ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_check" CHECK ("rating" >= 1 AND "rating" <= 10);
