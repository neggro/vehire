import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// GET: List user's conversations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch conversations where user is owner OR participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userId: user.id },
          { participantId: user.id },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        user: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        participant: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            vehicle: {
              select: { id: true, make: true, model: true },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, initialMessage, participantId, bookingId } = body;

    if (!type || !initialMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate conversation type
    const validTypes = ["SUPPORT_DRIVER", "SUPPORT_HOST", "BOOKING_CHAT", "support", "booking", "general"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid conversation type" },
        { status: 400 }
      );
    }

    // Normalize type names
    let normalizedType = type;
    if (type === "support") normalizedType = "SUPPORT_DRIVER";
    if (type === "booking") normalizedType = "BOOKING_CHAT";
    if (type === "general") normalizedType = "SUPPORT_DRIVER";

    // For BOOKING_CHAT, validate the booking and participant
    if (normalizedType === "BOOKING_CHAT") {
      if (!bookingId) {
        return NextResponse.json(
          { error: "Booking ID required for BOOKING_CHAT" },
          { status: 400 }
        );
      }

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, driverId: true, hostId: true, status: true },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      // Verify user is part of the booking
      const isDriver = booking.driverId === user.id;
      const isHost = booking.hostId === user.id;

      if (!isDriver && !isHost) {
        return NextResponse.json(
          { error: "Not authorized to create chat for this booking" },
          { status: 403 }
        );
      }

      // Check if conversation already exists for this booking
      const existingConversation = await prisma.conversation.findUnique({
        where: { bookingId },
      });

      if (existingConversation) {
        return NextResponse.json({ conversationId: existingConversation.id });
      }

      // Set participant as the other party in the booking
      const otherParticipantId = isDriver ? booking.hostId : booking.driverId;

      // Create conversation with initial message
      const conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          participantId: otherParticipantId,
          type: normalizedType,
          bookingId,
          title: title || `Chat sobre reserva`,
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
    }

    // For support conversations, check if there's an existing open one
    const existingSupport = await prisma.conversation.findFirst({
      where: {
        userId: user.id,
        type: normalizedType,
        bookingId: null,
      },
      orderBy: { updatedAt: "desc" },
    });

    // If there's a recent support conversation (within last 24h with < 10 messages), add to it
    if (existingSupport) {
      const messageCount = await prisma.message.count({
        where: { conversationId: existingSupport.id },
      });

      const lastUpdate = new Date(existingSupport.updatedAt);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (messageCount < 10 && hoursSinceUpdate < 24) {
        // Add message to existing conversation
        await prisma.message.create({
          data: {
            conversationId: existingSupport.id,
            senderId: user.id,
            sender: "user",
            content: initialMessage,
          },
        });

        await prisma.conversation.update({
          where: { id: existingSupport.id },
          data: { updatedAt: new Date() },
        });

        return NextResponse.json({ conversationId: existingSupport.id });
      }
    }

    // Create new conversation with initial message
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        participantId: participantId || null,
        type: normalizedType,
        title: title || null,
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
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
