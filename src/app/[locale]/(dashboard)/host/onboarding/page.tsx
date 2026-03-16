import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/actions/user";
import { prisma } from "@/lib/prisma";
import {
  Car,
  DollarSign,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "Gana dinero extra",
    description: "Genera ingresos con tu vehículo cuando no lo usas",
  },
  {
    icon: Shield,
    title: "Seguro incluido",
    description: "Todos los alquileres incluyen seguro de protección",
  },
  {
    icon: Users,
    title: "Control total",
    description: "Tú decides quién alquila tu vehículo y cuándo",
  },
  {
    icon: Car,
    title: "Sin complicaciones",
    description: "Gestiona todo desde la app de forma sencilla",
  },
];

const steps = [
  { label: "Completa tu perfil", completed: true },
  { label: "Verifica tu identidad (KYC)", isCurrent: true },
  { label: "Publica tu primer vehículo", isFuture: true },
  { label: "¡Empieza a ganar!", isFuture: true },
];

export default async function HostOnboardingPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/host/onboarding");
  }

  // Ensure user exists in our database (handles OAuth users)
  await ensureUserExists();

  // Get user profile with Prisma
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { roles: true, kycStatus: true },
  });

  const isKycVerified = profile?.kycStatus === "VERIFIED";

  return (
    <div className="container max-w-4xl py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Conviértete en anfitrión
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Únete a nuestra comunidad de anfitriones y empieza a generar ingresos
          con tu vehículo
        </p>
      </div>

      {/* Benefits */}
      <div className="grid gap-6 md:grid-cols-2 mb-12">
        {benefits.map((benefit) => (
          <Card key={benefit.title}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Steps to become a host */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pasos para ser anfitrión</CardTitle>
          <CardDescription>
            Completa estos pasos para empezar a publicar tus vehículos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCompleted = step.completed || (index === 1 && isKycVerified);
              const isCurrent = !isCompleted && (step.isCurrent || (index === 1 && !isKycVerified));

              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isCompleted ? "bg-green-50 dark:bg-green-950/30" :
                    isCurrent ? "bg-primary/10" : "bg-muted/50"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span className={isCompleted ? "text-green-700 dark:text-green-400" : ""}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!isKycVerified ? (
          <Button size="lg" asChild>
            <Link href="/dashboard/kyc">
              Verificar mi identidad
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button size="lg" asChild>
            <Link href="/host/vehicles/new">
              Publicar mi primer vehículo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button variant="outline" size="lg" asChild>
          <Link href="/dashboard">
            Volver al dashboard
          </Link>
        </Button>
      </div>

      {/* FAQ or additional info */}
      <div className="mt-12 p-6 rounded-lg bg-muted/30">
        <h3 className="font-semibold mb-4">Preguntas frecuentes</h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">¿Cuánto puedo ganar?</p>
            <p>Los anfitriones ganan en promedio $10,000-$30,000 al mes dependiendo del vehículo y la disponibilidad.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">¿Qué necesito para empezar?</p>
            <p>Necesitas un vehículo en buen estado, licencia de conducir vigente, y completar la verificación de identidad.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">¿Cómo funciona el seguro?</p>
            <p>Todos los alquileres incluyen seguro de protección que cubre daños y robos durante el período de alquiler.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
