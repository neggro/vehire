import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS, DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.BOOKINGS);
  if ("error" in result) return result.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE))));
  const status = searchParams.get("status") || "";
  const driverId = searchParams.get("driverId") || "";
  const hostId = searchParams.get("hostId") || "";
  const vehicleId = searchParams.get("vehicleId") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const where: Prisma.BookingWhereInput = {};

  if (status) where.status = status as any;
  if (driverId) where.driverId = driverId;
  if (hostId) where.hostId = hostId;
  if (vehicleId) where.vehicleId = vehicleId;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const orderBy: Prisma.BookingOrderByWithRelationInput = {};
  if (sortBy === "startDate") {
    orderBy.startDate = sortOrder;
  } else if (sortBy === "totalAmount") {
    orderBy.totalAmount = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        totalAmount: true,
        platformFee: true,
        createdAt: true,
        driver: {
          select: { id: true, fullName: true, email: true },
        },
        host: {
          select: { id: true, fullName: true, email: true },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            images: {
              take: 1,
              orderBy: { order: "asc" },
              select: { url: true },
            },
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            provider: true,
          },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
