import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS } from "@/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.BOOKINGS);
  if ("error" in result) return result.error;

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      driver: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          kycStatus: true,
        },
      },
      host: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          plateNumber: true,
          city: true,
          images: {
            take: 1,
            orderBy: { order: "asc" },
            select: { url: true },
          },
        },
      },
      payment: true,
      incidents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          description: true,
          status: true,
          amount: true,
          createdAt: true,
          reportedBy: true,
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: { select: { id: true, fullName: true } },
          reviewee: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Reserva no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(booking);
}
