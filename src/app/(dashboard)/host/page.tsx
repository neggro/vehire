import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Plus,
  Clock,
  Star,
} from "lucide-react";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

// Types for our data
interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  status: string;
  basePriceDay: number;
}

interface BookingData {
  id: string;
  startDate: string;
  endDate: string;
  baseAmount: number;
  platformFee: number;
  status: string;
  vehicle: { make: string; model: string; year: number };
}

export default async function HostDashboardPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get host's vehicles
  const { data: vehiclesData } = await supabase
    .from("vehicles")
    .select("id, make, model, year, city, status, basePriceDay")
    .eq("hostId", user!.id);

  const vehicles = vehiclesData as VehicleData[] | null;

  // Get host's bookings
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select(`
      id,
      startDate,
      endDate,
      baseAmount,
      platformFee,
      status,
      vehicle:vehicles(make, model, year)
    `)
    .eq("hostId", user!.id)
    .order("createdAt", { ascending: false })
    .limit(10);

  const bookings = bookingsData as BookingData[] | null;

  // Calculate stats
  const activeVehicles = vehicles?.filter((v) => v.status === "ACTIVE").length || 0;
  const totalVehicles = vehicles?.length || 0;

  const pendingBookings =
    bookings?.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED")
      .length || 0;

  const completedBookings = bookings?.filter((b) => b.status === "COMPLETED");
  const totalEarnings =
    completedBookings?.reduce((sum, b) => sum + (b.baseAmount - b.platformFee), 0) || 0;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Panel de anfitrión</h1>
          <p className="text-muted-foreground">
            Gestiona tus vehículos y reservas
          </p>
        </div>
        <Button asChild>
          <Link href="/host/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Publicar vehículo
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Vehículos activos
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeVehicles} / {totalVehicles}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancias totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(totalEarnings)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Calificación
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.9</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reservas recientes</CardTitle>
                <CardDescription>
                  Gestiona las reservas de tus vehículos
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/host/bookings">
                  Ver todas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {booking.vehicle?.make} {booking.vehicle?.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.startDate).toLocaleDateString("es-UY")} -{" "}
                        {new Date(booking.endDate).toLocaleDateString("es-UY")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          booking.status === "COMPLETED"
                            ? "success"
                            : booking.status === "CONFIRMED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(booking.baseAmount - booking.platformFee)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aún no tienes reservas
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tus vehículos</CardTitle>
                <CardDescription>
                  Gestiona tu flota de vehículos
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/host/vehicles">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {vehicles && vehicles.length > 0 ? (
              <div className="space-y-4">
                {vehicles.slice(0, 4).map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {vehicle.make} {vehicle.model} {vehicle.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          vehicle.status === "ACTIVE"
                            ? "success"
                            : vehicle.status === "PENDING_APPROVAL"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {vehicle.status === "ACTIVE"
                          ? "Activo"
                          : vehicle.status === "PENDING_APPROVAL"
                          ? "Pendiente"
                          : vehicle.status === "PAUSED"
                          ? "Pausado"
                          : vehicle.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(vehicle.basePriceDay)}/día
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Aún no tienes vehículos publicados
                </p>
                <Button asChild>
                  <Link href="/host/vehicles/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Publicar primer vehículo
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
