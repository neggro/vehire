import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/constants";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("common.footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="container py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-12 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 space-y-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("description")}
            </p>
          </div>

          {/* Explore */}
          <div className="md:col-span-2">
            <h3 className="font-display font-semibold text-sm mb-4">{t("explore")}</h3>
            <nav className="flex flex-col gap-2.5">
              <FooterLink href="/search">{t("searchVehicles")}</FooterLink>
              <FooterLink href="/host">{t("becomeHost")}</FooterLink>
              <FooterLink href="/faq">{t("faq")}</FooterLink>
            </nav>
          </div>

          {/* Support */}
          <div className="md:col-span-2">
            <h3 className="font-display font-semibold text-sm mb-4">{t("support")}</h3>
            <nav className="flex flex-col gap-2.5">
              <FooterLink href="/contact">{t("contact")}</FooterLink>
              <FooterLink href="/help">{t("helpCenter")}</FooterLink>
              <FooterLink href="/insurance">{t("insurance")}</FooterLink>
              <FooterLink href="/safety">{t("safety")}</FooterLink>
            </nav>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h3 className="font-display font-semibold text-sm mb-4">{t("legal")}</h3>
            <nav className="flex flex-col gap-2.5">
              <FooterLink href="/terms">{t("terms")}</FooterLink>
              <FooterLink href="/privacy">{t("privacy")}</FooterLink>
              <FooterLink href="/cookies">{t("cookies")}</FooterLink>
            </nav>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {APP_NAME}. {t("allRightsReserved")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("madeInUruguay")}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
