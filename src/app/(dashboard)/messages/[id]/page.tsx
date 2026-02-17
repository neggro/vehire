import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, HeadphonesIcon, Car, ExternalLink } from "lucide-react";
import { ConversationView } from "./conversation-view";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/messages");
  }

  // Fetch conversation with messages
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          senderUser: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
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
    },
  });

  if (!conversation) {
    notFound();
  }

  // Check access - user must be owner OR participant
  const isOwner = conversation.userId === user.id;
  const isParticipant = conversation.participantId === user.id;

  if (!isOwner && !isParticipant) {
    notFound();
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "SUPPORT_DRIVER":
        return "Soporte Conductor";
      case "SUPPORT_HOST":
        return "Soporte Anfitrión";
      case "BOOKING_CHAT":
        return "Chat de Reserva";
      case "support":
        return "Soporte";
      case "booking":
        return "Reserva";
      case "general":
        return "General";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SUPPORT_DRIVER":
      case "SUPPORT_HOST":
      case "support":
        return "bg-blue-500";
      case "BOOKING_CHAT":
      case "booking":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get the other participant
  const otherParticipant = isOwner ? conversation.participant : conversation.user;

  // Get display title
  const getDisplayTitle = () => {
    if (conversation.title) return conversation.title;

    if (conversation.type === "BOOKING_CHAT" && conversation.booking) {
      return `${conversation.booking.vehicle.make} ${conversation.booking.vehicle.model}`;
    }

    if (otherParticipant) {
      return otherParticipant.fullName;
    }

    return getTypeLabel(conversation.type);
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/messages"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mensajes
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {otherParticipant ? (
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherParticipant.avatarUrl || undefined} />
                <AvatarFallback>
                  {otherParticipant.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getTypeColor(conversation.type)}`}>
                <HeadphonesIcon className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {getDisplayTitle()}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{getTypeLabel(conversation.type)}</Badge>
                {otherParticipant && (
                  <span>• {otherParticipant.fullName}</span>
                )}
              </div>
            </div>
          </div>
          {conversation.booking && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/bookings/${conversation.booking.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver reserva
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Booking info banner */}
      {conversation.booking && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-3">
          <Car className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">
              {conversation.booking.vehicle.make} {conversation.booking.vehicle.model}
            </span>
            <span className="text-muted-foreground">
              {" "}• {format(new Date(conversation.booking.startDate), "d MMM", { locale: es })} - {format(new Date(conversation.booking.endDate), "d MMM yyyy", { locale: es })}
            </span>
          </div>
        </div>
      )}

      {/* Conversation view */}
      <ConversationView
        conversationId={conversation.id}
        currentUserId={user.id}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          sender: m.sender,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          senderUser: m.senderUser,
        }))}
        otherParticipantName={otherParticipant?.fullName || "Soporte"}
      />
    </div>
  );
}
