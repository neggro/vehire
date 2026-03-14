"use client";

import * as React from "react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Clock, X, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

// Mobile 2-step picker: Step 1 = pickup (date + time), Step 2 = return (date + time)
type MobileStep = "pickup" | "return";

function MobileDateTimePicker({
  startDate,
  endDate,
  startTime = "10:00",
  endTime = "10:00",
  onChange,
  onClose,
}: {
  startDate?: Date;
  endDate?: Date;
  startTime: string;
  endTime: string;
  onChange: DateRangeWithTimeProps["onChange"];
  onClose: () => void;
}) {
  const [step, setStep] = React.useState<MobileStep>("pickup");
  const [localStartDate, setLocalStartDate] = React.useState(startDate);
  const [localEndDate, setLocalEndDate] = React.useState(endDate);
  const [localStartTime, setLocalStartTime] = React.useState(startTime);
  const [localEndTime, setLocalEndTime] = React.useState(endTime);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPickup = step === "pickup";

  const handleApply = () => {
    onChange({
      startDate: localStartDate,
      endDate: localEndDate,
      startTime: localStartTime,
      endTime: localEndTime,
    });
    onClose();
  };

  const handleClear = () => {
    setLocalStartDate(undefined);
    setLocalEndDate(undefined);
    setLocalStartTime("10:00");
    setLocalEndTime("10:00");
    onChange({
      startDate: undefined,
      endDate: undefined,
      startTime: "10:00",
      endTime: "10:00",
    });
    onClose();
  };

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Step indicator */}
      <div className="px-4 pr-12 pt-4 pb-3 border-b shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">
            {isPickup ? "Retiro" : "Devolución"}
          </h3>
          <span className="text-xs text-muted-foreground">
            Paso {isPickup ? 1 : 2} de 2
          </span>
        </div>
        <div className="flex gap-1">
          <div className="h-1 flex-1 rounded-full bg-primary" />
          <div className={cn("h-1 flex-1 rounded-full transition-colors", !isPickup ? "bg-primary" : "bg-muted")} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Calendar */}
        <Calendar
          mode="single"
          selected={isPickup ? localStartDate : localEndDate}
          onSelect={(date) => {
            if (!date) return;
            if (isPickup) {
              setLocalStartDate(date);
              if (localEndDate && date > localEndDate) {
                setLocalEndDate(undefined);
              }
            } else {
              setLocalEndDate(date);
            }
          }}
          defaultMonth={isPickup ? (localStartDate || today) : (localEndDate || localStartDate || today)}
          disabled={{ before: isPickup ? today : (localStartDate || today) }}
          fromMonth={today}
          locale={es}
          className="border-0 mx-auto p-2 pt-4"
          classNames={{
            month: "space-y-4 w-full",
            month_caption: "flex justify-center pt-2 relative items-center",
            month_grid: "w-full border-collapse",
            weekdays: "flex justify-around",
            weekday: "text-muted-foreground w-10 font-normal text-[0.8rem]",
            week: "flex justify-around w-full mt-2",
            day: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day_button: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md inline-flex items-center justify-center",
            selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            today: "bg-accent text-accent-foreground",
            outside: "text-muted-foreground opacity-50",
            disabled: "text-muted-foreground opacity-50",
          }}
        />

        {/* Time dropdown */}
        <div className="px-4 pb-4">
          <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
            <Clock className="h-3.5 w-3.5" />
            {isPickup ? "Hora de retiro" : "Hora de devolución"}
          </label>
          <select
            value={isPickup ? localStartTime : localEndTime}
            onChange={(e) => {
              if (isPickup) {
                setLocalStartTime(e.target.value);
              } else {
                setLocalEndTime(e.target.value);
              }
            }}
            className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      {localStartDate && (
        <div className="px-4 py-2 border-t bg-muted/30 text-sm shrink-0">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Retiro:</span>
            <span className="font-medium">
              {format(localStartDate, "d MMM", { locale: es })} {localStartTime}
            </span>
          </div>
          {localEndDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Devolución:</span>
              <span className="font-medium">
                {format(localEndDate, "d MMM", { locale: es })} {localEndTime}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t flex gap-2 shrink-0">
        {isPickup ? (
          <Button variant="ghost" onClick={handleClear} className="flex-1">
            Limpiar
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setStep("pickup")} className="flex-1">
            Anterior
          </Button>
        )}
        {isPickup ? (
          <Button
            onClick={() => setStep("return")}
            className="flex-1"
            disabled={!localStartDate}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleApply}
            className="flex-1"
            disabled={!localStartDate || !localEndDate}
          >
            Aplicar
          </Button>
        )}
      </div>
    </div>
  );
}

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
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
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

    if (!endDate) {
      return `${startFormatted}, ${startTime}`;
    }

    const endFormatted = format(endDate, "d 'de' MMM", { locale: es });

    if (compact) {
      return `${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM", { locale: es })}`;
    }

    return `${startFormatted} ${startTime} → ${endFormatted} ${endTime}`;
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

  const triggerContent = (
    <>
      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
      <span className="truncate overflow-hidden whitespace-nowrap">{formatDisplayText()}</span>
      {startDate && (
        <X
          className="ml-auto pl-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
          onClick={handleClear}
        />
      )}
    </>
  );

  const buttonClasses = cn(
    "justify-start text-left font-normal h-10 overflow-hidden",
    !startDate && "text-muted-foreground",
    className
  );

  return (
    <>
      {/* Desktop: Popover with calendar + time selectors */}
      <div className="hidden md:block">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={buttonClasses}>
              {triggerContent}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 border-b">
              <h4 className="font-medium text-sm">Selecciona las fechas de tu viaje</h4>
            </div>

            <Calendar
              initialFocus
              mode="range"
              defaultMonth={startDate || today}
              selected={selectedRange}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={{ before: today }}
              fromMonth={today}
              locale={es}
              className="border-0"
            />

            <div className="border-t p-4">
              <div className="grid grid-cols-2 gap-4">
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

              {selectedRange?.from && selectedRange?.to && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-sm">
                    <span className="font-medium">{dayCount} {dayCount === 1 ? "día" : "días"}</span>
                    <span className="text-muted-foreground"> de alquiler</span>
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="ghost" size="sm" className="flex-1" onClick={handleClear}>
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
      </div>

      {/* Mobile: Dialog with step-based picker */}
      <div className="md:hidden">
        <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className={buttonClasses}>
              {triggerContent}
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0 gap-0 max-w-[95vw] rounded-xl">
            <DialogTitle className="sr-only">Seleccionar fechas y horarios</DialogTitle>
            <MobileDateTimePicker
              startDate={startDate}
              endDate={endDate}
              startTime={startTime}
              endTime={endTime}
              onChange={onChange}
              onClose={() => setIsMobileOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
