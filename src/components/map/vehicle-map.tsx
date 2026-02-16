"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError("Google Maps API key not configured");
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError("Failed to load Google Maps");

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before loading
      if (!isLoaded) {
        document.head.removeChild(script);
      }
    };
  }, [isLoaded]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });
  }, [isLoaded, center, zoom]);

  // Update markers when vehicles change
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    vehicles.forEach((vehicle) => {
      const marker = new window.google.maps.Marker({
        position: vehicle.location,
        map: mapInstanceRef.current,
        title: vehicle.title,
        label: {
          text: `$${Math.round(vehicle.price / 100)}`,
          color: "white",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: selectedVehicleId === vehicle.id ? "#7c3aed" : "#4f46e5",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      if (onMarkerClick) {
        marker.addListener("click", () => onMarkerClick(vehicle.id));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if there are vehicles
    if (vehicles.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      vehicles.forEach((v) => bounds.extend(v.location));
      mapInstanceRef.current?.fitBounds(bounds, 50);
    }
  }, [isLoaded, vehicles, selectedVehicleId, onMarkerClick]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <div className="text-center p-8">
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden ${className}`}
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

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || window.google?.maps) {
      if (window.google?.maps) setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map and autocomplete
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !inputRef.current) return;

    // Initialize map
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: value || DEFAULT_CENTER,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
    });

    // Initialize marker
    if (value) {
      markerRef.current = new window.google.maps.Marker({
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

    // Initialize autocomplete
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["geocode"],
      componentRestrictions: { country: "uy" }, // Uruguay
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

        // Update map and marker
        mapInstanceRef.current?.setCenter(location);
        if (markerRef.current) {
          markerRef.current.setPosition(location);
        } else {
          markerRef.current = new window.google.maps.Marker({
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

    // Click on map to place marker
    mapInstanceRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const location = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        onChange(location);

        if (markerRef.current) {
          markerRef.current.setPosition(location);
        } else {
          markerRef.current = new window.google.maps.Marker({
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
