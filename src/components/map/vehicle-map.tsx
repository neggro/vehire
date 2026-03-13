"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Map as MapIcon } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps";

interface Location {
  lat: number;
  lng: number;
}

interface VehicleMarker {
  id: string;
  location: Location;
  title: string;
  price: number;
}

interface VehicleMapProps {
  vehicles: VehicleMarker[];
  center?: Location;
  zoom?: number;
  onMarkerClick?: (vehicleId: string) => void;
  selectedVehicleId?: string | null;
  className?: string;
}

// Default center: Montevideo, Uruguay
const DEFAULT_CENTER = { lat: -34.9011, lng: -56.1645 };
const DEFAULT_ZOOM = 12;

// Build a price-pill SVG data URL to avoid the deprecation of SymbolPath markers
function buildPriceMarkerIcon(price: string, selected: boolean) {
  const bg = selected ? "%23d4940a" : "%231a6abf";
  const w = Math.max(48, price.length * 9 + 24);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='32'>` +
    `<rect rx='16' width='${w}' height='32' fill='${bg}' stroke='white' stroke-width='2'/>` +
    `<text x='50%25' y='50%25' text-anchor='middle' dy='.35em' fill='white' font-size='12' font-weight='700' font-family='system-ui,sans-serif'>${price}</text>` +
    `</svg>`;
  return {
    url: `data:image/svg+xml,${svg}`,
    scaledSize: new google.maps.Size(w, 32),
    anchor: new google.maps.Point(w / 2, 16),
  };
}

export function VehicleMap({
  vehicles,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onMarkerClick,
  selectedVehicleId,
  className,
}: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Load Google Maps via singleton loader
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => { if (!cancelled) setIsLoaded(true); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });
  }, [isLoaded, center, zoom]);

  // Update markers when vehicles or selection changes
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    vehicles.forEach((vehicle) => {
      const isSelected = selectedVehicleId === vehicle.id;
      const priceText = `$${Math.round(vehicle.price / 100)}`;

      const marker = new google.maps.Marker({
        position: vehicle.location,
        map: mapInstanceRef.current,
        title: vehicle.title,
        icon: buildPriceMarkerIcon(priceText, isSelected),
        zIndex: isSelected ? 10 : 1,
        optimized: false,
      });

      marker.addListener("click", () => onMarkerClick?.(vehicle.id));
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (vehicles.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      vehicles.forEach((v) => bounds.extend(v.location));
      mapInstanceRef.current?.fitBounds(bounds, 50);
    }
  }, [isLoaded, vehicles, selectedVehicleId, onMarkerClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, []);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 ${className}`}>
        <div className="text-center p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <MapIcon className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground/70 mt-1.5">
            Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en tu entorno
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Cargando mapa...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`overflow-hidden ${className}`}
      style={{ minHeight: "400px" }}
    />
  );
}

// Location picker component for address selection
interface LocationPickerProps {
  value?: Location;
  onChange: (location: Location) => void;
  onAddressChange?: (address: string) => void;
  className?: string;
}

export function LocationPicker({
  value,
  onChange,
  onAddressChange,
  className,
}: LocationPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Load Google Maps via singleton loader
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => { if (!cancelled) setIsLoaded(true); })
      .catch(() => { /* silently fail for location picker */ });
    return () => { cancelled = true; };
  }, []);

  // Initialize map and autocomplete
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !inputRef.current) return;

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: value || DEFAULT_CENTER,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
    });

    if (value) {
      markerRef.current = new google.maps.Marker({
        position: value,
        map: mapInstanceRef.current,
        draggable: true,
      });

      markerRef.current.addListener("dragend", () => {
        const pos = markerRef.current?.getPosition();
        if (pos) {
          onChange({ lat: pos.lat(), lng: pos.lng() });
        }
      });
    }

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode"],
      componentRestrictions: { country: "uy" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        onChange(location);
        onAddressChange?.(place.formatted_address || "");

        mapInstanceRef.current?.setCenter(location);
        if (markerRef.current) {
          markerRef.current.setPosition(location);
        } else {
          markerRef.current = new google.maps.Marker({
            position: location,
            map: mapInstanceRef.current,
            draggable: true,
          });
          markerRef.current.addListener("dragend", () => {
            const pos = markerRef.current?.getPosition();
            if (pos) {
              onChange({ lat: pos.lat(), lng: pos.lng() });
            }
          });
        }
      }
    });

    mapInstanceRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const location = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        onChange(location);

        if (markerRef.current) {
          markerRef.current.setPosition(location);
        } else {
          markerRef.current = new google.maps.Marker({
            position: location,
            map: mapInstanceRef.current,
            draggable: true,
          });
        }
      }
    });
  }, [isLoaded, onChange, onAddressChange, value]);

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Buscar dirección..."
        className="w-full px-3 py-2 border rounded-md mb-2"
      />
      <div
        ref={mapRef}
        className="rounded-lg overflow-hidden"
        style={{ height: "300px" }}
      />
    </div>
  );
}

// Type declaration for Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}
