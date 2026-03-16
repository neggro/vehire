import { Link } from "@/i18n/navigation";
import { ArrowLeft, ShieldCheck, Eye, Lock, UserCheck, AlertCircle } from "lucide-react";
import { APP_NAME } from "@/constants";
import { getTranslations } from "next-intl/server";

export default async function SafetyPage() {
  const t = await getTranslations("legal.safety");
  const nav = await getTranslations("common.nav");

  const safetyItems = [
    {
      icon: UserCheck,
      title: t("identityVerification"),
      description: t("identityVerificationDesc"),
    },
    {
      icon: ShieldCheck,
      title: t("vehicleApproval"),
      description: t("vehicleApprovalDesc"),
    },
    {
      icon: Eye,
      title: t("reviewSystem"),
      description: t("reviewSystemDesc"),
    },
    {
      icon: Lock,
      title: t("securePayments"),
      description: t("securePaymentsDesc"),
    },
    {
      icon: AlertCircle,
      title: t("incidentReport"),
      description: t("incidentReportDesc"),
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

          <div className="space-y-6">
            {safetyItems.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-lg border bg-background p-5"
              >
                <item.icon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold mb-1">{item.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border bg-background p-6">
            <h2 className="text-lg font-semibold mb-2">{t("tipsTitle")}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-medium">1.</span>
                {t("tip1")}
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">2.</span>
                {t("tip2")}
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">3.</span>
                {t("tip3")}
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">4.</span>
                {t("tip4", { appName: APP_NAME })}
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">5.</span>
                {t("tip5")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
