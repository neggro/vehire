import Link from "next/link";
import { ArrowLeft, ShieldCheck, Eye, Lock, UserCheck, AlertCircle } from "lucide-react";
import { APP_NAME } from "@/constants";

const safetyItems = [
  {
    icon: UserCheck,
    title: "Verificación de identidad",
    description:
      "Todos los usuarios deben completar un proceso de verificación de identidad (KYC) con documento oficial, licencia de conducir y selfie antes de poder alquilar o publicar vehículos.",
  },
  {
    icon: ShieldCheck,
    title: "Aprobación de vehículos",
    description:
      "Cada vehículo publicado es revisado por nuestro equipo antes de aparecer en la plataforma. Verificamos que la información sea correcta y que las fotos correspondan al vehículo.",
  },
  {
    icon: Eye,
    title: "Sistema de reseñas",
    description:
      "Después de cada alquiler, tanto conductores como anfitriones pueden dejar una reseña. Esto genera un historial de confianza que ayuda a toda la comunidad.",
  },
  {
    icon: Lock,
    title: "Pagos seguros",
    description:
      "Todos los pagos se procesan a través de plataformas certificadas (Mercado Pago y PayPal). Nunca compartimos datos financieros entre usuarios. El dinero se retiene hasta que el alquiler se completa exitosamente.",
  },
  {
    icon: AlertCircle,
    title: "Reporte de incidentes",
    description:
      "Si algo sale mal durante un alquiler, nuestro sistema de incidentes permite documentar el problema con fotos y descripciones. Nuestro equipo media entre las partes para llegar a una resolución justa.",
  },
];

export default function SafetyPage() {
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
          <h1 className="text-3xl font-bold mb-2">Seguridad</h1>
          <p className="text-muted-foreground mb-8">
            Cómo protegemos a nuestra comunidad en {APP_NAME}
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
            <h2 className="text-lg font-semibold mb-2">Consejos de seguridad</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-medium">1.</span>
                Siempre comunicarte a través de la plataforma. No compartas datos personales fuera del sistema de mensajes.
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">2.</span>
                Revisá el vehículo junto al anfitrión al momento de la entrega y devolución. Tomá fotos del estado del vehículo.
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">3.</span>
                Verificá que el vehículo coincida con las fotos y descripción de la publicación.
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">4.</span>
                Nunca realices pagos fuera de la plataforma. Todos los pagos deben procesarse a través de {APP_NAME}.
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">5.</span>
                Reportá cualquier comportamiento sospechoso o problema a nuestro equipo de soporte.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
