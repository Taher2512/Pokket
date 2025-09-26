-- CreateEnum
CREATE TYPE "public"."IntentStatus" AS ENUM ('PENDING', 'PROCESSING', 'FULFILLED', 'EXPIRED', 'RECLAIMED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."TxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REVERTED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('DEPOSIT', 'BRIDGE', 'SWAP', 'TIPLINK', 'RECLAIM');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "google_id" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "encrypted_wallets" JSONB NOT NULL,
    "default_chain_id" INTEGER,
    "default_token_symbol" TEXT,
    "slippage_tolerance" DECIMAL(5,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cross_chain_intents" (
    "id" TEXT NOT NULL,
    "intent_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_address" TEXT NOT NULL,
    "receiver_id" TEXT,
    "receiver_email" TEXT,
    "receiver_address" TEXT,
    "source_chain_id" INTEGER NOT NULL,
    "source_token" TEXT NOT NULL,
    "source_amount" DECIMAL(36,18) NOT NULL,
    "source_tx_hash" TEXT,
    "destination_chain_id" INTEGER NOT NULL,
    "destination_token" TEXT NOT NULL,
    "expected_output" DECIMAL(36,18) NOT NULL,
    "actual_output" DECIMAL(36,18),
    "tiplink_id" TEXT,
    "tiplink_url" TEXT,
    "status" "public"."IntentStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "source_token_price_usd" DECIMAL(18,8),
    "destination_token_price_usd" DECIMAL(18,8),
    "total_value_usd" DECIMAL(18,2),
    "fusion_order_id" TEXT,
    "fusion_order_data" JSONB,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cross_chain_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fulfillment_transactions" (
    "id" TEXT NOT NULL,
    "intent_id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "status" "public"."TxStatus" NOT NULL DEFAULT 'PENDING',
    "block_number" INTEGER,
    "gas_used" BIGINT,
    "gas_price" BIGINT,
    "tx_type" "public"."TransactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recipient_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "preferred_chain_id" INTEGER NOT NULL,
    "preferred_token_symbol" TEXT NOT NULL,
    "preferred_token_address" TEXT NOT NULL,
    "slippage_tolerance" DECIMAL(5,4) NOT NULL,
    "auto_accept_enabled" BOOLEAN NOT NULL DEFAULT false,
    "max_auto_accept_usd" DECIMAL(18,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipient_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supported_chains" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "rpc_url" TEXT NOT NULL,
    "is_evm" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "native_currency" TEXT NOT NULL,
    "block_explorer" TEXT NOT NULL,
    "avg_block_time" INTEGER,
    "avg_gas_price" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supported_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supported_tokens" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "decimals" INTEGER NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "pyth_price_feed_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supported_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_cache" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price_usd" DECIMAL(18,8) NOT NULL,
    "source" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "public"."users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "cross_chain_intents_intent_id_key" ON "public"."cross_chain_intents"("intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "cross_chain_intents_tiplink_id_key" ON "public"."cross_chain_intents"("tiplink_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipient_preferences_user_id_preferred_chain_id_key" ON "public"."recipient_preferences"("user_id", "preferred_chain_id");

-- CreateIndex
CREATE UNIQUE INDEX "supported_tokens_address_chain_id_key" ON "public"."supported_tokens"("address", "chain_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_cache_symbol_source_key" ON "public"."price_cache"("symbol", "source");

-- AddForeignKey
ALTER TABLE "public"."cross_chain_intents" ADD CONSTRAINT "cross_chain_intents_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cross_chain_intents" ADD CONSTRAINT "cross_chain_intents_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fulfillment_transactions" ADD CONSTRAINT "fulfillment_transactions_intent_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "public"."cross_chain_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recipient_preferences" ADD CONSTRAINT "recipient_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
