"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertCircle,
  Car,
} from "lucide-react";
import { formatPriceFromCents, calculateBookingAmount, type BookingCalculation } from "@/lib/bookings";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  state: string | null;
  basePriceDay: number;
  weekendPriceDay: number | null;
  estimatedValue: number | null;
  deliveryAvailable: boolean;
  deliveryPrice: number | null;
  address: string | null;
  host: {
    id: string;
    fullName: string;
  };
  images: { url: string }[];
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);

  // Get vehicle ID from URL - the [id] param is the vehicle ID
  const pathnameParts = window.location.pathname.split("/");
  const vehicleId = pathnameParts[pathnameParts.length - 1];

  const startDateParam = searchParams.get("start");
  const endDateParam = searchParams.get("end");
  const deliveryParam = searchParams.get("delivery");
  const errorParam = searchParams.get("error");

  const [startDate, setStartDate] = useState<Date>(() => {
    if (startDateParam) return new Date(startDateParam);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    if (endDateParam) return new Date(endDateParam);
    const date = new Date();
    date.setDate(date.getDate() + 4);
    date.setHours(10, 0, 0, 0);
    return date;
  });
  const [withDelivery, setWithDelivery] = useState(deliveryParam === "true");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Show error from payment failure
  useEffect(() => {
    if (errorParam === "payment_failed") {
      toast({
        title: "Pago fallido",
        description: "El pago no pudo ser procesado. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    }
  }, [errorParam, toast]);

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Vehículo no encontrado");
          } else {
            setError("Error al cargar el vehículo");
          }
          return;
        }
        const data = await response.json();
        setVehicle(data.vehicle);
      } catch {
        setError("Error al cargar el vehículo");
      } finally {
        setIsFetching(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  // Calculate booking amounts
  const [calculation, setCalculation] = useState<BookingCalculation | null>(null);

  useEffect(() => {
    if (!vehicle) return;

    try {
      const result = calculateBookingAmount({
        basePriceDay: vehicle.basePriceDay,
        weekendPriceDay: vehicle.weekendPriceDay,
        startDate,
        endDate,
        deliveryAvailable: withDelivery,
        deliveryPrice: vehicle.deliveryPrice,
        estimatedValue: vehicle.estimatedValue,
      });
      setCalculation(result);
      setError(null);
    } catch {
      setError("Error al calcular el precio");
    }
  }, [startDate, endDate, withDelivery, vehicle]);

  const handleConfirmBooking = async () => {
    if (!vehicle || !calculation) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          withDelivery,
          deliveryAddress: withDelivery ? deliveryAddress : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la reserva");
      }

      // Redirect to Mercado Pago
      window.location.href = data.initPoint;
    } catch (err) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al crear la reserva",
        variant: "destructive",
      });
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vehículo no encontrado</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/search">Buscar vehículos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                    <div className="h-20 w-28 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {vehicle.images?.[0]?.url ? (
                        <img
                          src={vehicle.images[0].url}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {vehicle.make} {vehicle.model} {vehicle.year}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ""}
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
                    {calculation?.days || 0} día{calculation?.days !== 1 ? "s" : ""} de alquiler
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price breakdown */}
                  {calculation && (
                    <div className="space-y-2 text-sm">
                      {calculation.breakdown.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span>{formatPriceFromCents(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {calculation && (
                    <>
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
                    </>
                  )}

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
                    disabled={isLoading || !calculation}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : calculation ? (
                      `Pagar ${formatPriceFromCents(calculation.totalAmount)}`
                    ) : (
                      "Cargando..."
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
