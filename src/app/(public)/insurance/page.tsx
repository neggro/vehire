import Link from "next/link";
import { ArrowLeft, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";

export default function InsurancePage() {
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
          <h1 className="text-3xl font-bold mb-2">Seguros y Protección</h1>
          <p className="text-muted-foreground mb-8">
            Tu seguridad y la de tu vehículo son nuestra prioridad
          </p>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Protección para conductores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Vehículos verificados</p>
                    <p className="text-sm text-muted-foreground">
                      Todos los vehículos pasan por un proceso de aprobación antes de ser publicados en la plataforma.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Anfitriones verificados</p>
                    <p className="text-sm text-muted-foreground">
                      Los anfitriones completan un proceso de verificación de identidad (KYC) para garantizar la confiabilidad.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Depósito de seguridad reembolsable</p>
                    <p className="text-sm text-muted-foreground">
                      Se retiene un depósito que se devuelve íntegramente al finalizar el alquiler sin incidentes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Protección para anfitriones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Conductores verificados</p>
                    <p className="text-sm text-muted-foreground">
                      Solo usuarios con identidad y licencia verificada pueden reservar tu vehículo.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Depósito de seguridad</p>
                    <p className="text-sm text-muted-foreground">
                      El depósito se retiene hasta confirmar que el vehículo fue devuelto en las mismas condiciones.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Sistema de incidentes</p>
                    <p className="text-sm text-muted-foreground">
                      Podés reportar cualquier daño o problema con fotos y descripción. Nuestro equipo mediará en la resolución.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Seguro del vehículo
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Cada vehículo publicado en {APP_NAME} debe contar con su propio seguro vigente contratado por el propietario. La plataforma no provee cobertura de seguro vehicular. Verificá con tu aseguradora que tu póliza cubra el uso compartido del vehículo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
