import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/paypal";
import { convertUyuToUsd } from "@/lib/currency";

interface CreatePayPalOrderRequest {
  pendingReservationId: string;
}

/**
 * POST /api/payments/paypal/orders
 * Create a PayPal order for a pending reservation
 * - Instant booking: CAPTURE immediately
 * - Approval required: AUTHORIZE first, capture when host approves
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body: CreatePayPalOrderRequest = await request.json();
    const { pendingReservationId } = body;

    if (!pendingReservationId) {
      return NextResponse.json(
        { error: "Se requiere pendingReservationId" },
        { status: 400 }
      );
    }

    // Get the pending reservation with vehicle info
    const pendingReservation = await prisma.pendingReservation.findUnique({
      where: { id: pendingReservationId },
      include: {
        vehicle: {
          include: {
            host: true,
          },
        },
        driver: true,
      },
    });

    if (!pendingReservation) {
      return NextResponse.json(
        { error: "Reserva pendiente no encontrada" },
        { status: 404 }
      );
    }

    // Verify the pending reservation belongs to the current user
    if (pendingReservation.driverId !== user.id) {
      return NextResponse.json(
        { error: "No autorizado para esta reserva" },
        { status: 403 }
      );
    }

    // Check if the start date has passed
    if (pendingReservation.startDate < new Date()) {
      return NextResponse.json(
        { error: "La fecha de inicio ya ha pasado. Por favor, selecciona nuevas fechas." },
        { status: 400 }
      );
    }

    // Check for conflicting bookings (vehicle might have been booked by someone else)
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        vehicleId: pendingReservation.vehicleId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        OR: [
          {
            AND: [
              { startDate: { lt: pendingReservation.endDate } },
              { endDate: { gt: pendingReservation.startDate } },
            ],
          },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: "El vehículo ya no está disponible para las fechas seleccionadas." },
        { status: 400 }
      );
    }

    // Get app URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const vehicleName = `${pendingReservation.vehicle.make} ${pendingReservation.vehicle.model}`;

    // Convert amount to USD (PayPal only works with USD)
    const usdAmount = convertUyuToUsd(pendingReservation.totalAmount);

    // Check if vehicle has instant booking enabled
    const instantBooking = pendingReservation.vehicle.instantBooking;
    const intent = instantBooking ? "CAPTURE" : "AUTHORIZE";

    console.log("Creating PayPal order for pending reservation:", {
      pendingReservationId: pendingReservation.id,
      uyuAmount: pendingReservation.totalAmount,
      usdAmount,
      instantBooking,
      intent,
    });

    // Create PayPal order
    const order = await createOrder({
      bookingId: pendingReservationId, // Use pending reservation ID as reference
      amount: usdAmount,
      description: `Alquiler ${vehicleName} - ${pendingReservation.startDate.toLocaleDateString("es-UY")} a ${pendingReservation.endDate.toLocaleDateString("es-UY")}`,
      returnUrl: `${baseUrl}/booking/success?pendingReservation=${pendingReservation.id}&provider=paypal`,
      cancelUrl: `${baseUrl}/booking/${pendingReservation.vehicleId}?error=payment_cancelled`,
      intent,
    });

    console.log("PayPal order created:", order.id, order.status, "intent:", intent);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      intent,
      instantBooking,
      links: order.links,
    });
  } catch (error) {
    console.error("PayPal order creation error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      {
        error: "Error al crear la orden de PayPal",
        details: err.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}
