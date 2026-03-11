import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TIMEZONE, toUTC } from "@/lib/timezone";

// Rate limiting: Max pending reservations per user
const MAX_PENDING_RESERVATIONS_PER_USER = 5;

// POST - Create a pending reservation
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      vehicleId,
      startDate,
      endDate,
      pickupTime = "10:00",
      returnTime = "10:00",
      withDelivery = false,
      deliveryAddress,
      baseAmount,
      deliveryFee,
      platformFee,
      depositAmount,
      totalAmount,
    } = body;

    // Validate required fields
    if (!vehicleId || !startDate || !endDate || baseAmount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get vehicle and check if it's active
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        hostId: true,
        status: true,
        instantBooking: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    if (vehicle.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Vehicle is not available for booking" },
        { status: 400 }
      );
    }

    // Check if user is not the host
    if (vehicle.hostId === user.id) {
      return NextResponse.json(
        { error: "You cannot book your own vehicle" },
        { status: 400 }
      );
    }

    // Convert dates to UTC using the selected times and timezone
    const startUTC = toUTC(new Date(startDate), pickupTime, DEFAULT_TIMEZONE);
    const endUTC = toUTC(new Date(endDate), returnTime, DEFAULT_TIMEZONE);

    // Validate dates
    if (startUTC >= endUTC) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    if (startUTC < new Date()) {
      return NextResponse.json(
        { error: "Start date cannot be in the past" },
        { status: 400 }
      );
    }

    // Check for conflicting bookings (confirmed or active bookings)
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        vehicleId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        OR: [
          {
            AND: [
              { startDate: { lt: endUTC } },
              { endDate: { gt: startUTC } },
            ],
          },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: "Vehicle is not available for the selected dates" },
        { status: 400 }
      );
    }

    // Rate limiting: Check how many pending reservations user has
    const existingPendingCount = await prisma.pendingReservation.count({
      where: {
        driverId: user.id,
        startDate: { gte: new Date() }, // Only count future reservations
      },
    });

    if (existingPendingCount >= MAX_PENDING_RESERVATIONS_PER_USER) {
      return NextResponse.json(
        { error: `You have reached the maximum of ${MAX_PENDING_RESERVATIONS_PER_USER} pending reservations. Please complete or cancel some before creating new ones.` },
        { status: 429 }
      );
    }

    // Delete any existing pending reservations for this user + vehicle + same dates
    await prisma.pendingReservation.deleteMany({
      where: {
        driverId: user.id,
        vehicleId,
        startDate: startUTC,
        endDate: endUTC,
      },
    });

    // Create pending reservation (no expiration - kept until startDate passes)
    const pendingReservation = await prisma.pendingReservation.create({
      data: {
        driverId: user.id,
        vehicleId,
        startDate: startUTC,
        endDate: endUTC,
        pickupTime,
        returnTime,
        timezone: DEFAULT_TIMEZONE,
        baseAmount,
        deliveryFee,
        platformFee,
        depositAmount,
        totalAmount,
        withDelivery,
        deliveryAddress,
      },
    });

    return NextResponse.json({
      id: pendingReservation.id,
      createdAt: pendingReservation.createdAt,
    });
  } catch (error) {
    console.error("Error creating pending reservation:", error);
    return NextResponse.json(
      { error: "Failed to create pending reservation" },
      { status: 500 }
    );
  }
}

// GET - List all pending reservations for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId");
    const includePast = searchParams.get("includePast") === "true";

    // Build where clause
    const where: any = {
      driverId: user.id,
    };

    // Filter by vehicle if provided
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    // By default, only show future pending reservations
    if (!includePast) {
      where.startDate = { gte: new Date() };
    }

    // Get pending reservations with vehicle details
    const pendingReservations = await prisma.pendingReservation.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            city: true,
            state: true,
            images: {
              select: { url: true },
              orderBy: { order: "asc" },
              take: 1,
            },
            host: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check availability for each pending reservation
    const reservationsWithAvailability = await Promise.all(
      pendingReservations.map(async (pr) => {
        // Check if there are now conflicting bookings
        const conflictingBookings = await prisma.booking.findMany({
          where: {
            vehicleId: pr.vehicleId,
            status: { in: ["CONFIRMED", "ACTIVE"] },
            OR: [
              {
                AND: [
                  { startDate: { lt: pr.endDate } },
                  { endDate: { gt: pr.startDate } },
                ],
              },
            ],
          },
        });

        return {
          id: pr.id,
          startDate: pr.startDate,
          endDate: pr.endDate,
          pickupTime: pr.pickupTime,
          returnTime: pr.returnTime,
          totalAmount: pr.totalAmount,
          withDelivery: pr.withDelivery,
          deliveryAddress: pr.deliveryAddress,
          createdAt: pr.createdAt,
          reminderSentAt: pr.reminderSentAt,
          isAvailable: conflictingBookings.length === 0,
          vehicle: {
            id: pr.vehicle.id,
            make: pr.vehicle.make,
            model: pr.vehicle.model,
            year: pr.vehicle.year,
            city: pr.vehicle.city,
            state: pr.vehicle.state,
            image: pr.vehicle.images[0]?.url || null,
            host: pr.vehicle.host,
          },
        };
      })
    );

    return NextResponse.json({
      pendingReservations: reservationsWithAvailability,
      total: reservationsWithAvailability.length,
    });
  } catch (error) {
    console.error("Error fetching pending reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending reservations" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/delete a pending reservation
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Pending reservation ID is required" },
        { status: 400 }
      );
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
