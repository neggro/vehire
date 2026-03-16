"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Map as MapIcon } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps";

interface LocationMapClientProps {
  lat: number;
  lng: number;
  city: string;
}

export function LocationMapClient({ lat, lng, city }: LocationMapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => { if (!cancelled) setIsLoaded(true); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const center = { lat, lng };

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "cooperative",
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    // Draw ~3km radius circle
    new google.maps.Circle({
      map,
      center,
      radius: 3000,
      fillColor: "#1a6abf",
      fillOpacity: 0.1,
      strokeColor: "#1a6abf",
      strokeOpacity: 0.3,
      strokeWeight: 2,
    });
  }, [isLoaded, lat, lng]);

  if (error) {
    return (
      <div className="aspect-[2/1] overflow-hidden rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapIcon className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">{city}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="aspect-[2/1] overflow-hidden rounded-xl bg-muted flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="aspect-[2/1] overflow-hidden rounded-xl"
    />
  );
}
