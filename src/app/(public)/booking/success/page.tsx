"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { APP_NAME } from "@/constants";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("booking");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Mock booking data
  const booking = {
    id: bookingId || "demo123",
    vehicle: {
      make: "Toyota",
      model: "Corolla",
      year: 2022,
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    city: "Montevideo",
    host: {
      fullName: "Carlos Rodríguez",
    },
  };

  const handleGoToDashboard = () => {
    setIsRedirecting(true);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">¡Reserva confirmada!</CardTitle>
          <CardDescription>
            Tu reserva ha sido procesada exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking details */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vehículo</span>
              <span className="font-medium">
                {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fechas</span>
              <span className="font-medium">
                {booking.startDate.toLocaleDateString("es-UY", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                -{" "}
                {booking.endDate.toLocaleDateString("es-UY", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ubicación</span>
              <span className="font-medium">{booking.city}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Anfitrión</span>
              <span className="font-medium">{booking.host.fullName}</span>
            </div>
          </div>

          {/* Next steps */}
          <div className="space-y-3">
            <h3 className="font-medium">Próximos pasos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  1
                </span>
                Recibirás un email de confirmación con los detalles
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  2
                </span>
                El anfitrión se pondrá en contacto para coordinar la entrega
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  3
                </span>
                Presenta tu documento y licencia al momento de retirar
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleGoToDashboard} disabled={isRedirecting}>
              {isRedirecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Ver mis reservas
            </Button>
            <Button variant="outline" asChild>
              <Link href="/search">Buscar más vehículos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/30 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
