import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/constants";
import { getTranslations } from "next-intl/server";

export default async function FAQPage() {
  const t = await getTranslations("faq");
  const nav = await getTranslations("common.nav");

  const faqs = [
    {
      category: t("drivers.title"),
      questions: [
        { q: t("drivers.q1"), a: t("drivers.a1") },
        { q: t("drivers.q2"), a: t("drivers.a2") },
        { q: t("drivers.q3"), a: t("drivers.a3") },
        { q: t("drivers.q4"), a: t("drivers.a4") },
        { q: t("drivers.q5"), a: t("drivers.a5") },
        { q: t("drivers.q6"), a: t("drivers.a6") },
      ],
    },
    {
      category: t("hosts.title"),
      questions: [
        { q: t("hosts.q1"), a: t("hosts.a1") },
        { q: t("hosts.q2"), a: t("hosts.a2", { appName: APP_NAME }) },
        { q: t("hosts.q3"), a: t("hosts.a3") },
        { q: t("hosts.q4"), a: t("hosts.a4") },
        { q: t("hosts.q5"), a: t("hosts.a5") },
      ],
    },
    {
      category: t("general.title"),
      questions: [
        { q: t("general.q1"), a: t("general.a1") },
        { q: t("general.q2"), a: t("general.a2") },
        { q: t("general.q3"), a: t("general.a3") },
      ],
    },
  ];

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
            {t("subtitle", { appName: APP_NAME })}
          </p>

          <div className="space-y-10">
            {faqs.map((section) => (
              <section key={section.category}>
                <h2 className="text-xl font-semibold mb-4 text-primary">
                  {section.category}
                </h2>
                <div className="space-y-4">
                  {section.questions.map((faq, i) => (
                    <details
                      key={i}
                      className="group rounded-lg border bg-background p-4"
                    >
                      <summary className="cursor-pointer font-medium text-sm list-none flex items-center justify-between">
                        {faq.q}
                        <span className="ml-2 text-muted-foreground group-open:rotate-180 transition-transform">
                          ▾
                        </span>
                      </summary>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
