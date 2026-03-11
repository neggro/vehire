"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Clock,
  Car,
  User,
  Mail,
  Phone,
  CreditCard,
  MessageSquare,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface BookingDetails {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  baseAmount: number;
  platformFee: number;
  depositAmount: number;
  deliveryFee: number | null;
  pickupLocation: string | null;
  returnLocation: string | null;
  pickupAt: string | null;
  returnAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    city: string;
    state: string | null;
    plateNumber: string;
    transmission: string;
    fuelType: string;
    seats: number;
    images: { url: string }[];
  };
  driver: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  host: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  payment: {
    id: string;
    status: string;
    mpStatus: string | null;
    amount: number;
    platformFee: number;
    hostPayout: number;
    depositAmount: number;
    paidAt: string | null;
  } | null;
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  ACTIVE: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  HELD: "En custodia",
  RELEASED: "Liberado",
  REFUNDED: "Reembolsado",
  FAILED: "Fallido",
};

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [userRole, setUserRole] = useState<"driver" | "host" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const bookingId = params.id as string;

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Reserva no encontrada");
        } else if (response.status === 403) {
          setError("No tienes acceso a esta reserva");
        } else {
          setError("Error al cargar la reserva");
        }
        return;
      }
      const data = await response.json();
      setBooking(data.booking);
      setUserRole(data.userRole);
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Error al cargar la reserva");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Error updating booking");

      setBooking({ ...booking, status: newStatus });
    } catch (err) {
      console.error("Error updating booking:", err);
      alert("Error al actualizar la reserva");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">{error || "Reserva no encontrada"}</p>
            <Button onClick={() => router.push("/dashboard/bookings")}>
              Volver a mis reservas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const totalDays = differenceInDays(endDate, startDate) + 1;

  const otherParty = userRole === "driver" ? booking.host : booking.driver;
  const otherPartyLabel = userRole === "driver" ? "Anfitrión" : "Conductor";

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/bookings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mis reservas
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Detalles de la reserva</h1>
            <p className="text-muted-foreground">ID: {booking.id}</p>
          </div>
          <Badge className={statusColors[booking.status]}>
            {statusLabels[booking.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-32 h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {booking.vehicle.images?.[0]?.url ? (
                    <img
                      src={booking.vehicle.images[0].url}
                      alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/vehicle/${booking.vehicle.id}`}
                    className="font-semibold hover:text-primary"
                  >
                    {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.year})
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {booking.vehicle.color} • {booking.vehicle.plateNumber}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{booking.vehicle.transmission}</span>
                    <span>•</span>
                    <span>{booking.vehicle.fuelType}</span>
                    <span>•</span>
                    <span>{booking.vehicle.seats} asientos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates and Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fechas y ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {format(startDate, "d 'de' MMMM", { locale: es })} -{" "}
                    {format(endDate, "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <p className="text-sm text-muted-foreground">{totalDays} días</p>
                </div>
              </div>
              {booking.pickupLocation && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Entrega</p>
                    <p className="font-medium">{booking.pickupLocation}</p>
                  </div>
                </div>
              )}
              {booking.returnLocation && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Devolución</p>
                    <p className="font-medium">{booking.returnLocation}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{booking.vehicle.city}</p>
                  {booking.vehicle.state && (
                    <p className="text-sm text-muted-foreground">{booking.vehicle.state}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Party Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{otherPartyLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  {otherParty.avatarUrl ? (
                    <img
                      src={otherParty.avatarUrl}
                      alt={otherParty.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{otherParty.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{otherParty.email}</span>
              </div>
              {otherParty.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{otherParty.phone}</span>
                </div>
              )}
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href={`/messages?user=${otherParty.id}`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar mensaje
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Review */}
          {booking.review && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reseña</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= booking.review!.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                {booking.review.comment && (
                  <p className="text-muted-foreground">{booking.review.comment}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(booking.review.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Info */}
          {booking.status === "CANCELLED" && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Reserva cancelada</p>
                    {booking.cancellationReason && (
                      <p className="text-sm text-muted-foreground">{booking.cancellationReason}</p>
                    )}
                    {booking.cancelledAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(booking.cancelledAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen de pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatPrice(booking.baseAmount / totalDays)} x {totalDays} días
                </span>
                <span>{formatPrice(booking.baseAmount)}</span>
              </div>
              {booking.deliveryFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entrega</span>
                  <span>{formatPrice(booking.deliveryFee)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Depósito de garantía</span>
                <span>{formatPrice(booking.depositAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(booking.totalAmount)}</span>
              </div>

              {/* Payment Status */}
              {booking.payment && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Estado del pago:</span>
                    <Badge variant="outline">{paymentStatusLabels[booking.payment.status]}</Badge>
                  </div>
                  {booking.payment.paidAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Pagado el{" "}
                      {format(new Date(booking.payment.paidAt), "d 'de' MMMM 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Host Actions */}
              {userRole === "host" && booking.status === "PENDING" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleStatusUpdate("CONFIRMED")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Aprobar reserva
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleStatusUpdate("CANCELLED")}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar reserva
                  </Button>
                </>
              )}

              {/* Host Actions - Start Rental */}
              {userRole === "host" && booking.status === "CONFIRMED" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate("ACTIVE")}
                  disabled={isUpdating}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Iniciar alquiler
                </Button>
              )}

              {/* Host Actions - Complete Rental */}
              {userRole === "host" && booking.status === "ACTIVE" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate("COMPLETED")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar alquiler
                </Button>
              )}

              {/* Leave Review */}
              {booking.status === "COMPLETED" && !booking.review && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/review/new?booking=${booking.id}`}>
                    <Star className="h-4 w-4 mr-2" />
                    Dejar reseña
                  </Link>
                </Button>
              )}

              {/* Cancel Button */}
              {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                <Button
                  variant="outline"
                  className="w-full text-destructive"
                  onClick={() => {
                    if (confirm("¿Estás seguro de que quieres cancelar esta reserva?")) {
                      handleStatusUpdate("CANCELLED");
                    }
                  }}
                  disabled={isUpdating}
                >
                  Cancelar reserva
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Created At */}
          <p className="text-xs text-muted-foreground text-center">
            Reserva creada el{" "}
            {format(new Date(booking.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
              locale: es,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
