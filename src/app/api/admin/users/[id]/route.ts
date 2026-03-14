import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS } from "@/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.USERS);
  if ("error" in result) return result.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
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
      updatedAt: true,
      _count: {
        select: {
          bookingsAsDriver: true,
          bookingsAsHost: true,
          vehicles: true,
          reviewsReceived: true,
          reviewsGiven: true,
        },
      },
      kycDocuments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          documentUrl: true,
          status: true,
          reviewedBy: true,
          reviewedAt: true,
          notes: true,
          createdAt: true,
        },
      },
      bookingsAsDriver: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          vehicle: {
            select: { id: true, make: true, model: true },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.USERS);
  if ("error" in result) return result.error;
  const { user: admin } = result;

  const { id } = await params;
  const body = await request.json();
  const { roles, adminPermissions, kycStatus } = body;

  // Cannot modify yourself
  if (id === admin.id) {
    if (roles && !roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No puede quitarse el rol de administrador a sí mismo" },
        { status: 400 }
      );
    }
    if (adminPermissions !== undefined) {
      return NextResponse.json(
        { error: "No puede modificar sus propios permisos de administrador" },
        { status: 400 }
      );
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingUser) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (roles !== undefined) updateData.roles = roles;
  if (adminPermissions !== undefined) updateData.adminPermissions = adminPermissions;
  if (kycStatus !== undefined) updateData.kycStatus = kycStatus;

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      fullName: true,
      roles: true,
      adminPermissions: true,
      kycStatus: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}
