import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        totalAmount: true,
        baseAmount: true,
        platformFee: true,
        depositAmount: true,
        deliveryFee: true,
        createdAt: true,
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            city: true,
            state: true,
            images: {
              select: { url: true },
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
        host: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        payment: {
          select: {
            status: true,
            mpStatus: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only allow driver or host to view the booking
    if (booking.host.id !== user.id) {
      // Need to check if user is the driver
      const fullBooking = await prisma.booking.findUnique({
        where: { id },
        select: { driverId: true },
      });
      if (fullBooking?.driverId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
