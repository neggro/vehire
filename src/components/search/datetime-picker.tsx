"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimeValue {
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
}

interface DateTimePickerProps {
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  label: string;
  minDate?: string;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  minDate,
  className,
}: DateTimePickerProps) {
  // Get today's date in local timezone for min attribute
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setToday(`${year}-${month}-${day}`);
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, date: e.target.value });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, time: e.target.value });
  };

  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = String(h).padStart(2, "0");
        const minute = String(m).padStart(2, "0");
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            className="pl-10"
            value={value.date}
            onChange={handleDateChange}
            min={minDate || today}
          />
        </div>
        <div className="relative w-28">
          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={value.time}
            onChange={(e) => onChange({ ...value, time: e.target.value })}
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Utility to combine date and time into an ISO string
export function combineDateAndTime(date: string, time: string, timezone = "America/Montevideo"): Date {
  // Create a date string in ISO format
  const dateTimeString = `${date}T${time}:00`;

  // Parse as if it's in the target timezone
  // For simplicity, we'll use the local timezone interpretation
  return new Date(dateTimeString);
}

// Utility to format a date for display
export function formatDateTimeRange(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): string {
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-UY", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
}
