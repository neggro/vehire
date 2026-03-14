"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Fuel,
  Gauge,
  Car,
  Star,
  Heart,
} from "lucide-react";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
} from "@/constants";
import { formatPrice } from "@/lib/utils";

export interface VehicleCardData {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  state: string | null;
  basePriceDay: number;
  weekendPriceDay: number | null;
  images: { url: string }[];
  features: string[];
  seats: number;
  transmission: string;
  fuelType: string;
  rating: number | null;
  reviewCount: number;
  host: {
    id: string;
    fullName: string;
  };
}

// -- Vehicle image placeholder --
export function VehicleImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-primary/5 to-muted ${className}`}>
      <Car className="h-10 w-10 text-muted-foreground/30" />
    </div>
  );
}

// -- Rating pill --
export function RatingPill({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 bg-[hsl(var(--gold))]/10 px-2 py-0.5 rounded-full">
      <Star className="h-3.5 w-3.5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
      <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}

// -- Favorite button --
export function FavoriteButton({ className = "" }: { className?: string }) {
  return (
    <button
      className={`rounded-full bg-white/90 dark:bg-background/90 p-2 hover:bg-white dark:hover:bg-background shadow-sm hover:shadow-md hover:scale-110 transition-all duration-200 ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Heart className="h-4 w-4" />
    </button>
  );
}

// -- Specs row --
export function VehicleSpecs({ vehicle, size = "sm" }: { vehicle: VehicleCardData; size?: "sm" | "md" }) {
  const iconSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <Users className={iconSize} />
        {vehicle.seats}
      </span>
      <span className="flex items-center gap-1">
        <Gauge className={iconSize} />
        {TRANSMISSION_LABELS[vehicle.transmission as keyof typeof TRANSMISSION_LABELS] || vehicle.transmission}
      </span>
      <span className="flex items-center gap-1">
        <Fuel className={iconSize} />
        {FUEL_TYPE_LABELS[vehicle.fuelType as keyof typeof FUEL_TYPE_LABELS] || vehicle.fuelType}
      </span>
    </div>
  );
}

// =============================================
// GRID CARD — vertical, used in grid view
// =============================================
export function VehicleCard({ vehicle }: { vehicle: VehicleCardData }) {
  return (
    <Card className="group overflow-hidden border-border/40 card-hover">
      <Link href={`/vehicle/${vehicle.id}`}>
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {vehicle.images?.[0]?.url ? (
            <img
              src={vehicle.images[0].url}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover img-zoom"
            />
          ) : (
            <VehicleImagePlaceholder className="absolute inset-0" />
          )}
          <FavoriteButton className="absolute top-3 right-3" />
          <Badge className="absolute bottom-3 left-3" variant="secondary">
            {vehicle.city}
          </Badge>
        </div>
      </Link>
      <CardContent className="p-5">
        <Link href={`/vehicle/${vehicle.id}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold font-display">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-muted-foreground">{vehicle.year}</p>
            </div>
            {vehicle.rating !== null && <RatingPill rating={vehicle.rating} />}
          </div>

          <div className="mt-3">
            <VehicleSpecs vehicle={vehicle} />
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/40">
            <div>
              <span className="text-lg font-bold font-display">
                {formatPrice(vehicle.basePriceDay)}
              </span>
              <span className="text-sm text-muted-foreground">/día</span>
            </div>
            <Button size="sm" className="rounded-lg shadow-sm">
              Ver más
            </Button>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}

// =============================================
// LIST ITEM — horizontal card for list view
// =============================================
export function VehicleListItem({
  vehicle,
  isSelected,
  onHover,
}: {
  vehicle: VehicleCardData;
  isSelected?: boolean;
  onHover?: (id: string | null) => void;
}) {
  return (
    <Card
      className={`group overflow-hidden border-border/40 transition-all duration-200 hover:shadow-lg ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
      onMouseEnter={() => onHover?.(vehicle.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <Link href={`/vehicle/${vehicle.id}`}>
        <div className="flex flex-col sm:flex-row">
          {/* Image — left side */}
          <div className="relative w-full sm:w-72 md:w-80 shrink-0 aspect-[4/3] sm:aspect-auto sm:h-auto bg-muted overflow-hidden">
            {vehicle.images?.[0]?.url ? (
              <img
                src={vehicle.images[0].url}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover img-zoom sm:absolute sm:inset-0"
              />
            ) : (
              <VehicleImagePlaceholder className="w-full h-full sm:absolute sm:inset-0" />
            )}
            <FavoriteButton className="absolute top-3 right-3" />
            <Badge className="absolute bottom-3 left-3 sm:top-3 sm:bottom-auto" variant="secondary">
              <MapPin className="h-3 w-3 mr-1" />
              {vehicle.city}
            </Badge>
          </div>

          {/* Content — right side */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between min-h-[160px]">
            <div>
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold font-display">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-sm text-muted-foreground">{vehicle.year}</p>
                </div>
                {vehicle.rating !== null && <RatingPill rating={vehicle.rating} />}
              </div>

              {/* Specs */}
              <div className="mt-3">
                <VehicleSpecs vehicle={vehicle} size="md" />
              </div>

              {/* Host info */}
              <p className="mt-2 text-sm text-muted-foreground">
                Anfitrión: <span className="text-foreground font-medium">{vehicle.host.fullName}</span>
                {vehicle.reviewCount > 0 && (
                  <span className="ml-2">· {vehicle.reviewCount} reseña{vehicle.reviewCount !== 1 ? "s" : ""}</span>
                )}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/40">
              <div>
                <span className="text-xl font-bold font-display">
                  {formatPrice(vehicle.basePriceDay)}
                </span>
                <span className="text-sm text-muted-foreground">/día</span>
              </div>
              <Button className="rounded-lg shadow-sm px-6">
                Ver detalle
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}

// =============================================
// MAP CARD — compact card for map sidebar
// =============================================
export function VehicleMapCard({
  vehicle,
  isSelected,
  onHover,
}: {
  vehicle: VehicleCardData;
  isSelected?: boolean;
  onHover?: (id: string | null) => void;
}) {
  return (
    <Card
      className={`group overflow-hidden border-border/40 transition-all duration-200 hover:shadow-md cursor-pointer ${
        isSelected
          ? "ring-2 ring-primary shadow-md bg-primary/[0.02]"
          : ""
      }`}
      onMouseEnter={() => onHover?.(vehicle.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <Link href={`/vehicle/${vehicle.id}`}>
        <div className="flex gap-3 p-3">
          {/* Thumbnail */}
          <div className="relative w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
            {vehicle.images?.[0]?.url ? (
              <img
                src={vehicle.images[0].url}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <VehicleImagePlaceholder className="w-full h-full" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold font-display text-sm truncate">
                  {vehicle.make} {vehicle.model}
                </h4>
                {vehicle.rating !== null && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="h-3 w-3 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                    <span className="text-xs font-semibold">{vehicle.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {vehicle.year} · {vehicle.city}
              </p>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div>
                <span className="text-sm font-bold font-display">
                  {formatPrice(vehicle.basePriceDay)}
                </span>
                <span className="text-xs text-muted-foreground">/día</span>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Users className="h-3 w-3" />
                  {vehicle.seats}
                </span>
                <span className="flex items-center gap-0.5">
                  <Gauge className="h-3 w-3" />
                  {TRANSMISSION_LABELS[vehicle.transmission as keyof typeof TRANSMISSION_LABELS]?.substring(0, 4) || vehicle.transmission.substring(0, 4)}.
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
