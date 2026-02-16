"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface AvailabilityDay {
  date: Date;
  isAvailable: boolean;
  priceOverride?: number;
}

export default function VehicleAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<any>(null);
  const [availabilities, setAvailabilities] = useState<AvailabilityDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch vehicle and availability data
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createBrowserClient();

        // Get vehicle
        const { data: vehicleData, error: vehicleError } = await (supabase as any)
          .from("vehicles")
          .select("*")
          .eq("id", vehicleId)
          .single();

        if (vehicleError || !vehicleData) {
          toast({
            title: "Error",
            description: "Vehículo no encontrado",
            variant: "destructive",
          });
          router.push("/host/vehicles");
          return;
        }

        setVehicle(vehicleData);

        // Get availabilities for the next 3 months
        const startDate = format(new Date(), "yyyy-MM-dd");
        const endDate = format(
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd"
        );

        const { data: availabilityData } = await (supabase as any)
          .from("availabilities")
          .select("*")
          .eq("vehicleId", vehicleId)
          .gte("date", startDate)
          .lte("date", endDate);

        if (availabilityData) {
          const formatted = availabilityData.map((a: any) => ({
            date: parseISO(a.date),
            isAvailable: a.isAvailable,
            priceOverride: a.priceOverride,
          }));
          setAvailabilities(formatted);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [vehicleId, router, toast]);

  const handleToggleDay = useCallback(
    async (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const existingIndex = availabilities.findIndex((a) =>
        format(a.date, "yyyy-MM-dd") === dateStr
      );

      const newAvailabilities = [...availabilities];

      if (existingIndex >= 0) {
        // Toggle existing
        newAvailabilities[existingIndex] = {
          ...newAvailabilities[existingIndex],
          isAvailable: !newAvailabilities[existingIndex].isAvailable,
        };
      } else {
        // Add new (default to not available)
        newAvailabilities.push({
          date,
          isAvailable: false,
        });
      }

      setAvailabilities(newAvailabilities);
    },
    [availabilities]
  );

  const handleSetPriceOverride = useCallback(
    async (date: Date, price: number | null) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const existingIndex = availabilities.findIndex((a) =>
        format(a.date, "yyyy-MM-dd") === dateStr
      );

      const newAvailabilities = [...availabilities];

      if (existingIndex >= 0) {
        newAvailabilities[existingIndex] = {
          ...newAvailabilities[existingIndex],
          priceOverride: price || undefined,
        };
      } else {
        newAvailabilities.push({
          date,
          isAvailable: true,
          priceOverride: price || undefined,
        });
      }

      setAvailabilities(newAvailabilities);
    },
    [availabilities]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createBrowserClient();

      // Prepare data for upsert
      const records = availabilities.map((a) => ({
        vehicleId,
        date: format(a.date, "yyyy-MM-dd"),
        isAvailable: a.isAvailable,
        priceOverride: a.priceOverride || null,
      }));

      // Delete existing and insert new (simple approach)
      // In production, you'd want a more efficient diff-based approach
      const startDate = format(new Date(), "yyyy-MM-dd");
      await (supabase as any)
        .from("availabilities")
        .delete()
        .eq("vehicleId", vehicleId)
        .gte("date", startDate);

      if (records.length > 0) {
        const { error } = await (supabase as any)
          .from("availabilities")
          .insert(records);

        if (error) throw error;
      }

      toast({
        title: "Guardado",
        description: "Disponibilidad actualizada correctamente",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la disponibilidad",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <div className="container max-w-5xl py-8">
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
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="space-y-2">
            <li>• Haz clic en un día para seleccionarlo y modificar su disponibilidad.</li>
            <li>• Los días en <span className="text-green-500">verde</span> están disponibles para reservas.</li>
            <li>• Los días en <span className="text-red-500">rojo</span> no están disponibles.</li>
            <li>• Puedes establecer un precio especial para fechas específicas (ej: feriados, temporada alta).</li>
            <li>• Recuerda guardar los cambios antes de salir.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Calendar */}
      <AvailabilityCalendar
        availabilities={availabilities}
        onToggleDay={handleToggleDay}
        onSetPriceOverride={handleSetPriceOverride}
        basePrice={vehicle.basePriceDay}
      />
    </div>
  );
}
