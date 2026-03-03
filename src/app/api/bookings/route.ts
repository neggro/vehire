import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { calculateBookingAmount } from "@/lib/bookings";
import { createPaymentPreference } from "@/lib/mercadopago";

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

    // Check availability - look for overlapping bookings
    const existingBookings = await prisma.booking.findMany({
      where: {
        vehicleId,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } },
            ],
          },
        ],
      },
    });

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: "El vehículo no está disponible en las fechas seleccionadas" },
        { status: 400 }
      );
    }

    // Check explicit availability blocks
    const blockedDates = await prisma.availability.findMany({
      where: {
        vehicleId,
        date: {
          gte: start,
          lte: end,
        },
        isAvailable: false,
      },
    });

    if (blockedDates.length > 0) {
      return NextResponse.json(
        { error: "El vehículo tiene días no disponibles en el rango seleccionado" },
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

    // Get driver info for Mercado Pago
    const driver = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, fullName: true },
    });

    // Create booking in database
    const booking = await prisma.booking.create({
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
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: calculation.totalAmount,
        platformFee: calculation.platformFee,
        hostPayout: calculation.hostPayout,
        depositAmount: calculation.depositAmount,
        status: "PENDING",
      },
    });

    // Create Mercado Pago preference
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const preference = await createPaymentPreference({
      bookingId: booking.id,
      title: `${vehicle.make} ${vehicle.model} ${vehicle.year}`,
      description: `Alquiler desde ${start.toLocaleDateString("es-UY")} hasta ${end.toLocaleDateString("es-UY")}`,
      amount: calculation.totalAmount,
      payerEmail: driver?.email || "",
      externalReference: booking.id,
      notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
      backUrls: {
        success: `${baseUrl}/booking/success?booking=${booking.id}`,
        failure: `${baseUrl}/booking/${vehicle.id}?error=payment_failed`,
        pending: `${baseUrl}/booking/success?booking=${booking.id}&status=pending`,
      },
    });

    // Update payment with preference ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        mpPreferenceId: preference.id,
      },
    });

    return NextResponse.json({
      bookingId: booking.id,
      preferenceId: preference.id,
      initPoint: process.env.NODE_ENV === "production"
        ? preference.initPoint
        : preference.sandboxInitPoint,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Error al crear la reserva" },
      { status: 500 }
    );
  }
}
