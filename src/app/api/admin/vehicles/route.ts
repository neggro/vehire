import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS, DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.VEHICLES);
  if ("error" in result) return result.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE))));
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const city = searchParams.get("city") || "";
  const hostId = searchParams.get("hostId") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const where: Prisma.VehicleWhereInput = {};

  if (search) {
    where.OR = [
      { make: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { plateNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status as any;
  }

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (hostId) {
    where.hostId = hostId;
  }

  const orderBy: Prisma.VehicleOrderByWithRelationInput = {};
  if (sortBy === "basePriceDay") {
    orderBy.basePriceDay = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        plateNumber: true,
        city: true,
        status: true,
        basePriceDay: true,
        instantBooking: true,
        createdAt: true,
        host: {
          select: { id: true, fullName: true, email: true },
        },
        images: {
          take: 1,
          orderBy: { order: "asc" },
          select: { url: true },
        },
        _count: {
          select: { bookings: true },
        },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return NextResponse.json({
    vehicles,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
