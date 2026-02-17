import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get all messages for a conversation
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

    // Check conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { userId: true, participantId: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = conversation.userId === user.id;
    const isParticipant = conversation.participantId === user.id;

    if (!isOwner && !isParticipant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: {
        senderUser: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        sender: m.sender,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        senderUser: m.senderUser,
      })),
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
