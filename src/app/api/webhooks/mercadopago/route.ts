import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail, sendNewBookingNotificationToHost } from "@/lib/resend";

// Mercado Pago webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature (important for production)
    // const signature = request.headers.get("x-signature");
    // if (!verifyWebhookSignature(signature, JSON.stringify(body))) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // Handle different webhook types
    if (body.type === "payment") {
      const paymentId = body.data.id;

      // Get payment details from Mercado Pago
      // const mpPayment = await getPayment(paymentId);

      // Find the payment in our database
      const payment = await prisma.payment.findFirst({
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
