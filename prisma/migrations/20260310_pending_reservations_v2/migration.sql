-- AlterTable: Rename expiresAt to reminderSentAt and make it nullable
ALTER TABLE "pending_reservations" RENAME COLUMN "expiresAt" TO "reminderSentAt";
ALTER TABLE "pending_reservations" ALTER COLUMN "reminderSentAt" DROP NOT NULL;

-- Drop the expiresAt index
DROP INDEX IF EXISTS "pending_reservations_expiresAt_idx";

-- CreateTable: EmailSettings
CREATE TABLE "email_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingReminders" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "bookingConfirmations" BOOLEAN NOT NULL DEFAULT true,
    "bookingCancellations" BOOLEAN NOT NULL DEFAULT true,
    "hostNotifications" BOOLEAN NOT NULL DEFAULT true,
    "paymentReceipts" BOOLEAN NOT NULL DEFAULT true,
    "reviewReminders" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_settings_userId_key" ON "email_settings"("userId");

-- AddForeignKey
ALTER TABLE "email_settings" ADD CONSTRAINT "email_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
