"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { PlacesAutocomplete } from "./places-autocomplete";
import { DateRangeWithTime } from "./date-range-picker";

export function HomeSearchBox() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
    startTime: string;
    endTime: string;
  }>({
    startDate: undefined,
    endDate: undefined,
    startTime: "10:00",
    endTime: "10:00",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (dateRange.startDate) {
      params.set("startDate", dateRange.startDate.toISOString());
    }
    if (dateRange.endDate) {
      params.set("endDate", dateRange.endDate.toISOString());
    }
    if (dateRange.startTime) params.set("startTime", dateRange.startTime);
    if (dateRange.endTime) params.set("endTime", dateRange.endTime);
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="mt-10">
      <Card className="mx-auto max-w-4xl shadow-2xl border-border/30 glass overflow-visible">
        <CardContent className="p-2.5">
          <form onSubmit={handleSearch} className="flex flex-col gap-2 md:flex-row items-center">
            {/* Location */}
            <div className="flex-[1.5] w-full">
              <PlacesAutocomplete
                value={city}
                onChange={(value) => setCity(value)}
                placeholder="¿A dónde vas?"
                className="w-full"
                variant="ghost"
              />
            </div>

            <div className="hidden md:block h-8 w-px bg-border/60" />

            {/* Dates */}
            <div className="flex-1 w-full">
              <DateRangeWithTime
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                startTime={dateRange.startTime}
                endTime={dateRange.endTime}
                onChange={setDateRange}
                placeholder="Seleccionar fechas"
                className="w-full border-none shadow-none bg-transparent h-12 hover:bg-transparent"
              />
            </div>

            <Button type="submit" size="lg" className="h-12 px-8 w-full md:w-auto rounded-lg md:rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
              <Search className="mr-2 h-5 w-5" />
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
