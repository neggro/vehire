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
  bookingId: string;
  paymentMethod: "card" | "wallet" | "checkout_pro";
  // For card payments
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
 * Process a payment for a booking
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
      bookingId,
      paymentMethod,
      cardToken,
      paymentMethodId,
      installments = 1,
      issuerId,
      identificationType,
      identificationNumber,
    } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Se requiere bookingId" },
        { status: 400 }
      );
    }

    // Get the booking with vehicle and user info
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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

    if (!booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Verify the booking belongs to the current user
    if (booking.driverId !== user.id) {
      return NextResponse.json(
        { error: "No autorizado para esta reserva" },
        { status: 403 }
      );
    }

    // Verify booking is in PENDING status
    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Esta reserva ya fue procesada" },
        { status: 400 }
      );
    }

    // Get app URL for webhooks and redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const vehicleName = `${booking.vehicle.make} ${booking.vehicle.model}`;
    const notificationUrl = `${baseUrl}/api/webhooks/mercadopago`;

    // Handle different payment methods
    if (paymentMethod === "card" && cardToken && paymentMethodId) {
      // ========================================
      // Checkout API - Card Payment
      // ========================================
      const paymentParams: CreateCardPaymentParams = {
        transactionAmount: booking.totalAmount,
        token: cardToken,
        description: `Alquiler ${vehicleName} - ${booking.startDate.toLocaleDateString("es-UY")} a ${booking.endDate.toLocaleDateString("es-UY")}`,
        installments,
        paymentMethodId,
        issuerId: issuerId ? parseInt(issuerId, 10) : undefined,
        payer: {
          email: booking.driver.email,
          firstName: booking.driver.fullName.split(" ")[0],
          lastName: booking.driver.fullName.split(" ").slice(1).join(" ") || "",
          identification: identificationType && identificationNumber
            ? {
                type: identificationType,
                number: identificationNumber,
              }
            : undefined,
        },
        externalReference: booking.id,
        notificationUrl,
      };

      const paymentResponse = await createCardPayment(paymentParams);

      // Create or update payment record
      await prisma.payment.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          platformFee: booking.platformFee,
          hostPayout: booking.baseAmount - booking.platformFee,
          depositAmount: booking.depositAmount,
          status: mapPaymentStatus(paymentResponse.status),
          mpPaymentId: paymentResponse.id.toString(),
          mpStatus: paymentResponse.status,
          paidAt: paymentResponse.status === "approved" ? new Date() : null,
        },
        update: {
          mpPaymentId: paymentResponse.id.toString(),
          mpStatus: paymentResponse.status,
          status: mapPaymentStatus(paymentResponse.status),
          paidAt: paymentResponse.status === "approved" ? new Date() : null,
        },
      });

      // If payment approved, update booking status
      if (paymentResponse.status === "approved") {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED" },
        });
      }

      return NextResponse.json({
        success: true,
        paymentMethod: "card",
        payment: {
          id: paymentResponse.id,
          status: paymentResponse.status,
          statusDetail: paymentResponse.statusDetail,
        },
        redirectUrl:
          paymentResponse.status === "approved"
            ? `${baseUrl}/booking/success?booking=${booking.id}`
            : paymentResponse.status === "pending"
            ? `${baseUrl}/booking/success?booking=${booking.id}&status=pending`
            : `${baseUrl}/booking/${booking.vehicleId}?error=payment_rejected`,
      });
    } else if (paymentMethod === "checkout_pro" || paymentMethod === "wallet") {
      // ========================================
      // Checkout Pro - Redirect to Mercado Pago
      // ========================================
      const preference = await createPaymentPreference({
        bookingId: booking.id,
        title: `${vehicleName} ${booking.vehicle.year}`,
        description: `Alquiler desde ${booking.startDate.toLocaleDateString("es-UY")} hasta ${booking.endDate.toLocaleDateString("es-UY")}`,
        amount: booking.totalAmount,
        payerEmail: booking.driver.email,
        externalReference: booking.id,
        notificationUrl,
        backUrls: {
          success: `${baseUrl}/booking/success?booking=${booking.id}`,
          failure: `${baseUrl}/booking/${booking.vehicleId}?error=payment_failed`,
          pending: `${baseUrl}/booking/success?booking=${booking.id}&status=pending`,
        },
      });

      // Create payment record with preference ID
      await prisma.payment.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          platformFee: booking.platformFee,
          hostPayout: booking.baseAmount - booking.platformFee,
          depositAmount: booking.depositAmount,
          status: "PENDING",
          mpPreferenceId: preference.id,
        },
        update: {
          mpPreferenceId: preference.id,
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
