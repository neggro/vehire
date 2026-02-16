"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createBrowserClient } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Clock,
  Car,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  MessageCircle,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Booking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  baseAmount: number;
  platformFee: number;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    city: string;
    images: { url: string }[];
  };
  driver: {
    id: string;
    fullName: string;
    email: string;
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

export default function HostBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await (supabase as any)
        .from("bookings")
        .select(`
          id,
          status,
          startDate,
          endDate,
          totalAmount,
          baseAmount,
          platformFee,
          vehicle:vehicles (
            id,
            make,
            model,
            year,
            city,
            images:vehicle_images (url)
          ),
          driver:users!bookings_driverId_fkey (id, fullName, email)
        `)
        .eq("hostId", user.id)
        .order("startDate", { ascending: true });

      if (data) {
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const supabase = createBrowserClient();
      const { error } = await (supabase as any)
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: "La reserva ha sido actualizada correctamente",
      });

      fetchBookings();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la reserva",
        variant: "destructive",
      });
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const confirmedBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "ACTIVE"
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED"
  );

  const renderBookingCard = (booking: Booking, showActions = false) => (
    <Card key={booking.id} className="overflow-hidden">
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
                  {booking.vehicle.make} {booking.vehicle.model}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {booking.driver?.fullName || "Conductor"}
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
                {format(new Date(booking.endDate), "d MMM", { locale: es })}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tus ganancias</p>
                <p className="font-semibold text-green-600">
                  {formatPrice(booking.baseAmount - booking.platformFee)}
                </p>
              </div>
              {showActions && booking.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              )}
              {showActions && booking.status === "ACTIVE" && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(booking.id, "COMPLETED")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmptyState = (message: string, icon: React.ReactNode) => (
    <Card>
      <CardContent className="py-12 flex flex-col items-center justify-center text-center">
        {icon}
        <p className="text-muted-foreground mt-4">{message}</p>
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
        <h1 className="text-3xl font-bold">Reservas de mis vehículos</h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de reserva
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingBookings.length}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <Car className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{confirmedBookings.length}</p>
                <p className="text-sm text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pastBookings.length}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pendientes
            {pendingBookings.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
                {pendingBookings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">Activas</TabsTrigger>
          <TabsTrigger value="past">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingBookings.length > 0 ? (
            pendingBookings.map((b) => renderBookingCard(b, true))
          ) : (
            renderEmptyState(
              "No tienes reservas pendientes",
              <Clock className="h-12 w-12 text-muted-foreground" />
            )
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6 space-y-4">
          {confirmedBookings.length > 0 ? (
            confirmedBookings.map((b) => renderBookingCard(b, true))
          ) : (
            renderEmptyState(
              "No tienes reservas activas",
              <Car className="h-12 w-12 text-muted-foreground" />
            )
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-4">
          {pastBookings.length > 0 ? (
            pastBookings.map((b) => renderBookingCard(b, false))
          ) : (
            renderEmptyState(
              "No tienes reservas en tu historial",
              <Calendar className="h-12 w-12 text-muted-foreground" />
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
