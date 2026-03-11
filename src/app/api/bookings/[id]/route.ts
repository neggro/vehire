import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { captureAuthorization, voidAuthorization } from "@/lib/paypal";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            color: true,
            city: true,
            state: true,
            plateNumber: true,
            transmission: true,
            fuelType: true,
            seats: true,
            images: {
              select: { url: true },
              orderBy: { order: "asc" },
            },
          },
        },
        driver: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        host: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            mpStatus: true,
            paypalStatus: true,
            paypalIntent: true,
            amount: true,
            platformFee: true,
            hostPayout: true,
            depositAmount: true,
            paidAt: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only allow driver or host to view the booking
    if (booking.driverId !== user.id && booking.hostId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine user's role in this booking
    const userRole = booking.driverId === user.id ? "driver" : "host";

    return NextResponse.json({ booking, userRole });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status required" }, { status: 400 });
    }

    // Get the booking with payment info
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        host: { select: { id: true } },
        payment: true,
      },
    });

    if (!booking || booking.hostId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Handle PayPal authorization capture when host approves
    if (status === "CONFIRMED" && booking.payment) {
      const payment = booking.payment;

      // If payment is authorized through PayPal, capture it now
      if (
        payment.provider === "PAYPAL" &&
        payment.paypalIntent === "AUTHORIZE" &&
        payment.paypalAuthorizationId &&
        payment.status === "PROCESSING"
      ) {
        console.log("Capturing authorized PayPal payment:", payment.paypalAuthorizationId);

        try {
          const captureResult = await captureAuthorization(payment.paypalAuthorizationId);

          // Update payment record
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              paypalCaptureId: captureResult.id,
              paypalStatus: captureResult.status,
              status: "HELD",
              paidAt: new Date(),
            },
          });

          console.log("PayPal authorization captured:", captureResult.id, captureResult.status);
        } catch (captureError) {
          console.error("Failed to capture PayPal authorization:", captureError);
          return NextResponse.json(
            { error: "Error al capturar el pago autorizado" },
            { status: 500 }
          );
        }
      }
    }

    // Handle PayPal authorization void when rejecting
    if (status === "CANCELLED" && booking.payment) {
      const payment = booking.payment;

      // If payment is authorized through PayPal, void it
      if (
        payment.provider === "PAYPAL" &&
        payment.paypalIntent === "AUTHORIZE" &&
        payment.paypalAuthorizationId &&
        payment.status === "PROCESSING"
      ) {
        console.log("Voiding authorized PayPal payment:", payment.paypalAuthorizationId);

        try {
          await voidAuthorization(payment.paypalAuthorizationId);

          // Update payment record
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
            paypalStatus: "VOIDED",
            status: "REFUNDED",
          },
          });

          console.log("PayPal authorization voided");
        } catch (voidError) {
          console.error("Failed to void PayPal authorization:", voidError);
          // Continue with cancellation even if void fails
        }
      }
    }

    // Update the booking status
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status,
        cancelledAt: status === "CANCELLED" ? new Date() : null,
        cancelledBy: status === "CANCELLED" ? user.id : null,
      },
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
