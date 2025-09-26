/*
  Warnings:

  - You are about to drop the column `default_chain_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `default_token_symbol` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `encrypted_wallets` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `slippage_tolerance` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `cross_chain_intents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fulfillment_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `price_cache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recipient_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supported_chains` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supported_tokens` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[public_address]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `encrypted_private_key` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `public_address` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."cross_chain_intents" DROP CONSTRAINT "cross_chain_intents_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."cross_chain_intents" DROP CONSTRAINT "cross_chain_intents_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."fulfillment_transactions" DROP CONSTRAINT "fulfillment_transactions_intent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recipient_preferences" DROP CONSTRAINT "recipient_preferences_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "default_chain_id",
DROP COLUMN "default_token_symbol",
DROP COLUMN "encrypted_wallets",
DROP COLUMN "slippage_tolerance",
ADD COLUMN     "encrypted_private_key" TEXT NOT NULL,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "public_address" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."cross_chain_intents";

-- DropTable
DROP TABLE "public"."fulfillment_transactions";

-- DropTable
DROP TABLE "public"."price_cache";

-- DropTable
DROP TABLE "public"."recipient_preferences";

-- DropTable
DROP TABLE "public"."supported_chains";

-- DropTable
DROP TABLE "public"."supported_tokens";

-- DropEnum
DROP TYPE "public"."IntentStatus";

-- DropEnum
DROP TYPE "public"."TransactionType";

-- DropEnum
DROP TYPE "public"."TxStatus";

-- CreateTable
CREATE TABLE "public"."tiplinks" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "token_address" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "tx_hash" TEXT,
    "url" TEXT NOT NULL,
    "claimed_by" TEXT,
    "claimed_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiplinks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tiplinks_url_key" ON "public"."tiplinks"("url");

-- CreateIndex
CREATE UNIQUE INDEX "users_public_address_key" ON "public"."users"("public_address");

-- AddForeignKey
ALTER TABLE "public"."tiplinks" ADD CONSTRAINT "tiplinks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
