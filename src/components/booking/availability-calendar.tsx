"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Ban,
  DollarSign,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

interface AvailabilityDay {
  date: Date;
  isAvailable: boolean;
  priceOverride?: number;
}

interface AvailabilityCalendarProps {
  availabilities: AvailabilityDay[];
  onToggleDay: (date: Date) => void;
  onSetPriceOverride: (date: Date, price: number | null) => void;
  basePrice: number;
  className?: string;
}

export function AvailabilityCalendar({
  availabilities,
  onToggleDay,
  onSetPriceOverride,
  basePrice,
  className,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [overridePrice, setOverridePrice] = useState("");

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayStatus = (date: Date): AvailabilityDay | undefined => {
    return availabilities.find((d) => isSameDay(d.date, date));
  };

  const handleDayClick = (date: Date) => {
    if (isBefore(date, new Date()) && !isToday(date)) {
      return;
    }
    setSelectedDate(date);
    const status = getDayStatus(date);
    setOverridePrice(status?.priceOverride ? String(status.priceOverride / 100) : "");
  };

  const handleToggleAvailability = () => {
    if (selectedDate) {
      onToggleDay(selectedDate);
    }
  };

  const handleSetPrice = () => {
    if (selectedDate && overridePrice) {
      const price = Math.round(parseFloat(overridePrice) * 100);
      onSetPriceOverride(selectedDate, price);
      setSelectedDate(null);
    }
  };

  const handleClearPrice = () => {
    if (selectedDate) {
      onSetPriceOverride(selectedDate, null);
      setOverridePrice("");
    }
  };

  const startDay = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null);

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr,300px]", className)}>
      {/* Calendar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const status = getDayStatus(day);
              const isPast = isBefore(day, new Date()) && !isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  disabled={isPast}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative",
                    isPast && "opacity-50 cursor-not-allowed",
                    !isPast && !status?.isAvailable && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    !isPast && status?.isAvailable && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    !isPast && !status && "bg-muted",
                    isSelected && "ring-2 ring-primary",
                    !isPast && "hover:ring-2 hover:ring-primary/50"
                  )}
                >
                  <span className="font-medium">{format(day, "d")}</span>
                  {status?.priceOverride && (
                    <DollarSign className="h-3 w-3 absolute bottom-0.5 right-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30" />
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30" />
              <span>No disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Precio especial</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Details Panel */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate
              ? format(selectedDate, "d 'de' MMMM", { locale: es })
              : "Selecciona un día"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            <div className="space-y-4">
              {(() => {
                const status = getDayStatus(selectedDate);
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Estado:
                      </span>
                      <div className="flex items-center gap-2">
                        {status?.isAvailable === false ? (
                          <>
                            <Ban className="h-4 w-4 text-red-500" />
                            <span className="text-red-500">No disponible</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-green-500">Disponible</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleToggleAvailability}
                    >
                      {status?.isAvailable === false
                        ? "Marcar disponible"
                        : "Marcar no disponible"}
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="overridePrice">
                        Precio especial (UYU)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="overridePrice"
                          type="number"
                          placeholder={String(basePrice / 100)}
                          value={overridePrice}
                          onChange={(e) => setOverridePrice(e.target.value)}
                        />
                        <Button
                          variant="secondary"
                          onClick={handleSetPrice}
                          disabled={!overridePrice}
                        >
                          Aplicar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Deja vacío para usar el precio base (${basePrice / 100}/día)
                      </p>
                    </div>

                    {status?.priceOverride && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                        onClick={handleClearPrice}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Quitar precio especial
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Haz clic en un día del calendario para ver o modificar su disponibilidad.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
