import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Plus,
  Search,
  HeadphonesIcon,
  Car,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function MessagesPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/messages");
  }

  // Fetch user's conversations (where they are owner OR participant)
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SUPPORT_DRIVER":
      case "SUPPORT_HOST":
      case "support":
        return HeadphonesIcon;
      case "BOOKING_CHAT":
      case "booking":
        return Car;
      default:
        return MessageSquare;
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

  // Get the other participant in the conversation
  const getOtherParticipant = (conversation: typeof conversations[0]) => {
    if (conversation.userId === user.id) {
      return conversation.participant; // For support conversations, this may be null
    }
    return conversation.user;
  };

  // Get display title
  const getDisplayTitle = (conversation: typeof conversations[0]) => {
    if (conversation.title) return conversation.title;

    const otherParticipant = getOtherParticipant(conversation);

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mensajes</h1>
          <p className="text-muted-foreground">
            Gestiona tus conversaciones con soporte y otros usuarios
          </p>
        </div>
        <Button asChild>
          <Link href="/messages/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo mensaje
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations list */}
      {conversations.length > 0 ? (
        <div className="space-y-3">
          {conversations.map((conversation) => {
            const TypeIcon = getTypeIcon(conversation.type);
            const otherParticipant = getOtherParticipant(conversation);

            return (
              <Link key={conversation.id} href={`/messages/${conversation.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {otherParticipant ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherParticipant.avatarUrl || undefined} />
                          <AvatarFallback>
                            {otherParticipant.fullName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getTypeColor(conversation.type)}`}>
                          <TypeIcon className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold truncate">
                            {getDisplayTitle(conversation)}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(conversation.type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(conversation.updatedAt, {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                          </div>
                        </div>
                        {conversation.messages[0] && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conversation.messages[0].content}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {conversation._count.messages} mensajes
                          </span>
                          {conversation.booking && (
                            <span className="flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {format(new Date(conversation.booking.startDate), "d MMM", { locale: es })} - {format(new Date(conversation.booking.endDate), "d MMM", { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No tienes mensajes
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Inicia una conversación con soporte o contacta a otro usuario
            </p>
            <Button asChild>
              <Link href="/messages/new">
                <Plus className="mr-2 h-4 w-4" />
                Iniciar conversación
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
