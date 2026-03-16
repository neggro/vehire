import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { ConversationView } from "./conversation-view";
import { getTranslations, getLocale } from "next-intl/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("dashboard.messages");
  const locale = await getLocale();
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
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  // Check ownership
  if (conversation.userId !== user.id) {
    notFound();
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "support":
        return t("typeSupport");
      case "booking":
        return t("typeBooking");
      case "general":
        return t("typeGeneral");
      case "SUPPORT_DRIVER":
        return t("typeSupportDriver");
      case "SUPPORT_HOST":
        return t("typeSupportHost");
      default:
        return type;
    }
  };

  const formattedDate = conversation.createdAt.toLocaleDateString(locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-UY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/messages"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToMessages")}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {conversation.title || getTypeLabel(conversation.type)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("conversationStarted", { date: formattedDate })}
            </p>
          </div>
          <Badge variant="outline">{getTypeLabel(conversation.type)}</Badge>
        </div>
      </div>

      {/* Conversation view */}
      <ConversationView
        conversationId={conversation.id}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
