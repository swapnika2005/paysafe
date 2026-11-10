-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "idempotency_key" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_sender_id_idempotency_key_key" ON "transactions"("sender_id", "idempotency_key");
