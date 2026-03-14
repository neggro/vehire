import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS, DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.USERS);
  if ("error" in result) return result.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE))));
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const kycStatus = searchParams.get("kycStatus") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.roles = { has: role as any };
  }

  if (kycStatus) {
    where.kycStatus = kycStatus as any;
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = {};
  if (sortBy === "fullName") {
    orderBy.fullName = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        phone: true,
        roles: true,
        adminPermissions: true,
        kycStatus: true,
        createdAt: true,
        _count: {
          select: {
            bookingsAsDriver: true,
            bookingsAsHost: true,
            vehicles: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
