import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Car,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Pause,
  Play,
  Calendar,
  DollarSign,
} from "lucide-react";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { VEHICLE_STATUS_LABELS } from "@/constants";

// Mock data for demo
const mockVehicles = [
  {
    id: "1",
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    city: "Montevideo",
    status: "ACTIVE",
    basePriceDay: 250000,
    seats: 5,
    transmission: "automatic",
    createdAt: "2024-01-15",
    bookingsCount: 12,
    earnings: 2500000,
  },
  {
    id: "2",
    make: "Volkswagen",
    model: "Polo",
    year: 2021,
    city: "Punta del Este",
    status: "ACTIVE",
    basePriceDay: 180000,
    seats: 5,
    transmission: "manual",
    createdAt: "2024-01-10",
    bookingsCount: 8,
    earnings: 1800000,
  },
  {
    id: "3",
    make: "Chevrolet",
    model: "Cruze",
    year: 2023,
    city: "Montevideo",
    status: "PAUSED",
    basePriceDay: 300000,
    seats: 5,
    transmission: "automatic",
    createdAt: "2024-01-05",
    bookingsCount: 3,
    earnings: 900000,
  },
  {
    id: "4",
    make: "Renault",
    model: "Sandero",
    year: 2020,
    city: "Colonia",
    status: "DRAFT",
    basePriceDay: 150000,
    seats: 5,
    transmission: "manual",
    createdAt: "2024-02-01",
    bookingsCount: 0,
    earnings: 0,
  },
];

export default async function HostVehiclesPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // In production, fetch vehicles from database
  // const { data: vehicles } = await supabase
  //   .from("vehicles")
  //   .select(`
  //     *,
  //     _count: {
  //       bookings: { where: { status: "COMPLETED" } }
  //     }
  //   `)
  //   .eq("hostId", user!.id)
  //   .orderBy("createdAt", { ascending: false });

  const vehicles = mockVehicles;

  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE").length;
  const totalEarnings = vehicles.reduce((sum, v) => sum + v.earnings, 0);

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis vehículos</h1>
          <p className="text-muted-foreground">
            Gestiona tu flota de {vehicles.length} vehículos
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
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Vehículos activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVehicles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles.reduce((sum, v) => sum + v.bookingsCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancias totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalEarnings)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles list */}
      {vehicles.length > 0 ? (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Vehicle image placeholder */}
                  <div className="h-24 w-32 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                    <Car className="h-10 w-10 text-muted-foreground" />
                  </div>

                  {/* Vehicle info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {vehicle.make} {vehicle.model} {vehicle.year}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.city}
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
                            : "outline"
                        }
                      >
                        {VEHICLE_STATUS_LABELS[vehicle.status] || vehicle.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Precio:</span>{" "}
                        <span className="font-medium">
                          {formatPrice(vehicle.basePriceDay)}/día
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reservas:</span>{" "}
                        <span className="font-medium">{vehicle.bookingsCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ganancias:</span>{" "}
                        <span className="font-medium">
                          {formatPrice(vehicle.earnings)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/vehicle/${vehicle.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        Ver
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/host/vehicles/${vehicle.id}/edit`}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {vehicle.status === "ACTIVE" ? (
                          <DropdownMenuItem>
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </DropdownMenuItem>
                        ) : vehicle.status === "PAUSED" ? (
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            Activar
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Disponibilidad
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
            <p className="text-muted-foreground text-center mb-6">
              Comienza a ganar dinero publicando tu primer vehículo
            </p>
            <Button asChild>
              <Link href="/host/vehicles/new">
                <Plus className="mr-2 h-4 w-4" />
                Publicar vehículo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
