"use client";

import { Suspense, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, ArrowRight, Loader2, AlertCircle, Car, Clock, MapPin } from "lucide-react";
import { BookingSuccessPageSkeleton } from "@/components/skeletons";
import { formatPriceFromCents } from "@/lib/bookings";

interface BookingDetails {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    city: string;
    state: string | null;
    images: { url: string }[];
  };
  host: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  payment: {
    status: string;
    mpStatus: string | null;
  } | null;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("booking");
  const paymentStatus = searchParams.get("status");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPending = paymentStatus === "pending";

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/bookings/${bookingId}/details`);
        if (!response.ok) {
          throw new Error("Error al cargar la reserva");
        }
        const data = await response.json();
        setBooking(data.booking);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError("No se pudieron cargar los detalles de la reserva");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleGoToDashboard = () => {
    setIsRedirecting(true);
    router.push("/dashboard/bookings");
  };

  if (isLoading) {
    return <BookingSuccessPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isPending ? "bg-yellow-100" : "bg-green-100"
          }`}>
            {isPending ? (
              <Clock className="h-8 w-8 text-yellow-600" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isPending ? "Pago pendiente" : "¡Reserva confirmada!"}
          </CardTitle>
          <CardDescription>
            {isPending
              ? "Tu pago está siendo procesado"
              : "Tu reserva ha sido procesada exitosamente"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {booking && (
            <>
              {/* Vehicle summary */}
              <div className="flex gap-4 rounded-lg border p-4">
                <div className="h-16 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {booking.vehicle.images?.[0]?.url ? (
                    <img
                      src={booking.vehicle.images[0].url}
                      alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Car className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    {booking.vehicle.city}{booking.vehicle.state ? `, ${booking.vehicle.state}` : ""}
                  </p>
                </div>
              </div>

              {/* Booking details */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fechas</span>
                  <div className="flex items-center gap-1 font-medium text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(booking.startDate).toLocaleDateString("es-UY", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {new Date(booking.endDate).toLocaleDateString("es-UY", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Anfitrión</span>
                  <span className="font-medium text-sm">{booking.host.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total pagado</span>
                  <span className="font-semibold">{formatPriceFromCents(booking.totalAmount)}</span>
                </div>
              </div>
            </>
          )}

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
    <Suspense fallback={<BookingSuccessPageSkeleton />}>
      <SuccessContent />
    </Suspense>
  );
}
