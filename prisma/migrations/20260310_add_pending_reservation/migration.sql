-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "pickupTime" TEXT;
ALTER TABLE "bookings" ADD COLUMN "returnTime" TEXT;
ALTER TABLE "bookings" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Montevideo';

-- CreateTable
CREATE TABLE "pending_reservations" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "pickupTime" TEXT NOT NULL DEFAULT '10:00',
    "returnTime" TEXT NOT NULL DEFAULT '10:00',
    "timezone" TEXT NOT NULL DEFAULT 'America/Montevideo',
    "baseAmount" INTEGER NOT NULL,
    "deliveryFee" INTEGER,
    "platformFee" INTEGER NOT NULL,
    "depositAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "withDelivery" BOOLEAN NOT NULL DEFAULT false,
    "deliveryAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_reservations_vehicleId_startDate_endDate_idx" ON "pending_reservations"("vehicleId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "pending_reservations_expiresAt_idx" ON "pending_reservations"("expiresAt");

-- CreateIndex
CREATE INDEX "pending_reservations_driverId_idx" ON "pending_reservations"("driverId");

-- AddForeignKey
ALTER TABLE "pending_reservations" ADD CONSTRAINT "pending_reservations_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_reservations" ADD CONSTRAINT "pending_reservations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
