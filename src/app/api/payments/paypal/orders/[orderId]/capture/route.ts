import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { captureOrder, authorizeOrder, mapPayPalStatus, getOrder } from "@/lib/paypal";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

/**
 * POST /api/payments/paypal/orders/[orderId]/capture
 * Capture or authorize an approved PayPal order
 * - Creates booking from pending reservation on success
 * - Instant booking: capture immediately
 * - Approval required: authorize only (capture when host approves)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params;

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

    // First, try to find existing payment (for re-capture scenarios)
    let payment = await prisma.payment.findFirst({
      where: { paypalOrderId: orderId },
      include: {
        booking: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    let pendingReservationId: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pendingReservation: any = null;

    // If no payment found, get the order details to find the pending reservation
    if (!payment) {
      const orderDetails = await getOrder(orderId);
      // The reference_id contains the pending reservation ID
      pendingReservationId = orderDetails.purchase_units?.[0]?.reference_id ?? null;

      if (!pendingReservationId) {
        return NextResponse.json(
          { error: "No se encontró la referencia de la reserva" },
          { status: 404 }
        );
      }

      // Get the pending reservation
      pendingReservation = await prisma.pendingReservation.findUnique({
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
    } else {
      // Verify the booking belongs to the current user
      if (payment.booking.driverId !== user.id) {
        return NextResponse.json(
          { error: "No autorizado para este pago" },
          { status: 403 }
        );
      }
    }

    const intent = payment?.paypalIntent || "CAPTURE";
    const instantBooking = payment?.booking?.vehicle?.instantBooking ?? pendingReservation?.vehicle?.instantBooking ?? true;

    console.log("Processing PayPal order:", {
      orderId,
      intent,
      instantBooking,
      pendingReservationId,
    });

    let result;
    let captureId: string | undefined;
    let authorizationId: string | undefined;
    let finalStatus: string;

    if (intent === "AUTHORIZE" && !instantBooking) {
      // Authorization flow - for approval-required bookings
      console.log("Authorizing PayPal order:", orderId);
      result = await authorizeOrder(orderId);

      // Get authorization ID from result
      authorizationId = result.purchase_units[0]?.payments?.authorizations?.[0]?.id;
      finalStatus = result.status;

      console.log("PayPal order authorized:", {
        orderId: result.id,
        status: result.status,
        authorizationId,
      });

      // Create booking from pending reservation if needed
      let bookingId: string;
      if (pendingReservation) {
        const booking = await createBookingFromPendingReservation(pendingReservation);
        bookingId = booking.id;

        // Create payment record
        payment = await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: pendingReservation.totalAmount,
            platformFee: pendingReservation.platformFee,
            hostPayout: pendingReservation.baseAmount - pendingReservation.platformFee,
            depositAmount: pendingReservation.depositAmount,
            provider: "PAYPAL",
            currency: "USD",
            originalAmount: pendingReservation.totalAmount,
            status: "PROCESSING",
            paypalOrderId: orderId,
            paypalAuthorizationId: authorizationId,
            paypalStatus: result.status,
            paypalIntent: intent,
            paidAt: new Date(),
          },
          include: {
            booking: {
              include: {
                vehicle: true,
              },
            },
          },
        });

        // Delete the pending reservation
        await prisma.pendingReservation.delete({
          where: { id: pendingReservation.id },
        });
      } else if (payment) {
        // Update existing payment record
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paypalAuthorizationId: authorizationId,
            paypalStatus: result.status,
            status: "PROCESSING",
            paidAt: new Date(),
          },
        });
        bookingId = payment.bookingId;
      } else {
        throw new Error("No payment or pending reservation found");
      }

    } else {
      // Capture flow - for instant bookings
      console.log("Capturing PayPal order:", orderId);
      result = await captureOrder(orderId);

      // Get capture ID from result
      captureId = result.purchase_units[0]?.payments?.captures?.[0]?.id;
      finalStatus = result.status;

      console.log("PayPal order captured:", {
        orderId: result.id,
        status: result.status,
        captureId,
      });

      // Create booking from pending reservation if needed
      let bookingId: string;
      if (pendingReservation) {
        const booking = await createBookingFromPendingReservation(pendingReservation);
        bookingId = booking.id;

        // Update booking status to CONFIRMED on successful payment
        if (result.status === "COMPLETED") {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: "CONFIRMED" },
          });
        }

        // Create payment record
        payment = await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: pendingReservation.totalAmount,
            platformFee: pendingReservation.platformFee,
            hostPayout: pendingReservation.baseAmount - pendingReservation.platformFee,
            depositAmount: pendingReservation.depositAmount,
            provider: "PAYPAL",
            currency: "USD",
            originalAmount: pendingReservation.totalAmount,
            status: mapPayPalStatus(result.status),
            paypalOrderId: orderId,
            paypalCaptureId: captureId,
            paypalStatus: result.status,
            paypalIntent: intent,
            paidAt: result.status === "COMPLETED" ? new Date() : null,
          },
          include: {
            booking: {
              include: {
                vehicle: true,
              },
            },
          },
        });

        // Delete the pending reservation
        await prisma.pendingReservation.delete({
          where: { id: pendingReservation.id },
        });
      } else if (payment) {
        bookingId = payment.bookingId;

        // Update existing payment record
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paypalCaptureId: captureId,
            paypalStatus: result.status,
            status: mapPayPalStatus(result.status),
            paidAt: result.status === "COMPLETED" ? new Date() : null,
          },
        });

        // If payment completed, update booking status to CONFIRMED
        if (result.status === "COMPLETED") {
          await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: "CONFIRMED" },
          });
        }
      } else {
        throw new Error("No payment or pending reservation found");
      }
    }

    // Get base URL for redirect
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Build redirect URL based on the flow
    let redirectUrl: string;
    const bookingId = payment?.bookingId;

    if (intent === "AUTHORIZE" && !instantBooking) {
      redirectUrl = `${baseUrl}/booking/success?booking=${bookingId}&provider=paypal&status=authorized`;
    } else if (finalStatus === "COMPLETED") {
      redirectUrl = `${baseUrl}/booking/success?booking=${bookingId}&provider=paypal`;
    } else if (finalStatus === "PENDING") {
      redirectUrl = `${baseUrl}/booking/success?booking=${bookingId}&status=pending&provider=paypal`;
    } else {
      const vehicleId = payment?.booking?.vehicleId || pendingReservation?.vehicleId;
      redirectUrl = `${baseUrl}/booking/${vehicleId}?error=payment_failed`;
    }

    return NextResponse.json({
      success: true,
      orderId: result.id,
      status: finalStatus,
      intent,
      captureId,
      authorizationId,
      bookingId,
      redirectUrl,
    });
  } catch (error) {
    console.error("PayPal capture/authorize error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      {
        error: "Error al procesar el pago de PayPal",
        details: err.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * Create a booking from a pending reservation after successful payment
 */
async function createBookingFromPendingReservation(
  pendingReservation: {
    id: string;
    driverId: string;
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    pickupTime: string;
    returnTime: string;
    timezone: string;
    baseAmount: number;
    deliveryFee: number | null;
    platformFee: number;
    depositAmount: number;
    totalAmount: number;
    vehicle: {
      hostId: string;
      instantBooking: boolean;
    };
  }
) {
  const booking = await prisma.booking.create({
    data: {
      driverId: pendingReservation.driverId,
      hostId: pendingReservation.vehicle.hostId,
      vehicleId: pendingReservation.vehicleId,
      startDate: pendingReservation.startDate,
      endDate: pendingReservation.endDate,
      pickupTime: pendingReservation.pickupTime,
      returnTime: pendingReservation.returnTime,
      timezone: pendingReservation.timezone,
      baseAmount: pendingReservation.baseAmount,
      deliveryFee: pendingReservation.deliveryFee,
      platformFee: pendingReservation.platformFee,
      depositAmount: pendingReservation.depositAmount,
      totalAmount: pendingReservation.totalAmount,
      status: pendingReservation.vehicle.instantBooking ? "CONFIRMED" : "PENDING",
    },
  });

  return booking;
}
