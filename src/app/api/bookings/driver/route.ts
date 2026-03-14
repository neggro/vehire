import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { driverId: user.id },
      select: {
        id: true,
        status: true,
        startDate: true,
        endDate: true,
        totalAmount: true,
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            city: true,
            images: {
              select: { url: true },
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
        host: {
          select: { fullName: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching driver bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
