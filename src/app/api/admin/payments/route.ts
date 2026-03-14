import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS, DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.PAYMENTS);
  if ("error" in result) return result.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE))));
  const status = searchParams.get("status") || "";
  const provider = searchParams.get("provider") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const where: Prisma.PaymentWhereInput = {};

  if (status) where.status = status as any;
  if (provider) where.provider = provider as any;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const orderBy: Prisma.PaymentOrderByWithRelationInput = {};
  if (sortBy === "amount") {
    orderBy.amount = sortOrder;
  } else if (sortBy === "paidAt") {
    orderBy.paidAt = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        amount: true,
        platformFee: true,
        hostPayout: true,
        depositAmount: true,
        provider: true,
        currency: true,
        status: true,
        paidAt: true,
        releasedAt: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            driver: { select: { id: true, fullName: true, email: true } },
            host: { select: { id: true, fullName: true, email: true } },
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
              },
            },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return NextResponse.json({
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
