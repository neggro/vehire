import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/constants";
import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("legal.terms");
  const legal = await getTranslations("legal");
  const nav = await getTranslations("common.nav");

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
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
              <h2 className="text-xl font-semibold mb-3">{t("section1Title")}</h2>
              <p className="text-muted-foreground">
                {t("section1Text", { appName: APP_NAME })}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section2Title")}</h2>
              <p className="text-muted-foreground">
                {t("section2Text", { appName: APP_NAME })}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section3Title")}</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>{t("req1")}</li>
                <li>{t("req2")}</li>
                <li>{t("req3")}</li>
                <li>{t("req4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section4Title")}</h2>
              <p className="text-muted-foreground">
                {t("section4Intro")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>{t("booking1")}</li>
                <li>{t("booking2")}</li>
                <li>{t("booking3")}</li>
                <li>{t("booking4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section5Title")}</h2>
              <div className="text-muted-foreground space-y-2">
                <p><strong>{t("cancel1")}</strong></p>
                <p><strong>{t("cancel2Title")}</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>{t("cancel2a")}</li>
                  <li>{t("cancel2b")}</li>
                  <li>{t("cancel2c")}</li>
                  <li>{t("cancel2d")}</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section6Title")}</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>{t("use1")}</li>
                <li>{t("use2")}</li>
                <li>{t("use3")}</li>
                <li>{t("use4")}</li>
                <li>{t("use5")}</li>
                <li>{t("use6")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section7Title")}</h2>
              <p className="text-muted-foreground">
                {t("section7Intro")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>{t("insurance1")}</li>
                <li>{t("insurance2")}</li>
                <li>{t("insurance3")}</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                {t("insurance4")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section8Title")}</h2>
              <p className="text-muted-foreground">
                {t("section8Intro")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>{t("deposit1")}</li>
                <li>{t("deposit2")}</li>
                <li>{t("deposit3")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section9Title")}</h2>
              <p className="text-muted-foreground">
                {t("section9Text", { appName: APP_NAME })}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section10Title")}</h2>
              <p className="text-muted-foreground">
                {t("section10Intro", { appName: APP_NAME })}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>{t("resp1")}</li>
                <li>{t("resp2")}</li>
                <li>{t("resp3")}</li>
                <li>{t("resp4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section11Title")}</h2>
              <p className="text-muted-foreground">
                {t("section11Text", { appName: APP_NAME })}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section12Title")}</h2>
              <p className="text-muted-foreground">
                {t("section12Text")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section13Title")}</h2>
              <p className="text-muted-foreground">
                {t("section13Text")}
              </p>
              <p className="text-muted-foreground mt-2">
                Email: soporte@vehire.uy<br />
                Teléfono: +598 9999 9999
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
