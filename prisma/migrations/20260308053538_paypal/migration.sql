/*
  Warnings:

  - You are about to drop the column `bookingId` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `participantId` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `messages` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADOPAGO', 'PAYPAL');

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_participantId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropIndex
DROP INDEX "conversations_bookingId_idx";

-- DropIndex
DROP INDEX "conversations_bookingId_key";

-- DropIndex
DROP INDEX "conversations_participantId_idx";

-- DropIndex
DROP INDEX "messages_senderId_idx";

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "bookingId",
DROP COLUMN "participantId";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "senderId";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'UYU',
ADD COLUMN     "originalAmount" INTEGER,
ADD COLUMN     "paypalCaptureId" TEXT,
ADD COLUMN     "paypalOrderId" TEXT,
ADD COLUMN     "paypalStatus" TEXT,
ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'MERCADOPAGO';

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "instantBooking" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "payments_paypalOrderId_idx" ON "payments"("paypalOrderId");
