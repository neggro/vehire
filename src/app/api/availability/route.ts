import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vehicleId, date, isAvailable, priceOverride } = body;

    if (!vehicleId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check vehicle ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || vehicle.hostId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check for existing bookings on this date
    const targetDate = new Date(date);
    const existingBooking = await prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Cannot modify availability for dates with active bookings" },
        { status: 400 }
      );
    }

    // Upsert availability
    await prisma.availability.upsert({
      where: {
        vehicleId_date: {
          vehicleId,
          date: targetDate,
        },
      },
      update: {
        isAvailable,
        priceOverride: priceOverride || null,
      },
      create: {
        vehicleId,
        date: targetDate,
        isAvailable,
        priceOverride: priceOverride || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
