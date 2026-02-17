"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DayData {
  isAvailable: boolean;
  priceOverride?: number | null;
}

interface AvailabilityCalendarProps {
  vehicleId: string;
  basePrice: number;
  availabilityMap: Record<string, DayData>;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function AvailabilityCalendar({
  vehicleId,
  basePrice,
  availabilityMap: initialAvailability,
}: AvailabilityCalendarProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, DayData>>(initialAvailability);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customPrice, setCustomPrice] = useState("");

  // Get days in current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentDate]);

  const formatDateString = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    if (isPastDate(date)) return;
    
    const dateStr = formatDateString(date);
    setSelectedDate(dateStr);
    
    const dayData = availability[dateStr];
    setCustomPrice(dayData?.priceOverride ? (dayData.priceOverride / 100).toString() : "");
  };

  const handleToggleAvailability = async (available: boolean) => {
    if (!selectedDate) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          date: selectedDate,
          isAvailable: available,
          priceOverride: customPrice ? Math.round(parseFloat(customPrice) * 100) : null,
        }),
      });

      if (!response.ok) throw new Error("Error updating availability");

      setAvailability((prev) => ({
        ...prev,
        [selectedDate]: {
          isAvailable: available,
          priceOverride: customPrice ? Math.round(parseFloat(customPrice) * 100) : null,
        },
      }));

      toast({
        title: available ? "Día disponible" : "Día bloqueado",
        description: `El ${new Date(selectedDate).toLocaleDateString("es-UY")} ha sido actualizado`,
      });

      setSelectedDate(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la disponibilidad",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomPrice = async () => {
    if (!selectedDate) return;
    
    const dayData = availability[selectedDate];
    await handleToggleAvailability(dayData?.isAvailable ?? true);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = formatDateString(date);
              const dayData = availability[dateStr];
              const isPast = isPastDate(date);
              const isToday = dateStr === new Date().toISOString().split("T")[0];

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(date)}
                  disabled={isPast}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors",
                    "hover:ring-2 hover:ring-primary hover:ring-offset-2",
                    isPast && "opacity-30 cursor-not-allowed",
                    isToday && "ring-2 ring-primary",
                    !isPast && !dayData && "bg-primary/20 hover:bg-primary/30",
                    !isPast && dayData?.isAvailable && !dayData.priceOverride && "bg-primary text-primary-foreground",
                    !isPast && dayData?.isAvailable && dayData.priceOverride && "bg-orange-500 text-white",
                    !isPast && dayData && !dayData.isAvailable && "bg-muted"
                  )}
                >
                  <span className="font-medium">{date.getDate()}</span>
                  {dayData?.priceOverride && (
                    <span className="text-[10px]">${(dayData.priceOverride / 100).toLocaleString()}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Mark all visible future days as available
                const updates: Record<string, DayData> = {};
                calendarDays.forEach((date) => {
                  if (date && !isPastDate(date)) {
                    const dateStr = formatDateString(date);
                    if (!availability[dateStr]?.isAvailable) {
                      updates[dateStr] = { isAvailable: true };
                    }
                  }
                });
                if (Object.keys(updates).length > 0) {
                  setAvailability((prev) => ({ ...prev, ...updates }));
                  toast({
                    title: "Días disponibles",
                    description: `${Object.keys(updates).length} días marcados como disponibles`,
                  });
                }
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              Marcar todos disponibles
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Mark all visible future days as unavailable
                const updates: Record<string, DayData> = {};
                calendarDays.forEach((date) => {
                  if (date && !isPastDate(date)) {
                    const dateStr = formatDateString(date);
                    if (availability[dateStr]?.isAvailable !== false) {
                      updates[dateStr] = { isAvailable: false };
                    }
                  }
                });
                if (Object.keys(updates).length > 0) {
                  setAvailability((prev) => ({ ...prev, ...updates }));
                  toast({
                    title: "Días bloqueados",
                    description: `${Object.keys(updates).length} días marcados como no disponibles`,
                  });
                }
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Bloquear todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Day edit dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate).toLocaleDateString("es-UY", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogTitle>
            <DialogDescription>
              Configura la disponibilidad y precio para este día
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customPrice">Precio personalizado (opcional)</Label>
              <div className="flex items-center gap-2">
                <span>$</span>
                <Input
                  id="customPrice"
                  type="number"
                  placeholder={`Base: $${(basePrice / 100).toLocaleString()}`}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Deja vacío para usar el precio base
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleToggleAvailability(false)}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bloquear día
            </Button>
            <Button onClick={() => handleToggleAvailability(true)} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marcar disponible
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
