import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/constants";
import { getTranslations } from "next-intl/server";

export default async function CookiesPage() {
  const t = await getTranslations("legal.cookies");
  const legal = await getTranslations("legal");
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
            {legal("lastUpdated")}
          </p>

          <div className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">{t("whatAreCookies")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("whatAreCookiesText")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("cookiesWeUse")}</h2>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium text-sm mb-1">{t("essentialTitle")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("essentialText")}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium text-sm mb-1">{t("preferencesTitle")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("preferencesText")}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium text-sm mb-1">{t("performanceTitle")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("performanceText")}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("thirdPartyTitle")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("thirdPartyIntro")}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li><strong>Supabase:</strong> {t("supabase").replace("Supabase: ", "")}</li>
                <li><strong>Mercado Pago:</strong> {t("mercadoPago").replace("Mercado Pago: ", "")}</li>
                <li><strong>PayPal:</strong> {t("paypal").replace("PayPal: ", "")}</li>
                <li><strong>Google Maps:</strong> {t("googleMaps").replace("Google Maps: ", "")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("managementTitle")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("managementText", { appName: APP_NAME })}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("moreInfoTitle")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("moreInfoText")}{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  {t("privacyLink")}
                </Link>
                . {t("questionsText")}{" "}
                <a href="mailto:privacidad@vehire.uy" className="text-primary hover:underline">
                  privacidad@vehire.uy
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
