import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
    const { type, title, initialMessage } = body;

    if (!type || !initialMessage) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create conversation with initial message
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        type,
        title: title || null,
        messages: {
          create: {
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
