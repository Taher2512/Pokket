-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "self_user_identifier" TEXT,
ADD COLUMN     "verification_tx_hash" TEXT,
ADD COLUMN     "verified_age" INTEGER,
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_date_of_birth" TEXT,
ADD COLUMN     "verified_document_type" TEXT,
ADD COLUMN     "verified_name" TEXT,
ADD COLUMN     "verified_nationality" TEXT;
