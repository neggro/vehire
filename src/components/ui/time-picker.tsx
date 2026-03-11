"use client";

import { generateTimeSlots } from "@/lib/timezone";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  disabled?: boolean;
  minTime?: string; // For return time - can't be before pickup time on same day
  className?: string;
}

const timeSlots = generateTimeSlots();

export function TimePicker({
  value,
  onChange,
  label,
  disabled = false,
  minTime,
  className = "",
}: TimePickerProps) {
  // Filter out times that are before minTime
  const availableSlots = minTime
    ? timeSlots.filter((slot) => slot >= minTime)
    : timeSlots;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {availableSlots.map((slot) => (
          <option key={slot} value={slot}>
            {slot}
          </option>
        ))}
      </select>
    </div>
  );
}

// Disclaimer component for time selection
export function TimeDisclaimer() {
  return (
    <div className="text-xs text-gray-500 mt-2 space-y-1">
      <p>
        * La hora es referencial. Se coordinará la hora exacta con el anfitrión.
      </p>
      <p>* El seguro entra en vigor desde la hora indicada de recogida.</p>
      <p>* Tiempo de gracia de 1 hora para la devolución.</p>
    </div>
  );
}
