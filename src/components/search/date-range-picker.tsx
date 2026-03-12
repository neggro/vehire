"use client";

import * as React from "react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangeWithTimeProps {
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  onChange: (range: {
    startDate?: Date;
    endDate?: Date;
    startTime: string;
    endTime: string;
  }) => void;
  className?: string;
  placeholder?: string;
  compact?: boolean;
}

// Generate time options in 30-minute intervals
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

export function DateRangeWithTime({
  startDate,
  endDate,
  startTime = "10:00",
  endTime = "10:00",
  onChange,
  className,
  placeholder = "Seleccionar fechas",
  compact = false,
}: DateRangeWithTimeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(
    startDate && endDate ? { from: startDate, to: endDate } : undefined
  );
  const [localStartTime, setLocalStartTime] = React.useState(startTime);
  const [localEndTime, setLocalEndTime] = React.useState(endTime);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate number of days
  const dayCount = startDate && endDate
    ? differenceInDays(endDate, startDate) + 1
    : 0;

  // Format display text
  const formatDisplayText = () => {
    if (!startDate) return placeholder;

    const startFormatted = format(startDate, "d 'de' MMM", { locale: es });
    const startTimeFormatted = startTime.replace(":", ":");

    if (!endDate) {
      return `${startFormatted}, ${startTimeFormatted}`;
    }

    const endFormatted = format(endDate, "d 'de' MMM", { locale: es });
    const endTimeFormatted = endTime.replace(":", ":");

    if (compact) {
      return `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM", { locale: es })}`;
    }

    return `${startFormatted} ${startTimeFormatted} → ${endFormatted} ${endTimeFormatted}`;
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      setSelectedRange(undefined);
      return;
    }

    setSelectedRange(range);

    if (range.from && range.to) {
      onChange({
        startDate: range.from,
        endDate: range.to,
        startTime: localStartTime,
        endTime: localEndTime,
      });
    } else if (range.from) {
      onChange({
        startDate: range.from,
        endDate: undefined,
        startTime: localStartTime,
        endTime: localEndTime,
      });
    }
  };

  const handleTimeChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      setLocalStartTime(value);
    } else {
      setLocalEndTime(value);
    }

    onChange({
      startDate,
      endDate,
      startTime: type === "start" ? value : localStartTime,
      endTime: type === "end" ? value : localEndTime,
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRange(undefined);
    setLocalStartTime("10:00");
    setLocalEndTime("10:00");
    onChange({
      startDate: undefined,
      endDate: undefined,
      startTime: "10:00",
      endTime: "10:00",
    });
  };

  const handleApply = () => {
    if (selectedRange?.from && selectedRange?.to) {
      onChange({
        startDate: selectedRange.from,
        endDate: selectedRange.to,
        startTime: localStartTime,
        endTime: localEndTime,
      });
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-10 overflow-hidden",
            !startDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate overflow-hidden whitespace-nowrap">{formatDisplayText()}</span>
          {startDate && (
            <X
              className="ml-auto pl-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-medium text-sm">Selecciona las fechas de tu viaje</h4>
        </div>

        {/* Calendar - Two months side by side */}
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={startDate || today}
          selected={selectedRange}
          onSelect={handleSelect}
          numberOfMonths={2}
          disabled={{ before: today }}
          locale={es}
          className="border-0"
        />

        {/* Time Selection - Below calendar */}
        <div className="border-t p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Hora de inicio
              </label>
              <select
                value={localStartTime}
                onChange={(e) => handleTimeChange("start", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {selectedRange?.from && (
                <p className="text-xs text-muted-foreground">
                  {format(selectedRange.from, "EEEE d MMM", { locale: es })}
                </p>
              )}
            </div>

            {/* End Time */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Hora de devolución
              </label>
              <select
                value={localEndTime}
                onChange={(e) => handleTimeChange("end", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {selectedRange?.to && (
                <p className="text-xs text-muted-foreground">
                  {format(selectedRange.to, "EEEE d MMM", { locale: es })}
                </p>
              )}
            </div>
          </div>

          {/* Duration Summary */}
          {selectedRange?.from && selectedRange?.to && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-sm">
                <span className="font-medium">{dayCount} {dayCount === 1 ? "día" : "días"}</span>
                <span className="text-muted-foreground"> de alquiler</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={handleClear}
            >
              Limpiar
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleApply}
              disabled={!selectedRange?.from || !selectedRange?.to}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
