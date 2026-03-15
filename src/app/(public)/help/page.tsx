import Link from "next/link";
import { ArrowLeft, Search, Car, Shield, CreditCard, MessageCircle, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";

const helpCategories = [
  {
    title: "Buscar y reservar",
    icon: Search,
    description: "Cómo buscar vehículos, hacer reservas y gestionar tus viajes",
    links: [
      { label: "Cómo buscar vehículos", href: "/search" },
      { label: "Preguntas frecuentes", href: "/faq" },
    ],
  },
  {
    title: "Publicar tu vehículo",
    icon: Car,
    description: "Todo sobre ser anfitrión y publicar tu vehículo en la plataforma",
    links: [
      { label: "Cómo ser anfitrión", href: "/host" },
      { label: "Preguntas frecuentes", href: "/faq" },
    ],
  },
  {
    title: "Seguridad y verificación",
    icon: Shield,
    description: "Verificación de identidad, seguros y protección durante el alquiler",
    links: [
      { label: "Verificar tu identidad", href: "/dashboard/kyc" },
      { label: "Información de seguros", href: "/insurance" },
      { label: "Seguridad en la plataforma", href: "/safety" },
    ],
  },
  {
    title: "Pagos y facturación",
    icon: CreditCard,
    description: "Métodos de pago, comisiones, reembolsos y facturación",
    links: [
      { label: "Preguntas frecuentes", href: "/faq" },
    ],
  },
  {
    title: "Tu cuenta",
    icon: User,
    description: "Configuración de cuenta, perfil y preferencias",
    links: [
      { label: "Configuración", href: "/dashboard/settings" },
    ],
  },
  {
    title: "Contactar soporte",
    icon: MessageCircle,
    description: "No encontrás lo que buscás? Contactanos directamente",
    links: [
      { label: "Contacto", href: "/contact" },
    ],
  },
];

export default function HelpPage() {
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
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Centro de Ayuda</h1>
          <p className="text-muted-foreground mb-8">
            Encontrá respuestas y soluciones para usar {APP_NAME}
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
