ALTER TABLE "users" ADD COLUMN "pan" VARCHAR(10);

CREATE UNIQUE INDEX "users_pan_key" ON "users"("pan");

-- Convert stored PKR values using the user-provided rate of 2.96 INR per PKR.
ALTER TABLE "wallets"
    ALTER COLUMN "balance" TYPE DECIMAL(16, 2);
ALTER TABLE "transactions"
    ALTER COLUMN "amount" TYPE DECIMAL(16, 2);
ALTER TABLE "wallet_logs"
    ALTER COLUMN "amount" TYPE DECIMAL(16, 2),
    ALTER COLUMN "balance_before" TYPE DECIMAL(16, 2),
    ALTER COLUMN "balance_after" TYPE DECIMAL(16, 2);

UPDATE "wallets"
SET
    "balance" = ROUND("balance" * 2.96, 2),
    "currency" = 'INR';

UPDATE "transactions"
SET "amount" = ROUND("amount" * 2.96, 2);

UPDATE "wallet_logs"
SET
    "amount" = ROUND("amount" * 2.96, 2),
    "balance_before" = ROUND("balance_before" * 2.96, 2),
    "balance_after" = ROUND("balance_after" * 2.96, 2);

ALTER TABLE "wallets" ALTER COLUMN "currency" SET DEFAULT 'INR';
