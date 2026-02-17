import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { VEHICLE_STATUS_LABELS, TRANSMISSION_LABELS } from "@/constants";
import { VehicleActions } from "@/components/vehicle/vehicle-actions";

interface VehicleWithStats {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  status: string;
  basePriceDay: number;
  seats: number;
  transmission: string;
  createdAt: string;
  images: { url: string }[];
  _count?: {
    bookings: number;
  };
}

export default async function HostVehiclesPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch vehicles from database
  const { data: vehiclesData } = await (supabase as any)
    .from("vehicles")
    .select(`
      id,
      make,
      model,
      year,
      city,
      status,
      basePriceDay,
      seats,
      transmission,
      createdAt,
      images:vehicle_images (url)
    `)
    .eq("hostId", user!.id)
    .order("createdAt", { ascending: false });

  const vehicles = (vehiclesData || []) as VehicleWithStats[];

  // Get booking counts for each vehicle
  const vehicleIds = vehicles.map((v) => v.id);
  const { data: bookingsData } = await (supabase as any)
    .from("bookings")
    .select("vehicleId, status")
    .in("vehicleId", vehicleIds);

  // Calculate stats
  const bookingCounts: Record<string, number> = {};
  (bookingsData || []).forEach((b: any) => {
    bookingCounts[b.vehicleId] = (bookingCounts[b.vehicleId] || 0) + 1;
  });

  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE").length;
  const totalBookings = Object.values(bookingCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis vehículos</h1>
          <p className="text-muted-foreground">
            {vehicles.length > 0
              ? `Gestiona tu flota de ${vehicles.length} vehículo${vehicles.length !== 1 ? "s" : ""}`
              : "Gestiona tus vehículos publicados"}
          </p>
        </div>
        <Button asChild>
          <Link href="/host/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Agregar vehículo
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {vehicles.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Vehículos activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeVehicles}</div>
              <p className="text-xs text-muted-foreground">
                de {vehicles.length} totales
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Reservas totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Borradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehicles.filter((v) => v.status === "DRAFT").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Pendientes de completar
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vehicles list */}
      {vehicles.length > 0 ? (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Vehicle image */}
                  <div className="h-24 w-32 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <img
                        src={vehicle.images[0].url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>

                  {/* Vehicle info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {vehicle.make} {vehicle.model} {vehicle.year}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.city} · {vehicle.seats} asientos · {TRANSMISSION_LABELS[vehicle.transmission] || vehicle.transmission}
                        </p>
                      </div>
                      <Badge
                        variant={
                          vehicle.status === "ACTIVE"
                            ? "success"
                            : vehicle.status === "PAUSED"
                            ? "warning"
                            : vehicle.status === "DRAFT"
                            ? "secondary"
                            : vehicle.status === "PENDING_APPROVAL"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {VEHICLE_STATUS_LABELS[vehicle.status] || vehicle.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Precio:</span>{" "}
                        <span className="font-medium">
                          {formatPrice(vehicle.basePriceDay)}/día
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reservas:</span>{" "}
                        <span className="font-medium">
                          {bookingCounts[vehicle.id] || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Creado:</span>{" "}
                        <span className="font-medium">
                          {new Date(vehicle.createdAt).toLocaleDateString("es-UY")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <VehicleActions
                    vehicleId={vehicle.id}
                    vehicleName={`${vehicle.make} ${vehicle.model} ${vehicle.year}`}
                    status={vehicle.status}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Car className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No tienes vehículos publicados
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Comienza a ganar dinero publicando tu primer vehículo en nuestra plataforma
            </p>
            <Button asChild>
              <Link href="/host/vehicles/new">
                <Plus className="mr-2 h-4 w-4" />
                Publicar mi primer vehículo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
