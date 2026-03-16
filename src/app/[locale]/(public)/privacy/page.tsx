import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/constants";
import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy");
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
              <h2 className="text-xl font-semibold mb-3">{t("section1Title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("section1Intro", { appName: APP_NAME })}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li>{t("info1")}</li>
                <li>{t("info2")}</li>
                <li>{t("info3")}</li>
                <li>{t("info4")}</li>
                <li>{t("info5")}</li>
                <li>{t("info6")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section2Title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("section2Intro")}</p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li>{t("usage1")}</li>
                <li>{t("usage2")}</li>
                <li>{t("usage3")}</li>
                <li>{t("usage4")}</li>
                <li>{t("usage5")}</li>
                <li>{t("usage6")}</li>
                <li>{t("usage7")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section3Title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("section3Intro")}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li>{t("share1")}</li>
                <li>{t("share2")}</li>
                <li>{t("share3")}</li>
                <li>{t("share4")}</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {t("noSell")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section4Title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("section4Text")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section5Title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("section5Intro")}
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li>{t("right1")}</li>
                <li>{t("right2")}</li>
                <li>{t("right3")}</li>
                <li>{t("right4")}</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {t("exerciseRights")}{" "}
                <a href="mailto:privacidad@vehire.uy" className="text-primary hover:underline">
                  privacidad@vehire.uy
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section6Title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("section6Text")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section7Title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("section7Text")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">{t("section8Title")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("section8Text")}{" "}
                <a href="mailto:privacidad@vehire.uy" className="text-primary hover:underline">
                  privacidad@vehire.uy
                </a>{" "}
                o visitá nuestra{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  página de contacto
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
