import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get a single pending reservation by ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the pending reservation
    const pendingReservation = await prisma.pendingReservation.findFirst({
      where: {
        id,
        driverId: user.id,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            city: true,
            images: {
              select: { url: true },
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!pendingReservation) {
      return NextResponse.json(
        { error: "Pending reservation not found" },
        { status: 404 }
      );
    }

    // Check if the start date has passed
    const isExpired = pendingReservation.startDate < new Date();

    return NextResponse.json({
      pendingReservation: {
        id: pendingReservation.id,
        vehicleId: pendingReservation.vehicleId,
        startDate: pendingReservation.startDate,
        endDate: pendingReservation.endDate,
        pickupTime: pendingReservation.pickupTime,
        returnTime: pendingReservation.returnTime,
        totalAmount: pendingReservation.totalAmount,
        withDelivery: pendingReservation.withDelivery,
        deliveryAddress: pendingReservation.deliveryAddress,
        createdAt: pendingReservation.createdAt,
        isExpired,
        vehicle: pendingReservation.vehicle,
      },
    });
  } catch (error) {
    console.error("Error fetching pending reservation:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending reservation" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a pending reservation
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the pending reservation (only if it belongs to the user)
    const result = await prisma.pendingReservation.deleteMany({
      where: {
        id,
        driverId: user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Pending reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pending reservation:", error);
    return NextResponse.json(
      { error: "Failed to delete pending reservation" },
      { status: 500 }
    );
  }
}
