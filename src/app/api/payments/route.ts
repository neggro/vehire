import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  createCardPayment,
  createPaymentPreference,
  type CreateCardPaymentParams,
} from "@/lib/mercadopago";
import { calculateBookingAmount } from "@/lib/bookings";

interface PaymentRequest {
  pendingReservationId: string; // Changed from bookingId
  paymentMethod: "card" | "wallet" | "checkout_pro" | "paypal";
  currency?: "UYU" | "USD";
  // For card payments (Mercado Pago)
  cardToken?: string;
  paymentMethodId?: string; // visa, master, etc.
  installments?: number;
  issuerId?: string;
  // Identification (required for Uruguay)
  identificationType?: string;
  identificationNumber?: string;
}

/**
 * POST /api/payments
 * Process a payment for a pending reservation
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

    const body: PaymentRequest = await request.json();
    const {
      pendingReservationId,
      paymentMethod,
      cardToken,
      paymentMethodId,
      installments = 1,
      issuerId,
      identificationType,
      identificationNumber,
    } = body;

    if (!pendingReservationId) {
      return NextResponse.json(
        { error: "Se requiere pendingReservationId" },
        { status: 400 }
      );
    }

    // Validate payment method
    const VALID_PAYMENT_METHODS = ["card", "wallet", "checkout_pro", "paypal"];
    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Método de pago no válido" },
        { status: 400 }
      );
    }

    // Validate installments
    if (!Number.isInteger(installments) || installments < 1 || installments > 24) {
      return NextResponse.json(
        { error: "Número de cuotas no válido" },
        { status: 400 }
      );
    }

    // Validate card payment fields
    if (paymentMethod === "card" && (!cardToken || !paymentMethodId)) {
      return NextResponse.json(
        { error: "Faltan datos de la tarjeta" },
        { status: 400 }
      );
    }

    // Get the pending reservation with vehicle and user info
    const pendingReservation = await prisma.pendingReservation.findUnique({
      where: { id: pendingReservationId },
      include: {
        vehicle: {
          include: {
            host: true,
            images: { take: 1 },
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

    // Check if the start date has already passed
    if (pendingReservation.startDate < new Date()) {
      return NextResponse.json(
        { error: "La fecha de inicio ya ha pasado. Por favor, selecciona nuevas fechas." },
        { status: 400 }
      );
    }

    // Check for conflicting bookings (someone else might have booked while this was pending)
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

    // Get app URL for webhooks and redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const vehicleName = `${pendingReservation.vehicle.make} ${pendingReservation.vehicle.model}`;

    // Only use notification URL if it's a public URL (not localhost)
    // In development without ngrok, webhooks won't work but payments will
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    const notificationUrl = isLocalhost
      ? undefined
      : `${baseUrl}/api/webhooks/mercadopago`;

    // Handle different payment methods
    if (paymentMethod === "card" && cardToken && paymentMethodId) {
      // ========================================
      // Checkout API - Card Payment
      // ========================================
      const paymentParams: CreateCardPaymentParams = {
        transactionAmount: pendingReservation.totalAmount,
        token: cardToken,
        description: `Alquiler ${vehicleName} - ${pendingReservation.startDate.toLocaleDateString("es-UY")} a ${pendingReservation.endDate.toLocaleDateString("es-UY")}`,
        installments,
        paymentMethodId,
        issuerId: issuerId ? parseInt(issuerId, 10) : undefined,
        payer: {
          email: pendingReservation.driver.email,
          firstName: pendingReservation.driver.fullName.split(" ")[0],
          lastName: pendingReservation.driver.fullName.split(" ").slice(1).join(" ") || "",
          identification: identificationType && identificationNumber
            ? {
                type: identificationType,
                number: identificationNumber,
              }
            : undefined,
        },
        externalReference: pendingReservationId, // Use pending reservation ID as external reference
        notificationUrl,
      };

      const paymentResponse = await createCardPayment(paymentParams);

      // If payment approved, create the booking and delete pending reservation
      if (paymentResponse.status === "approved") {
        const booking = await createBookingFromPendingReservation(pendingReservation);

        // Create payment record
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            amount: pendingReservation.totalAmount,
            platformFee: pendingReservation.platformFee,
            hostPayout: pendingReservation.baseAmount - pendingReservation.platformFee,
            depositAmount: pendingReservation.depositAmount,
            provider: "MERCADOPAGO",
            currency: "UYU",
            status: "HELD",
            mpPaymentId: paymentResponse.id.toString(),
            mpStatus: paymentResponse.status,
            paidAt: new Date(),
          },
        });

        // Delete the pending reservation
        await prisma.pendingReservation.delete({
          where: { id: pendingReservationId },
        });

        return NextResponse.json({
          success: true,
          paymentMethod: "card",
          payment: {
            id: paymentResponse.id,
            status: paymentResponse.status,
            statusDetail: paymentResponse.statusDetail,
          },
          redirectUrl: `${baseUrl}/booking/success?booking=${booking.id}`,
        });
      }

      // For pending/rejected payments, don't create booking yet
      return NextResponse.json({
        success: true,
        paymentMethod: "card",
        payment: {
          id: paymentResponse.id,
          status: paymentResponse.status,
          statusDetail: paymentResponse.statusDetail,
        },
        redirectUrl:
          paymentResponse.status === "pending"
            ? `${baseUrl}/booking/success?pendingReservation=${pendingReservationId}&status=pending`
            : `${baseUrl}/booking/${pendingReservation.vehicleId}?error=payment_rejected`,
      });
    } else if (paymentMethod === "checkout_pro" || paymentMethod === "wallet") {
      // ========================================
      // Checkout Pro - Redirect to Mercado Pago
      // ========================================
      const preference = await createPaymentPreference({
        bookingId: pendingReservationId, // Pass pending reservation ID
        title: `${vehicleName} ${pendingReservation.vehicle.year}`,
        description: `Alquiler desde ${pendingReservation.startDate.toLocaleDateString("es-UY")} hasta ${pendingReservation.endDate.toLocaleDateString("es-UY")}`,
        amount: pendingReservation.totalAmount,
        payerEmail: pendingReservation.driver.email,
        externalReference: pendingReservationId, // Use pending reservation ID
        notificationUrl,
        backUrls: {
          success: `${baseUrl}/booking/success?pendingReservation=${pendingReservationId}`,
          failure: `${baseUrl}/booking/${pendingReservation.vehicleId}?error=payment_failed`,
          pending: `${baseUrl}/booking/success?pendingReservation=${pendingReservationId}&status=pending`,
        },
      });

      // Update pending reservation with preference ID (optional, for tracking)
      await prisma.pendingReservation.update({
        where: { id: pendingReservationId },
        data: {
          // We could add a preferenceId field if needed
        },
      });

      return NextResponse.json({
        success: true,
        paymentMethod: "checkout_pro",
        initPoint: preference.initPoint,
        sandboxInitPoint: preference.sandboxInitPoint,
      });
    } else {
      return NextResponse.json(
        { error: "Método de pago no válido o faltan datos" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago" },
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

function mapPaymentStatus(
  mpStatus: string
): "PENDING" | "PROCESSING" | "HELD" | "RELEASED" | "REFUNDED" | "FAILED" {
  switch (mpStatus) {
    case "approved":
      return "HELD";
    case "pending":
    case "in_process":
      return "PROCESSING";
    case "rejected":
    case "cancelled":
      return "FAILED";
    default:
      return "PENDING";
  }
}
