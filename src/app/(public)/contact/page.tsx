import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";

export default function ContactPage() {
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
          <h1 className="text-3xl font-bold mb-2">Contacto</h1>
          <p className="text-muted-foreground mb-8">
            Estamos para ayudarte. Contactanos por cualquiera de estos medios.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5 text-primary" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Para consultas generales y soporte
                </p>
                <a
                  href="mailto:soporte@vehire.uy"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  soporte@vehire.uy
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-5 w-5 text-primary" />
                  Teléfono
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Lunes a viernes, 9:00 a 18:00
                </p>
                <a
                  href="tel:+59821234567"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  +598 2 123 4567
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-primary" />
                  Oficina
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Montevideo, Uruguay
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-primary" />
                  Horario de atención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Lunes a viernes: 9:00 - 18:00
                  <br />
                  Sábados: 10:00 - 14:00
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 rounded-lg border bg-background p-6">
            <h2 className="text-lg font-semibold mb-2">
              ¿Tenés una emergencia durante un alquiler?
            </h2>
            <p className="text-sm text-muted-foreground">
              Si tenés un problema urgente durante un alquiler activo, usá el
              sistema de mensajes dentro de la plataforma para contactar
              directamente al anfitrión o reportá un incidente desde la página de
              tu reserva. Nuestro equipo de soporte priorizará tu caso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
