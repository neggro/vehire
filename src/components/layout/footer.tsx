import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="container py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-12 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 space-y-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              La mejor plataforma para alquilar vehículos entre particulares en Uruguay.
            </p>
          </div>

          {/* Explore */}
          <div className="md:col-span-2">
            <h3 className="font-display font-semibold text-sm mb-4">Explorar</h3>
            <nav className="flex flex-col gap-2.5">
              <FooterLink href="/search">Buscar vehículos</FooterLink>
              <FooterLink href="/host">Ser anfitrión</FooterLink>
              <FooterLink href="/faq">Preguntas frecuentes</FooterLink>
            </nav>
          </div>

          {/* Support */}
          <div className="md:col-span-2">
            <h3 className="font-display font-semibold text-sm mb-4">Soporte</h3>
            <nav className="flex flex-col gap-2.5">
              <FooterLink href="/contact">Contacto</FooterLink>
              <FooterLink href="/help">Centro de ayuda</FooterLink>
              <FooterLink href="/insurance">Seguros</FooterLink>
              <FooterLink href="/safety">Seguridad</FooterLink>
            </nav>
          </div>

          {/* Legal */}
          <div className="md:col-span-2">
            <h3 className="font-display font-semibold text-sm mb-4">Legal</h3>
            <nav className="flex flex-col gap-2.5">
              <FooterLink href="/terms">Términos de servicio</FooterLink>
              <FooterLink href="/privacy">Privacidad</FooterLink>
              <FooterLink href="/cookies">Cookies</FooterLink>
            </nav>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {APP_NAME}. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Hecho con cuidado en Uruguay
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
