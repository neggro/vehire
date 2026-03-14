"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Shield, Clock, Loader2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { formatPriceFromCents, calculateBookingAmount, type BookingCalculation } from "@/lib/bookings";
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

// Generate time options in 30-minute intervals
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

export function BookingCard({ vehicle }: BookingCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Time selection
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");

  // Calendar popover state
  const [pickupOpen, setPickupOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Dates
  const [startDate, setStartDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 4);
    date.setHours(0, 0, 0, 0);
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

    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      pickupTime,
      returnTime,
      delivery: withDelivery.toString(),
    });

    router.push(`/booking/${vehicle.id}?${params.toString()}`);
  };

  const isAvailable = vehicle.status === "ACTIVE";
  const isPaused = vehicle.status === "PAUSED";

  return (
    <Card className="top-24">
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
        {/* Date & Time pickers */}
        <div className="grid grid-cols-2 gap-2">
          {/* Pickup */}
          <div className="rounded-lg border p-3 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Retiro</label>
            <Popover open={pickupOpen} onOpenChange={setPickupOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal h-auto p-0 hover:bg-transparent",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {format(startDate, "d MMM yyyy", { locale: es })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date);
                      if (date >= endDate) {
                        const newEnd = new Date(date);
                        newEnd.setDate(newEnd.getDate() + 1);
                        setEndDate(newEnd);
                      }
                      setPickupOpen(false);
                    }
                  }}
                  disabled={{ before: today }}
                  fromMonth={today}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <select
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              disabled={!isAvailable}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Return */}
          <div className="rounded-lg border p-3 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Devolución</label>
            <Popover open={returnOpen} onOpenChange={setReturnOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal h-auto p-0 hover:bg-transparent",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {format(endDate, "d MMM yyyy", { locale: es })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date);
                      setReturnOpen(false);
                    }
                  }}
                  disabled={{ before: startDate }}
                  fromMonth={startDate}
                  defaultMonth={endDate}
                  locale={es}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <select
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              disabled={!isAvailable}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time disclaimer */}
        <p className="text-xs text-muted-foreground">
          * La hora es referencial. Se coordinará con el anfitrión.
        </p>

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
