"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, HeadphonesIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface SenderUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

interface Message {
  id: string;
  senderId: string | null;
  sender: string;
  content: string;
  createdAt: string;
  senderUser?: SenderUser | null;
}

interface ConversationViewProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherParticipantName: string;
}

export function ConversationView({
  conversationId,
  currentUserId,
  initialMessages,
  otherParticipantName,
}: ConversationViewProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content: messageContent,
        }),
      });

      if (!response.ok) throw new Error("Error sending message");

      const { message } = await response.json();
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if message is from current user
  const isCurrentUser = (message: Message) => {
    return message.senderId === currentUserId || (message.sender === "user" && !message.senderId);
  };

  // Get sender display name
  const getSenderName = (message: Message) => {
    if (isCurrentUser(message)) return "Tú";
    if (message.senderUser) return message.senderUser.fullName;
    if (message.sender === "platform" || message.sender === "ai") return "Soporte";
    return otherParticipantName;
  };

  // Get sender avatar
  const getSenderAvatar = (message: Message) => {
    if (isCurrentUser(message)) return null;
    if (message.senderUser?.avatarUrl) return message.senderUser.avatarUrl;
    return null;
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Messages area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No hay mensajes todavía. ¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = isCurrentUser(message);

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {!isUser && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={getSenderAvatar(message) || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {message.sender === "platform" || message.sender === "ai" ? (
                        <HeadphonesIcon className="h-4 w-4" />
                      ) : (
                        getSenderName(message).charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      "text-xs mt-1",
                      isUser
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                {isUser && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-muted">
                      Tú
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !newMessage.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
