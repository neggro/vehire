import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// GET - Get user's email settings
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create email settings
    let emailSettings = await prisma.emailSettings.findUnique({
      where: { userId: user.id },
    });

    // Create default settings if not exists
    if (!emailSettings) {
      emailSettings = await prisma.emailSettings.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json({ emailSettings });
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch email settings" },
      { status: 500 }
    );
  }
}

// PATCH - Update user's email settings
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookingReminders,
      marketingEmails,
      bookingConfirmations,
      bookingCancellations,
      hostNotifications,
      paymentReceipts,
      reviewReminders,
    } = body;

    // Update or create email settings
    const emailSettings = await prisma.emailSettings.upsert({
      where: { userId: user.id },
      update: {
        ...(bookingReminders !== undefined && { bookingReminders }),
        ...(marketingEmails !== undefined && { marketingEmails }),
        ...(bookingConfirmations !== undefined && { bookingConfirmations }),
        ...(bookingCancellations !== undefined && { bookingCancellations }),
        ...(hostNotifications !== undefined && { hostNotifications }),
        ...(paymentReceipts !== undefined && { paymentReceipts }),
        ...(reviewReminders !== undefined && { reviewReminders }),
      },
      create: {
        userId: user.id,
        bookingReminders: bookingReminders ?? true,
        marketingEmails: marketingEmails ?? false,
        bookingConfirmations: bookingConfirmations ?? true,
        bookingCancellations: bookingCancellations ?? true,
        hostNotifications: hostNotifications ?? true,
        paymentReceipts: paymentReceipts ?? true,
        reviewReminders: reviewReminders ?? true,
      },
    });

    return NextResponse.json({ emailSettings });
  } catch (error) {
    console.error("Error updating email settings:", error);
    return NextResponse.json(
      { error: "Failed to update email settings" },
      { status: 500 }
    );
  }
}
