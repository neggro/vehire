import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { AvailabilityCalendar } from "./availability-calendar";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VehicleAvailabilityPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/host/vehicles");
  }

  // Fetch vehicle with availability
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      availabilities: {
        where: {
          date: {
            gte: new Date(), // Only future dates
          },
        },
        orderBy: { date: "asc" },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  // Check ownership
  if (vehicle.hostId !== user.id) {
    redirect("/host/vehicles");
  }

  // Transform availability data for the calendar
  const availabilityMap = new Map(
    vehicle.availabilities.map((a) => [
      a.date.toISOString().split("T")[0],
      {
        isAvailable: a.isAvailable,
        priceOverride: a.priceOverride,
      },
    ])
  );

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/host/vehicles"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mis vehículos
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Disponibilidad</h1>
            <p className="text-muted-foreground">
              {vehicle.make} {vehicle.model} {vehicle.year} · {vehicle.city}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Precio base</p>
            <p className="text-2xl font-bold">
              ${(vehicle.basePriceDay / 100).toLocaleString()}/día
            </p>
          </div>
        </div>
      </div>

      {/* Info card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendario de disponibilidad
          </CardTitle>
          <CardDescription>
            Marca los días como disponibles o no disponibles. Puedes establecer
            precios personalizados para fechas específicas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-primary" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-muted" />
              <span>No disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-orange-500" />
              <span>Precio personalizado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border-2 border-red-500" />
              <span>Reservado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar component */}
      <AvailabilityCalendar
        vehicleId={vehicle.id}
        basePrice={vehicle.basePriceDay}
        availabilityMap={Object.fromEntries(availabilityMap)}
      />
    </div>
  );
}
