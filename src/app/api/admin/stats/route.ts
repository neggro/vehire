import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hasPermission } from "@/lib/admin";
import { ADMIN_PERMISSIONS } from "@/constants";

export async function GET() {
  const result = await requireAdmin();
  if ("error" in result) return result.error;
  const { user } = result;

  const hasPaymentsAccess = hasPermission(
    user.adminPermissions,
    ADMIN_PERMISSIONS.PAYMENTS
  );

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalHosts,
    totalDrivers,
    activeVehicles,
    pendingVehicles,
    pendingKYC,
    totalBookings,
    activeBookings,
    monthlyBookings,
    recentBookings,
    recentUsers,
    recentKYC,
    monthlyRevenueResult,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { roles: { has: "HOST" } } }),
    prisma.user.count({ where: { roles: { has: "DRIVER" } } }),
    prisma.vehicle.count({ where: { status: "ACTIVE" } }),
    prisma.vehicle.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "ACTIVE" } }),
    prisma.booking.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        driver: { select: { id: true, fullName: true } },
        vehicle: { select: { id: true, make: true, model: true } },
      },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        roles: true,
        createdAt: true,
      },
    }),
    prisma.kYCDocument.findMany({
      take: 10,
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
    }),
    hasPaymentsAccess
      ? prisma.payment.aggregate({
          _sum: { platformFee: true },
          where: {
            status: { in: ["HELD", "RELEASED"] },
            paidAt: { gte: startOfMonth },
          },
        })
      : null,
  ]);

  const monthlyRevenue = hasPaymentsAccess
    ? monthlyRevenueResult?._sum?.platformFee ?? 0
    : undefined;

  return NextResponse.json({
    totalUsers,
    totalHosts,
    totalDrivers,
    activeVehicles,
    pendingVehicles,
    pendingKYC,
    totalBookings,
    activeBookings,
    monthlyRevenue,
    monthlyBookings,
    hasPaymentsAccess,
    recentActivity: {
      bookings: recentBookings,
      users: recentUsers,
      kyc: recentKYC,
    },
  });
}
