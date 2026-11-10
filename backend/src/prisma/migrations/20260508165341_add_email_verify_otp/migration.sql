-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'EMAIL_VERIFY';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false;
