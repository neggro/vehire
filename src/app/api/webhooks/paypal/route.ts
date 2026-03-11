import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapPayPalStatus } from "@/lib/paypal";

/**
 * POST /api/webhooks/paypal
 * Handle PayPal webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body);

    console.log("PayPal webhook received:", event.event_type, event.resource?.id);

    // Handle different event types
    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED": {
        // Order approved by buyer, ready to capture
        const orderId = event.resource.id;
        console.log("Order approved:", orderId);

        // The capture should be triggered by the frontend
        // This webhook is just for logging/monitoring
        break;
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        // Payment captured successfully
        const captureId = event.resource.id;
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;
        const amount = event.resource.amount?.value;
        const currency = event.resource.amount?.currency_code;

        console.log("Payment captured:", { captureId, orderId, amount, currency });

        if (orderId) {
          // Find payment by PayPal order ID
          const payment = await prisma.payment.findFirst({
            where: { paypalOrderId: orderId },
          });

          if (payment) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                paypalCaptureId: captureId,
                paypalStatus: "COMPLETED",
                status: "HELD",
                paidAt: new Date(),
              },
            });

            // Update booking status
            await prisma.booking.update({
              where: { id: payment.bookingId },
              data: { status: "CONFIRMED" },
            });

            console.log("Payment and booking updated for order:", orderId);
          }
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED": {
        // Payment failed or refunded
        const captureId = event.resource.id;
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;

        console.log("Payment issue:", event.event_type, { captureId, orderId });

        if (orderId) {
          const payment = await prisma.payment.findFirst({
            where: { paypalOrderId: orderId },
          });

          if (payment) {
            const newStatus = event.event_type.includes("REFUNDED") || event.event_type.includes("REVERSED")
              ? "REFUNDED"
              : "FAILED";

            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                paypalCaptureId: captureId,
                paypalStatus: event.event_type.split(".")[2] || event.event_type,
                status: newStatus,
              },
            });
          }
        }
        break;
      }

      case "CHECKOUT.PAYMENT-APPROVAL.REVERSED": {
        // Buyer cancelled the payment approval
        const orderId = event.resource.id;

        console.log("Payment approval reversed:", orderId);

        const payment = await prisma.payment.findFirst({
          where: { paypalOrderId: orderId },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              paypalStatus: "CANCELLED",
              status: "FAILED",
            },
          });
        }
        break;
      }

      default:
        console.log("Unhandled PayPal event type:", event.event_type);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    // Still return 200 to prevent retries
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}
