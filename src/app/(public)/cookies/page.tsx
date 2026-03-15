import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/constants";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>

      <div className="container py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">Política de Cookies</h1>
          <p className="text-muted-foreground mb-8">
            Última actualización: Marzo 2026
          </p>

          <div className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">¿Qué son las cookies?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitás un sitio web. Son ampliamente utilizadas para hacer que los sitios funcionen correctamente, mejorar la experiencia del usuario y proporcionar información a los propietarios del sitio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Cookies que utilizamos</h2>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium text-sm mb-1">Cookies esenciales</h3>
                  <p className="text-sm text-muted-foreground">
                    Necesarias para el funcionamiento básico de la plataforma. Incluyen cookies de autenticación (sesión de Supabase) que te permiten mantener tu sesión iniciada mientras navegás.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium text-sm mb-1">Cookies de preferencias</h3>
                  <p className="text-sm text-muted-foreground">
                    Almacenan tus preferencias como el tema visual (claro/oscuro) y configuraciones de búsqueda para mejorar tu experiencia.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium text-sm mb-1">Cookies de rendimiento</h3>
                  <p className="text-sm text-muted-foreground">
                    Nos ayudan a entender cómo los usuarios interactúan con la plataforma, permitiéndonos mejorar la experiencia. Estos datos son anónimos y agregados.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Cookies de terceros</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Algunos servicios de terceros que utilizamos pueden establecer sus propias cookies:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-disc">
                <li><strong>Supabase:</strong> Cookies de autenticación para gestionar tu sesión</li>
                <li><strong>Mercado Pago:</strong> Cookies necesarias durante el proceso de pago</li>
                <li><strong>PayPal:</strong> Cookies necesarias durante el proceso de pago en USD</li>
                <li><strong>Google Maps:</strong> Cookies para la funcionalidad de mapas y ubicación</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Gestión de cookies</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Podés gestionar las cookies a través de la configuración de tu navegador. La mayoría de los navegadores permiten bloquear o eliminar cookies. Sin embargo, tené en cuenta que si bloqueás las cookies esenciales, es posible que algunas funcionalidades de {APP_NAME} no funcionen correctamente, como mantener tu sesión iniciada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Más información</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Para más información sobre cómo manejamos tus datos, consultá nuestra{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Política de Privacidad
                </Link>
                . Si tenés preguntas, contactanos a{" "}
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
