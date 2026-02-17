import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get or create chat for a booking
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

    // Get booking and verify access
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, fullName: true, avatarUrl: true } },
        host: { select: { id: true, fullName: true, avatarUrl: true } },
        vehicle: { select: { id: true, make: true, model: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isDriver = booking.driverId === user.id;
    const isHost = booking.hostId === user.id;

    if (!isDriver && !isHost) {
      return NextResponse.json(
        { error: "Not authorized to access this booking" },
        { status: 403 }
      );
    }

    // Check for existing conversation
    const existingConversation = await prisma.conversation.findUnique({
      where: { bookingId: id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        participant: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        conversation: existingConversation,
        isNew: false,
        otherParticipant: isDriver
          ? { id: booking.host.id, fullName: booking.host.fullName, avatarUrl: booking.host.avatarUrl, role: "host" }
          : { id: booking.driver.id, fullName: booking.driver.fullName, avatarUrl: booking.driver.avatarUrl, role: "driver" },
      });
    }

    // Return booking info for creating a new chat
    return NextResponse.json({
      conversation: null,
      isNew: true,
      booking: {
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        vehicle: booking.vehicle,
      },
      otherParticipant: isDriver
        ? { id: booking.host.id, fullName: booking.host.fullName, avatarUrl: booking.host.avatarUrl, role: "host" }
        : { id: booking.driver.id, fullName: booking.driver.fullName, avatarUrl: booking.driver.avatarUrl, role: "driver" },
    });
  } catch (error) {
    console.error("Error fetching booking chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new chat for a booking
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { initialMessage } = body;

    if (!initialMessage) {
      return NextResponse.json(
        { error: "Initial message required" },
        { status: 400 }
      );
    }

    // Get booking and verify access
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isDriver = booking.driverId === user.id;
    const isHost = booking.hostId === user.id;

    if (!isDriver && !isHost) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Check for existing conversation
    const existingConversation = await prisma.conversation.findUnique({
      where: { bookingId: id },
    });

    if (existingConversation) {
      return NextResponse.json({ conversationId: existingConversation.id });
    }

    // Create conversation
    const otherParticipantId = isDriver ? booking.hostId : booking.driverId;

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        participantId: otherParticipantId,
        type: "BOOKING_CHAT",
        bookingId: id,
        title: `Reserva: ${booking.id.slice(0, 8)}`,
        messages: {
          create: {
            senderId: user.id,
            sender: "user",
            content: initialMessage,
          },
        },
      },
    });

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error("Error creating booking chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
