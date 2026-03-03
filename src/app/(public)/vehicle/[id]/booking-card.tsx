"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Shield, Clock, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { formatPriceFromCents, calculateBookingAmount, type BookingCalculation } from "@/lib/bookings";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface VehicleData {
  id: string;
  basePriceDay: number;
  weekendPriceDay: number | null;
  estimatedValue: number | null;
  deliveryAvailable: boolean;
  deliveryPrice: number | null;
  mileageLimit: number | null;
  location: {
    address: string | null;
  };
  status: string;
}

interface BookingCardProps {
  vehicle: VehicleData;
}

export function BookingCard({ vehicle }: BookingCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Dates - default to tomorrow and +3 days
  const [startDate, setStartDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 4);
    date.setHours(10, 0, 0, 0);
    return date;
  });
  const [withDelivery, setWithDelivery] = useState(false);

  // Calculate pricing
  const [calculation, setCalculation] = useState<BookingCalculation | null>(null);

  useEffect(() => {
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
    } catch (error) {
      console.error("Error calculating booking:", error);
      setCalculation(null);
    }
  }, [startDate, endDate, withDelivery, vehicle]);

  const handleReserve = () => {
    if (!calculation) return;

    setIsLoading(true);

    // Build URL with query params for booking page
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      delivery: withDelivery.toString(),
    });

    router.push(`/booking/${vehicle.id}?${params.toString()}`);
  };

  // Check if vehicle is available
  const isAvailable = vehicle.status === "ACTIVE";
  const isPaused = vehicle.status === "PAUSED";

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold">{formatPrice(vehicle.basePriceDay)}</span>
            <span className="text-muted-foreground">/día</span>
          </div>
          {vehicle.weekendPriceDay && (
            <span className="text-sm text-muted-foreground">
              Finde: {formatPrice(vehicle.weekendPriceDay)}/día
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date pickers */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-3">
            <label className="text-xs text-muted-foreground">Retiro</label>
            <input
              type="date"
              value={format(startDate, "yyyy-MM-dd")}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => {
                const newStart = new Date(e.target.value);
                newStart.setHours(10, 0, 0, 0);
                setStartDate(newStart);
                if (newStart >= endDate) {
                  const newEnd = new Date(newStart);
                  newEnd.setDate(newEnd.getDate() + 1);
                  setEndDate(newEnd);
                }
              }}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          <div className="rounded-lg border p-3">
            <label className="text-xs text-muted-foreground">Devolución</label>
            <input
              type="date"
              value={format(endDate, "yyyy-MM-dd")}
              min={format(startDate, "yyyy-MM-dd")}
              onChange={(e) => {
                const newEnd = new Date(e.target.value);
                newEnd.setHours(10, 0, 0, 0);
                setEndDate(newEnd);
              }}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border p-3">
          <label className="text-xs text-muted-foreground">Ubicación</label>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{vehicle.location.address || "Ver ubicación en el mapa"}</span>
          </div>
        </div>

        {/* Delivery option */}
        {vehicle.deliveryAvailable && vehicle.deliveryPrice && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="delivery"
                checked={withDelivery}
                onCheckedChange={(checked: boolean) => setWithDelivery(checked)}
              />
              <Label htmlFor="delivery" className="text-sm cursor-pointer">
                Entrega a domicilio
              </Label>
            </div>
            <span className="text-sm font-medium">
              +{formatPrice(vehicle.deliveryPrice)}
            </span>
          </div>
        )}

        {/* Price summary */}
        {calculation && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {calculation.days} día{calculation.days !== 1 ? "s" : ""} × {formatPriceFromCents(calculation.dailyRate)}
              </span>
              <span>{formatPriceFromCents(calculation.baseAmount)}</span>
            </div>
            {calculation.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entrega</span>
                <span>{formatPriceFromCents(calculation.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Depósito de garantía</span>
              <span>{formatPriceFromCents(calculation.depositAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t">
              <span>Total</span>
              <span>{formatPriceFromCents(calculation.totalAmount)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              El depósito se reembolsa al devolver el vehículo
            </p>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handleReserve}
          disabled={isLoading || !isAvailable || !calculation}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : isPaused ? (
            "Vehículo pausado"
          ) : !isAvailable ? (
            "No disponible"
          ) : (
            "Reservar"
          )}
        </Button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Seguro incluido</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Cancelación gratis</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
