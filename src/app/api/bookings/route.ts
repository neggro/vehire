import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { calculateBookingAmount } from "@/lib/bookings";

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
    const { vehicleId, startDate, endDate, withDelivery, deliveryAddress } = body;

    if (!vehicleId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Get vehicle with host info
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        host: { select: { id: true, email: true, fullName: true } },
        images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }

    if (vehicle.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "El vehículo no está disponible para reservar" },
        { status: 400 }
      );
    }

    // Check if user is trying to book their own vehicle
    if (vehicle.hostId === user.id) {
      return NextResponse.json(
        { error: "No puedes reservar tu propio vehículo" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start >= end) {
      return NextResponse.json(
        { error: "La fecha de devolución debe ser posterior a la de retiro" },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: "La fecha de retiro no puede ser en el pasado" },
        { status: 400 }
      );
    }

    // Calculate booking amounts
    const calculation = calculateBookingAmount({
      basePriceDay: vehicle.basePriceDay,
      weekendPriceDay: vehicle.weekendPriceDay,
      startDate: start,
      endDate: end,
      deliveryAvailable: withDelivery,
      deliveryPrice: vehicle.deliveryPrice,
      estimatedValue: vehicle.estimatedValue,
    });

    // Check if user has an existing pending booking for this vehicle and dates
    const existingPendingBooking = await prisma.booking.findFirst({
      where: {
        driverId: user.id,
        vehicleId,
        status: "PENDING",
        startDate: start,
        endDate: end,
      },
    });

    if (existingPendingBooking) {
      return NextResponse.json({
        bookingId: existingPendingBooking.id,
        status: "PENDING",
        totalAmount: existingPendingBooking.totalAmount,
        message: "Reserva existente recuperada",
      });
    }

    // Use transaction to prevent race conditions on availability check + booking creation
    const result = await prisma.$transaction(async (tx) => {
      // Check availability - overlapping bookings (simplified condition)
      const existingBookings = await tx.booking.findMany({
        where: {
          vehicleId,
          status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          startDate: { lt: end },
          endDate: { gt: start },
        },
      });

      if (existingBookings.length > 0) {
        throw new Error("VEHICLE_UNAVAILABLE");
      }

      // Check explicit availability blocks
      const blockedDates = await tx.availability.findMany({
        where: {
          vehicleId,
          date: { gte: start, lte: end },
          isAvailable: false,
        },
        take: 1,
      });

      if (blockedDates.length > 0) {
        throw new Error("DATES_BLOCKED");
      }

      // Create booking
      const booking = await tx.booking.create({
        data: {
          driverId: user.id,
          hostId: vehicle.hostId,
          vehicleId: vehicle.id,
          startDate: start,
          endDate: end,
          baseAmount: calculation.baseAmount,
          deliveryFee: calculation.deliveryFee,
          platformFee: calculation.platformFee,
          depositAmount: calculation.depositAmount,
          totalAmount: calculation.totalAmount,
          status: "PENDING",
          pickupLocation: withDelivery ? deliveryAddress : vehicle.address,
          returnLocation: withDelivery ? deliveryAddress : vehicle.address,
        },
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: calculation.totalAmount,
          platformFee: calculation.platformFee,
          hostPayout: calculation.hostPayout,
          depositAmount: calculation.depositAmount,
          status: "PENDING",
        },
      });

      return { booking, payment };
    });

    return NextResponse.json({
      bookingId: result.booking.id,
      status: "PENDING",
      totalAmount: calculation.totalAmount,
      paymentId: result.payment.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "VEHICLE_UNAVAILABLE") {
        return NextResponse.json(
          { error: "El vehículo no está disponible en las fechas seleccionadas" },
          { status: 400 }
        );
      }
      if (error.message === "DATES_BLOCKED") {
        return NextResponse.json(
          { error: "El vehículo tiene días no disponibles en el rango seleccionado" },
          { status: 400 }
        );
      }
    }
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Error al crear la reserva" },
      { status: 500 }
    );
  }
}
