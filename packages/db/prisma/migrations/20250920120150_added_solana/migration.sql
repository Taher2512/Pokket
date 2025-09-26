/*
  Warnings:

  - A unique constraint covering the columns `[public_address_solana]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "encrypted_private_key_solana" TEXT,
ADD COLUMN     "public_address_solana" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_public_address_solana_key" ON "public"."users"("public_address_solana");
