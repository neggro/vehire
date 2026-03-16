import { Link } from "@/i18n/navigation";
import { ArrowLeft, Search, Car, Shield, CreditCard, MessageCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { getTranslations } from "next-intl/server";

export default async function HelpPage() {
  const t = await getTranslations("help");
  const nav = await getTranslations("common.nav");

  const helpCategories = [
    {
      title: t("searchAndBook"),
      icon: Search,
      description: t("searchAndBookDesc"),
      links: [
        { label: t("howToSearch"), href: "/search" },
        { label: t("frequentQuestions"), href: "/faq" },
      ],
    },
    {
      title: t("publishVehicle"),
      icon: Car,
      description: t("publishVehicleDesc"),
      links: [
        { label: t("howToBeHost"), href: "/host" },
        { label: t("frequentQuestions"), href: "/faq" },
      ],
    },
    {
      title: t("securityAndVerification"),
      icon: Shield,
      description: t("securityAndVerificationDesc"),
      links: [
        { label: t("verifyIdentity"), href: "/dashboard/kyc" },
        { label: t("insuranceInfo"), href: "/insurance" },
        { label: t("platformSafety"), href: "/safety" },
      ],
    },
    {
      title: t("paymentsAndBilling"),
      icon: CreditCard,
      description: t("paymentsAndBillingDesc"),
      links: [
        { label: t("frequentQuestions"), href: "/faq" },
      ],
    },
    {
      title: t("yourAccount"),
      icon: User,
      description: t("yourAccountDesc"),
      links: [
        { label: t("accountSettings"), href: "/dashboard/settings" },
      ],
    },
    {
      title: t("contactSupport"),
      icon: MessageCircle,
      description: t("contactSupportDesc"),
      links: [
        { label: t("contactLink"), href: "/contact" },
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
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground mb-8">
            {t("subtitle", { appName: APP_NAME })}
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {helpCategories.map((cat) => (
              <Card key={cat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <cat.icon className="h-5 w-5 text-primary" />
                    {cat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {cat.description}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {cat.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-sm text-primary hover:underline"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
