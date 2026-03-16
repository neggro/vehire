"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Bell, ShoppingCart, Calendar, CreditCard, Star, Megaphone, Loader2 } from "lucide-react";
import { EmailSettingsPageSkeleton } from "@/components/skeletons";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface EmailSettings {
  id: string;
  bookingReminders: boolean;
  marketingEmails: boolean;
  bookingConfirmations: boolean;
  bookingCancellations: boolean;
  hostNotifications: boolean;
  paymentReceipts: boolean;
  reviewReminders: boolean;
}

export default function EmailSettingsPage() {
  const t = useTranslations("dashboard.settings");
  const tActions = useTranslations("common.actions");
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/email-settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSettings(data.emailSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: t("loadError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (field: keyof EmailSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: !settings[field] });
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/email-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast({
        title: tActions("saved"),
        description: t("saveSuccess"),
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: t("saveError"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <EmailSettingsPageSkeleton />;
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToDashboard")}
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Booking-related emails */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("bookings")}
            </CardTitle>
            <CardDescription>
              {t("bookingsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  {t("pendingReminders")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("pendingRemindersDesc")}
                </p>
              </div>
              <Switch
                checked={settings?.bookingReminders ?? true}
                onCheckedChange={() => handleToggle("bookingReminders")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {t("bookingConfirmations")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("bookingConfirmationsDesc")}
                </p>
              </div>
              <Switch
                checked={settings?.bookingConfirmations ?? true}
                onCheckedChange={() => handleToggle("bookingConfirmations")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {t("cancellations")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("cancellationsDesc")}
                </p>
              </div>
              <Switch
                checked={settings?.bookingCancellations ?? true}
                onCheckedChange={() => handleToggle("bookingCancellations")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment emails */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t("payments")}
            </CardTitle>
            <CardDescription>
              {t("paymentsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {t("paymentReceipts")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("paymentReceiptsDesc")}
                </p>
              </div>
              <Switch
                checked={settings?.paymentReceipts ?? true}
                onCheckedChange={() => handleToggle("paymentReceipts")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {t("hostNotifications")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("hostNotificationsDesc")}
                </p>
              </div>
              <Switch
                checked={settings?.hostNotifications ?? true}
                onCheckedChange={() => handleToggle("hostNotifications")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5" />
              {t("reviewsTitle")}
            </CardTitle>
            <CardDescription>
              {t("reviewsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  {t("reviewReminders")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("reviewRemindersDesc")}
                </p>
              </div>
              <Switch
                checked={settings?.reviewReminders ?? true}
                onCheckedChange={() => handleToggle("reviewReminders")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Marketing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              {t("marketing")}
            </CardTitle>
            <CardDescription>
              {t("marketingDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  {t("marketingEmails")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("marketingEmailsDesc")}
                </p>
              </div>
              <Switch
                checked={settings?.marketingEmails ?? false}
                onCheckedChange={() => handleToggle("marketingEmails")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard">{tActions("cancel")}</Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tActions("saveChanges")}
          </Button>
        </div>
      </div>
    </div>
  );
}
