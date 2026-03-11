import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail, sendNewBookingNotificationToHost } from "@/lib/resend";
import { verifyWebhookSignature } from "@/lib/mercadopago";
import { notifyPendingReservationHolders } from "@/lib/email-notifications";

// Mercado Pago webhook handler
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Verify webhook signature (important for production)
    const signature = request.headers.get("x-signature");
    if (!verifyWebhookSignature(signature, rawBody)) {
      console.warn("Webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Handle different webhook types
    if (body.type === "payment") {
      const paymentId = body.data.id;
      const externalReference = body.data?.external_reference;

      // Get payment details from Mercado Pago
      // const mpPayment = await getPayment(paymentId);

      // Find the payment in our database
      // First try by mpPaymentId, then by looking up via preference
      let payment = await prisma.payment.findFirst({
        where: {
          mpPaymentId: paymentId.toString(),
        },
        include: {
          booking: {
            include: {
              driver: true,
              host: true,
              vehicle: true,
            },
          },
        },
      });

      // If not found by payment ID, check if it's for a pending reservation
      if (!payment && externalReference) {
        // Check if external reference is a pending reservation
        const pendingReservation = await prisma.pendingReservation.findUnique({
          where: { id: externalReference },
          include: {
            vehicle: {
              include: {
                host: true,
              },
            },
            driver: true,
          },
        });

        if (pendingReservation) {
          // This is a pending reservation - handle it
          console.log("Found pending reservation for payment:", externalReference);
          const mpStatus = "approved" as "approved" | "rejected" | "cancelled" | "pending"; // mpPayment.status;

          if (mpStatus === "approved") {
            await handlePendingReservationApproved(pendingReservation, paymentId.toString());
          } else {
            // For failed/pending payments, just log - pending reservation will expire
            console.log(`Payment ${mpStatus} for pending reservation ${externalReference}`);
          }

          return NextResponse.json({ received: true });
        }
      }

      // If not found by payment ID, the webhook might be for a new payment
      // We need to find it via the preference ID from the merchant_order
      if (!payment && body.data?.preference_id) {
        payment = await prisma.payment.findFirst({
          where: {
            mpPreferenceId: body.data.preference_id,
          },
          include: {
            booking: {
              include: {
                driver: true,
                host: true,
                vehicle: true,
              },
            },
          },
        });

        // Update the payment with the actual payment ID from MP
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { mpPaymentId: paymentId.toString() },
          });
        }
      }

      if (!payment) {
        console.log(`Payment not found for MP payment ID: ${paymentId}`);
        return NextResponse.json({ received: true });
      }

      // Update payment status based on Mercado Pago status
      // For demo, we'll assume the payment is approved
      const mpStatus = "approved" as "approved" | "rejected" | "cancelled" | "pending"; // mpPayment.status;

      switch (mpStatus) {
        case "approved":
          await handlePaymentApproved(payment);
          break;
        case "rejected":
          await handlePaymentRejected(payment);
          break;
        case "cancelled":
          await handlePaymentCancelled(payment);
          break;
        case "pending":
          await handlePaymentPending(payment);
          break;
      }
    }

    // Handle other webhook types (e.g., "merchant_order")
    if (body.type === "merchant_order") {
      // Handle merchant order updates
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle payment approved for a pending reservation
 * Creates the booking and payment record, then deletes the pending reservation
 */
async function handlePendingReservationApproved(
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
      make: string;
      model: string;
    };
    driver: {
      email: string;
      fullName: string;
    };
  },
  mpPaymentId: string
) {
  // Create the booking
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
    include: {
      driver: true,
      host: true,
      vehicle: true,
    },
  });

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
      mpPaymentId,
      mpStatus: "approved",
      paidAt: new Date(),
    },
  });

  // Delete the pending reservation
  await prisma.pendingReservation.delete({
    where: { id: pendingReservation.id },
  });

  // Update booking status if instant booking
  if (pendingReservation.vehicle.instantBooking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
    });
  }

  // Send confirmation emails
  try {
    const vehicleName = `${booking.vehicle.make} ${booking.vehicle.model}`;

    // Email to driver
    await sendBookingConfirmationEmail({
      to: booking.driver.email,
      driverName: booking.driver.fullName,
      hostName: booking.host.fullName,
      vehicleName,
      startDate: booking.startDate.toLocaleDateString("es-UY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      endDate: booking.endDate.toLocaleDateString("es-UY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      totalAmount: booking.totalAmount,
      bookingId: booking.id,
    });

    // Email to host
    await sendNewBookingNotificationToHost({
      to: booking.host.email,
      hostName: booking.host.fullName,
      driverName: booking.driver.fullName,
      vehicleName,
      startDate: booking.startDate.toLocaleDateString("es-UY"),
      endDate: booking.endDate.toLocaleDateString("es-UY"),
      totalAmount: booking.baseAmount - booking.platformFee,
      bookingId: booking.id,
    });
  } catch (emailError) {
    console.error("Error sending emails:", emailError);
    // Don't fail the webhook if emails fail
  }

  console.log(`Booking ${booking.id} created from pending reservation ${pendingReservation.id}`);

  // Notify users with conflicting pending reservations
  try {
    const result = await notifyPendingReservationHolders({
      vehicleId: pendingReservation.vehicleId,
      bookedStartDate: pendingReservation.startDate,
      bookedEndDate: pendingReservation.endDate,
      bookedBy: pendingReservation.driverId,
    });
    if (result.notified > 0) {
      console.log(`Notified ${result.notified} users with conflicting pending reservations`);
    }
  } catch (notifyError) {
    console.error("Error notifying pending reservation holders:", notifyError);
    // Don't fail the webhook if notification fails
  }
}

async function handlePaymentApproved(payment: any) {
  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "HELD",
      escrowStatus: "held",
      mpStatus: "approved",
      paidAt: new Date(),
    },
  });

  // Update booking status
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      status: "CONFIRMED",
    },
  });

  // Send confirmation emails
  try {
    const booking = payment.booking;
    const vehicleName = `${booking.vehicle.make} ${booking.vehicle.model}`;

    // Email to driver
    await sendBookingConfirmationEmail({
      to: booking.driver.email,
      driverName: booking.driver.fullName,
      hostName: booking.host.fullName,
      vehicleName,
      startDate: booking.startDate.toLocaleDateString("es-UY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      endDate: booking.endDate.toLocaleDateString("es-UY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      totalAmount: booking.totalAmount,
      bookingId: booking.id,
    });

    // Email to host
    await sendNewBookingNotificationToHost({
      to: booking.host.email,
      hostName: booking.host.fullName,
      driverName: booking.driver.fullName,
      vehicleName,
      startDate: booking.startDate.toLocaleDateString("es-UY"),
      endDate: booking.endDate.toLocaleDateString("es-UY"),
      totalAmount: booking.baseAmount - booking.platformFee,
      bookingId: booking.id,
    });
  } catch (emailError) {
    console.error("Error sending emails:", emailError);
    // Don't fail the webhook if emails fail
  }
}

async function handlePaymentRejected(payment: any) {
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      mpStatus: "rejected",
    },
  });

  // Optionally notify the user
}

async function handlePaymentCancelled(payment: any) {
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "FAILED",
      mpStatus: "cancelled",
    },
  });

  // Update booking status
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: "Payment cancelled",
    },
  });
}

async function handlePaymentPending(payment: any) {
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PROCESSING",
      mpStatus: "pending",
    },
  });
}

// GET endpoint for webhook verification (some providers require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Mercado Pago webhook verification
  const challenge = searchParams.get("hub.challenge");
  if (challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ status: "ok" });
}
