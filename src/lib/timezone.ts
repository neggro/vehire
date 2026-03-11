/**
 * Timezone utilities for handling dates and times in Uruguay (UTC-3)
 */

export const DEFAULT_TIMEZONE = "America/Montevideo"; // UTC-3

/**
 * Get the default timezone for the application
 */
export function getTimezone(): string {
  return DEFAULT_TIMEZONE;
}

/**
 * Combine a date and time string in a specific timezone and convert to UTC
 * @param date - The date (can be Date object or ISO string)
 * @param time - Time string in "HH:mm" format (e.g., "10:00")
 * @param timezone - IANA timezone string (default: America/Montevideo)
 * @returns Date object in UTC
 */
export function toUTC(date: Date | string, time: string, timezone: string = DEFAULT_TIMEZONE): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Get the date parts in the specified timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const dateStr = formatter.format(dateObj);
  const [year, month, day] = dateStr.split("-").map(Number);

  // Parse time
  const [hours, minutes] = time.split(":").map(Number);

  // Create a date string and interpret it in the target timezone
  const dateTimeStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

  // Use a formatter to get the offset and create proper UTC date
  const tempDate = new Date(dateTimeStr);

  // Get the timezone offset for this specific date
  const offsetMs = getTimezoneOffset(tempDate, timezone);

  // Adjust for timezone offset to get UTC
  return new Date(tempDate.getTime() + offsetMs);
}

/**
 * Get timezone offset in milliseconds for a given date
 */
function getTimezoneOffset(date: Date, timezone: string): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return utcDate.getTime() - tzDate.getTime();
}

/**
 * Convert a UTC date to a specific timezone
 * @param date - UTC date
 * @param timezone - IANA timezone string
 * @returns Date object adjusted for the timezone (for display purposes)
 */
export function fromUTC(date: Date | string, timezone: string = DEFAULT_TIMEZONE): Date {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  // Return a new date that represents the same moment
  // The Date object internally stores UTC, this is just for getting local parts
  return new Date(dateObj.toLocaleString("en-US", { timeZone: timezone }));
}

/**
 * Format a date in a specific timezone
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @param timezone - IANA timezone string
 * @returns Formatted date string
 */
export function formatDateInTimezone(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
  timezone: string = DEFAULT_TIMEZONE
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };
  return dateObj.toLocaleDateString("es-UY", defaultOptions);
}

/**
 * Format a date with time in a specific timezone
 */
export function formatDateTimeInTimezone(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("es-UY", {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get just the time from a UTC date in a specific timezone
 * @param date - UTC date
 * @param timezone - IANA timezone string
 * @returns Time string in "HH:mm" format
 */
export function getTimeInTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Get the date part only (no time) interpreted in a specific timezone
 * Returns an ISO date string (YYYY-MM-DD)
 */
export function getDateInTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-CA", { timeZone: timezone });
}

/**
 * Check if a date is "today" in the specified timezone
 */
export function isTodayInTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return getDateInTimezone(dateObj, timezone) === getDateInTimezone(today, timezone);
}

/**
 * Check if a date is "tomorrow" in the specified timezone
 */
export function isTomorrowInTimezone(date: Date | string, timezone: string = DEFAULT_TIMEZONE): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getDateInTimezone(dateObj, timezone) === getDateInTimezone(tomorrow, timezone);
}

/**
 * Get the start of today in UTC, interpreted from the given timezone
 */
export function getStartOfTodayUTC(timezone: string = DEFAULT_TIMEZONE): Date {
  const now = new Date();
  const todayStr = getDateInTimezone(now, timezone);
  return toUTC(todayStr, "00:00", timezone);
}

/**
 * Get the end of today in UTC (start of tomorrow), interpreted from the given timezone
 */
export function getEndOfTodayUTC(timezone: string = DEFAULT_TIMEZONE): Date {
  const now = new Date();
  const todayStr = getDateInTimezone(now, timezone);
  return toUTC(todayStr, "23:59", timezone);
}

/**
 * Create a date representing "tomorrow at 10:00" in the given timezone, returned as UTC
 */
export function getTomorrowAtTimeUTC(time: string, timezone: string = DEFAULT_TIMEZONE): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getDateInTimezone(tomorrow, timezone);
  return toUTC(tomorrowStr, time, timezone);
}

/**
 * Generate available time slots for pickup/return
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour <= 20; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
  }
  return slots;
}

/**
 * Calculate the number of days between two dates (inclusive of start, exclusive of end)
 * Returns the ceiling of the difference in days
 */
export function calculateDays(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}
