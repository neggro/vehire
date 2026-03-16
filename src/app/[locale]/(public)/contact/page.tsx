import { Link } from "@/i18n/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const nav = await getTranslations("common.nav");

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {nav("backToHome")}
          </Link>
        </div>
      </div>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground mb-8">
            {t("subtitle")}
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5 text-primary" />
                  {t("email")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {t("emailDesc")}
                </p>
                <a
                  href="mailto:soporte@vehire.uy"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  soporte@vehire.uy
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-5 w-5 text-primary" />
                  {t("phone")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {t("phoneHours")}
                </p>
                <a
                  href="tel:+59821234567"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  +598 2 123 4567
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t("office")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("officeLocation")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-primary" />
                  {t("businessHours")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("weekdayHours")}
                  <br />
                  {t("saturdayHours")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 rounded-lg border bg-background p-6">
            <h2 className="text-lg font-semibold mb-2">
              {t("emergencyTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("emergencyText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
