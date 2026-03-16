import { Link } from "@/i18n/navigation";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS, pt, type Locale } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { getTranslations, getLocale } from "next-intl/server";

const dateFnsLocales: Record<string, Locale> = { es, en: enUS, pt };

export default async function MessagesPage() {
  const t = await getTranslations("dashboard.messages");
  const locale = await getLocale();
  const dateLocale = dateFnsLocales[locale] || es;

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/messages");
  }

  // Fetch user's conversations
  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "support":
      case "SUPPORT_DRIVER":
      case "SUPPORT_HOST":
        return "bg-blue-500";
      case "booking":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/messages/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("newMessage")}
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations list */}
      {conversations.length > 0 ? (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getTypeColor(conversation.type)}`}>
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">
                          {conversation.title || getTypeLabel(conversation.type)}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(conversation.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(conversation.updatedAt, {
                              addSuffix: true,
                              locale: dateLocale,
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
                          {t("messageCount", { count: conversation._count.messages })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("noMessages")}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t("noMessagesDesc")}
            </p>
            <Button asChild>
              <Link href="/messages/new">
                <Plus className="mr-2 h-4 w-4" />
                {t("startConversation")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
