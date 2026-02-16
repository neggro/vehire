import Link from "next/link";
import { Car, Facebook, Instagram, Twitter } from "lucide-react";
import { APP_NAME } from "@/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              La mejor plataforma para alquilar vehículos en Uruguay.
              Encuentra el auto perfecto para tu próximo viaje.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://facebook.com"
                className="text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com"
                className="text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                className="text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Explorar</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/search"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Buscar vehículos
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cómo funciona
              </Link>
              <Link
                href="/host"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Conviértete en anfitrión
              </Link>
              <Link
                href="/faq"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Preguntas frecuentes
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Soporte</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Contacto
              </Link>
              <Link
                href="/help"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Centro de ayuda
              </Link>
              <Link
                href="/insurance"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Seguros
              </Link>
              <Link
                href="/safety"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Seguridad
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Términos de servicio
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Política de privacidad
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Política de cookies
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} {APP_NAME}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
