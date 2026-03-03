"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Clock,
  Car,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Booking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    city: string;
    images: { url: string }[];
  };
  host: {
    fullName: string;
  };
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

export default function DriverBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings/driver");
      if (!response.ok) throw new Error("Error fetching bookings");
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const now = new Date();

  const upcomingBookings = bookings.filter(
    (b) => (b.status === "PENDING" || b.status === "CONFIRMED") && new Date(b.startDate) > now
  );

  const activeBookings = bookings.filter((b) => b.status === "ACTIVE");

  const pastBookings = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED" || new Date(b.endDate) < now
  );

  const renderBookingCard = (booking: Booking) => (
    <Link key={booking.id} href={`/booking/${booking.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Vehicle Image */}
            <div className="w-24 h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
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

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold truncate">
                    {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.year})
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Anfitrión: {booking.host?.fullName || "N/A"}
                  </p>
                </div>
                <Badge className={statusColors[booking.status]}>
                  {statusLabels[booking.status]}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(booking.startDate), "d MMM", { locale: es })} -{" "}
                  {format(new Date(booking.endDate), "d MMM, yyyy", { locale: es })}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {booking.vehicle.city}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="font-semibold text-primary">
                  {formatPrice(booking.totalAmount)}
                </p>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const renderEmptyState = (message: string) => (
    <Card>
      <CardContent className="py-12 flex flex-col items-center justify-center text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{message}</p>
        <Button className="mt-4" asChild>
          <Link href="/search">Buscar vehículos</Link>
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mis reservas</h1>
        <p className="text-muted-foreground">
          Gestiona tus reservas de vehículos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="relative">
            Próximas
            {upcomingBookings.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {upcomingBookings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="relative">
            En curso
            {activeBookings.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                {activeBookings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map(renderBookingCard)
          ) : (
            renderEmptyState("No tienes reservas próximas")
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6 space-y-4">
          {activeBookings.length > 0 ? (
            activeBookings.map(renderBookingCard)
          ) : (
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No tienes alquileres en curso actualmente
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-4">
          {pastBookings.length > 0 ? (
            pastBookings.map(renderBookingCard)
          ) : (
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No tienes reservas en tu historial
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
