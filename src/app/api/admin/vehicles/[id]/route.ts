import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS } from "@/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.VEHICLES);
  if ("error" in result) return result.error;

  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      host: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          kycStatus: true,
        },
      },
      images: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          bookings: true,
          favorites: true,
        },
      },
    },
  });

  if (!vehicle) {
    return NextResponse.json(
      { error: "Vehículo no encontrado" },
      { status: 404 }
    );
  }

  // Fetch reviews and recent bookings for this vehicle
  const [reviews, bookings] = await Promise.all([
    prisma.review.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { id: true, fullName: true } },
      },
    }),
    prisma.booking.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        totalAmount: true,
        status: true,
        driver: { select: { id: true, fullName: true } },
      },
    }),
  ]);

  return NextResponse.json({ ...vehicle, reviews, bookings });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.VEHICLES);
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  if (!status) {
    return NextResponse.json(
      { error: "El campo status es requerido" },
      { status: 400 }
    );
  }

  const validStatuses = ["ACTIVE", "PAUSED", "REJECTED", "PENDING_APPROVAL"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Status inválido. Valores permitidos: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!vehicle) {
    return NextResponse.json(
      { error: "Vehículo no encontrado" },
      { status: 404 }
    );
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      status,
      ...(notes !== undefined && { description: notes }),
    },
    select: {
      id: true,
      make: true,
      model: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}
