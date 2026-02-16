"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Shield,
  Clock,
  CheckCircle,
  Loader2,
  CreditCard,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { formatPriceFromCents, calculateBookingAmount } from "@/lib/bookings";

// Mock vehicle data
const mockVehicle = {
  id: "1",
  make: "Toyota",
  model: "Corolla",
  year: 2022,
  basePriceDay: 250000,
  weekendPriceDay: 300000,
  estimatedValue: 2500000,
  deliveryAvailable: true,
  deliveryPrice: 50000,
  city: "Montevideo",
  host: {
    id: "host1",
    fullName: "Carlos Rodríguez",
  },
};

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"details" | "payment" | "confirming">("details");

  const startDateParam = searchParams.get("start");
  const endDateParam = searchParams.get("end");
  const deliveryParam = searchParams.get("delivery");

  const startDate = startDateParam ? new Date(startDateParam) : new Date();
  const endDate = endDateParam ? new Date(endDateParam) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const withDelivery = deliveryParam === "true";

  const vehicle = mockVehicle;

  // Calculate booking amounts
  const calculation = calculateBookingAmount({
    basePriceDay: vehicle.basePriceDay,
    weekendPriceDay: vehicle.weekendPriceDay,
    startDate,
    endDate,
    deliveryAvailable: withDelivery,
    deliveryPrice: vehicle.deliveryPrice,
    estimatedValue: vehicle.estimatedValue,
  });

  const handleConfirmBooking = async () => {
    setIsLoading(true);
    setStep("confirming");

    try {
      // In production, create booking in database and get Mercado Pago preference
      // const response = await fetch("/api/bookings", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     vehicleId: vehicle.id,
      //     startDate,
      //     endDate,
      //     withDelivery,
      //   }),
      // });
      // const { preferenceId, initPoint } = await response.json();
      // window.location.href = initPoint;

      // For demo, simulate payment flow
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock success - redirect to confirmation
      router.push(`/booking/success?booking=demo123`);
    } catch (error) {
      setIsLoading(false);
      setStep("details");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container py-4">
          <Link
            href={`/vehicle/${vehicle.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al vehículo
          </Link>
        </div>
      </div>

      <div className="container py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold mb-6">Confirmar reserva</h1>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Main content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Vehicle summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vehículo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="h-20 w-28 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-4xl">🚗</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {vehicle.make} {vehicle.model} {vehicle.year}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.city}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Anfitrión: {vehicle.host.fullName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fechas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Retiro</span>
                      </div>
                      <p className="font-medium">
                        {startDate.toLocaleDateString("es-UY", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Devolución</span>
                      </div>
                      <p className="font-medium">
                        {endDate.toLocaleDateString("es-UY", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery */}
              {withDelivery && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Entrega a domicilio</p>
                        <p className="text-sm text-muted-foreground">
                          Coordina la dirección con el anfitrión
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cancellation policy */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Política de cancelación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Cancelación gratuita</p>
                        <p className="text-sm text-muted-foreground">
                          Cancela gratis hasta 24 horas después de reservar
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Cancelación tardía</p>
                        <p className="text-sm text-muted-foreground">
                          7+ días antes: 90% reembolso | 3-7 días: 70% | 1-3 días: 50%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumen del precio</CardTitle>
                  <CardDescription>
                    {calculation.days} día{calculation.days !== 1 ? "s" : ""} de alquiler
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price breakdown */}
                  <div className="space-y-2 text-sm">
                    {calculation.breakdown.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span>{formatPriceFromCents(item.amount)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPriceFromCents(calculation.totalAmount)}</span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Incluye seguro y asistencia en carretera
                  </p>

                  <Separator />

                  {/* Earnings breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">El anfitrión recibe</span>
                      <span>{formatPriceFromCents(calculation.hostPayout)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tarifa de servicio</span>
                      <span>{formatPriceFromCents(calculation.platformFee)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment method */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Método de pago</p>
                    <div className="flex items-center gap-2 rounded-lg border p-3">
                      <CreditCard className="h-5 w-5" />
                      <span className="text-sm">Mercado Pago</span>
                    </div>
                  </div>

                  {/* Confirm button */}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConfirmBooking}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      `Pagar ${formatPriceFromCents(calculation.totalAmount)}`
                    )}
                  </Button>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>Pago seguro</span>
                    </div>
                  </div>

                  <p className="text-center text-xs text-muted-foreground">
                    Al confirmar, aceptas los{" "}
                    <Link href="/terms" className="underline">
                      términos de servicio
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/30 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
