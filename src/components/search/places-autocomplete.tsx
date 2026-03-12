"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, X, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationResult {
  city: string;
  count: number;
  lat: number;
  lng: number;
  distance?: number;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeData?: { lat: number; lng: number; city: string }) => void;
  placeholder?: string;
  className?: string;
  variant?: "default" | "ghost";
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = "Buscar ubicación...",
  className,
  variant = "default",
}: PlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Sync input value with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchLocations = useCallback(async (query: string) => {
    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);

      const response = await fetch(`/api/locations?${params.toString()}`, {
        signal: abortRef.current.signal,
      });
      const data = await response.json();
      setLocations(data.locations || []);
      setShowDropdown((data.locations?.length || 0) > 0);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error fetching locations:", error);
        setLocations([]);
        setShowDropdown(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue) {
      onChange("");
      setLocations([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLocations(newValue);
    }, 300);
  };

  const handleFocus = () => {
    // Show all locations on focus if input is empty
    if (!inputValue && locations.length === 0) {
      fetchLocations("");
    } else if (locations.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setLocations([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleSelectLocation = (location: LocationResult) => {
    setInputValue(location.city);
    setShowDropdown(false);
    onChange(location.city, {
      lat: location.lat,
      lng: location.lng,
      city: location.city,
    });
  };

  const handleNearMe = async () => {
    if (!navigator.geolocation) return;

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const params = new URLSearchParams();
          params.set("lat", latitude.toString());
          params.set("lng", longitude.toString());

          const response = await fetch(`/api/locations?${params.toString()}`);
          const data = await response.json();
          const results: LocationResult[] = data.locations || [];

          if (results.length > 0) {
            // Auto-select the nearest city
            const nearest = results[0];
            setInputValue(nearest.city);
            setShowDropdown(false);
            onChange(nearest.city, {
              lat: nearest.lat,
              lng: nearest.lng,
              city: nearest.city,
            });
          } else {
            setLocations(results);
            setShowDropdown(true);
          }
        } catch (error) {
          console.error("Error fetching nearby locations:", error);
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative group">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10 h-10 w-full transition-all focus:ring-0 focus-visible:ring-0",
            variant === "ghost" && "border-none shadow-none bg-transparent h-12"
          )}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(isLoading || geoLoading) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-2 w-full min-w-[300px] rounded-xl border bg-popover shadow-xl max-h-80 overflow-auto p-1 animate-in fade-in zoom-in-95 duration-200">
          {/* Near me option */}
          {"geolocation" in navigator && (
            <div
              className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors group"
              onClick={handleNearMe}
            >
              <div className="rounded-full bg-primary/10 p-1.5 group-hover:bg-primary/20 transition-colors">
                <Navigation className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-primary">Cerca de mí</p>
                <p className="text-xs text-muted-foreground">Usar mi ubicación actual</p>
              </div>
            </div>
          )}

          {locations.length > 0 && "geolocation" in navigator && (
            <div className="mx-4 my-1 border-t" />
          )}

          {locations.map((location) => (
            <div
              key={location.city}
              className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-accent rounded-lg transition-colors group"
              onClick={() => handleSelectLocation(location)}
            >
              <div className="mt-0.5 rounded-full bg-muted p-1.5 group-hover:bg-background transition-colors">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{location.city}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {location.count} {location.count === 1 ? "vehículo disponible" : "vehículos disponibles"}
                  {location.distance != null && ` · ${Math.round(location.distance)} km`}
                </p>
              </div>
            </div>
          ))}

          {locations.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No se encontraron ubicaciones
            </div>
          )}
        </div>
      )}
    </div>
  );
}
