"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Users,
  Fuel,
  Gauge,
  Car,
  SlidersHorizontal,
  Grid3X3,
  List,
  Map,
  Star,
  Heart,
  X,
  Loader2,
} from "lucide-react";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
} from "@/constants";
import { formatPrice } from "@/lib/utils";
import { VehicleMap } from "@/components/map/vehicle-map";
import { PlacesAutocomplete } from "./places-autocomplete";
import { DateRangeWithTime } from "./date-range-picker";

interface Vehicle {
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

interface SearchResponse {
  vehicles: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

type ViewMode = "grid" | "list" | "map";

// -- Vehicle image placeholder --
function VehicleImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-primary/5 to-muted ${className}`}>
      <Car className="h-10 w-10 text-muted-foreground/30" />
    </div>
  );
}

// -- Rating pill --
function RatingPill({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 bg-[hsl(var(--gold))]/10 px-2 py-0.5 rounded-full">
      <Star className="h-3.5 w-3.5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
      <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}

// -- Favorite button --
function FavoriteButton({ className = "" }: { className?: string }) {
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
function VehicleSpecs({ vehicle, size = "sm" }: { vehicle: Vehicle; size?: "sm" | "md" }) {
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
function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
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
function VehicleListItem({
  vehicle,
  isSelected,
  onHover,
}: {
  vehicle: Vehicle;
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
function VehicleMapCard({
  vehicle,
  isSelected,
  onHover,
}: {
  vehicle: Vehicle;
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

interface SearchFiltersProps {
  filters: {
    city: string;
    minPrice: string;
    maxPrice: string;
    transmission: string;
    fuelType: string;
    minSeats: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  showMobile?: boolean;
  onClose?: () => void;
}

function SearchFilters({
  filters,
  onFilterChange,
  onApply,
  onReset,
  showMobile,
  onClose,
}: SearchFiltersProps) {
  return (
    <div className={`space-y-8 ${showMobile ? "p-6" : ""}`}>
      {showMobile && (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Filtros</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {/* Price Range */}
        <div className="space-y-3">
          <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Precio por día ($U)</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                placeholder="Mín"
                type="number"
                value={filters.minPrice}
                onChange={(e) => onFilterChange("minPrice", e.target.value)}
                className="pl-7 h-11"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                placeholder="Máx"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => onFilterChange("maxPrice", e.target.value)}
                className="pl-7 h-11"
              />
            </div>
          </div>
        </div>

        {/* Transmission */}
        <div className="space-y-3">
          <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Transmisión</label>
          <Select
            value={filters.transmission}
            onValueChange={(value) => onFilterChange("transmission", value)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="automatic">Automática</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fuel Type */}
        <div className="space-y-3">
          <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Combustible</label>
          <Select
            value={filters.fuelType}
            onValueChange={(value) => onFilterChange("fuelType", value)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="gasoline">Nafta</SelectItem>
              <SelectItem value="diesel">Diésel</SelectItem>
              <SelectItem value="electric">Eléctrico</SelectItem>
              <SelectItem value="hybrid">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seats */}
        <div className="space-y-3">
          <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Capacidad</label>
          <Select
            value={filters.minSeats}
            onValueChange={(value) => onFilterChange("minSeats", value)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquiera</SelectItem>
              <SelectItem value="2">2+ personas</SelectItem>
              <SelectItem value="4">4+ personas</SelectItem>
              <SelectItem value="5">5+ personas</SelectItem>
              <SelectItem value="7">7+ personas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <Button className="w-full h-12 text-base font-semibold shadow-md rounded-xl" onClick={onApply}>
          Aplicar filtros
        </Button>
        <Button variant="outline" className="w-full h-12 text-base rounded-xl" onClick={onReset}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}

export default function SearchWithMap() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [sortBy, setSortBy] = useState("relevance");

  // Filters state
  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "",
    minPrice: "",
    maxPrice: "",
    transmission: "all",
    fuelType: "all",
    minSeats: "all",
  });

  // Date/time state
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
    startTime: string;
    endTime: string;
  }>(() => {
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    return {
      startDate: startDateParam ? new Date(startDateParam) : undefined,
      endDate: endDateParam ? new Date(endDateParam) : undefined,
      startTime: searchParams.get("startTime") || "10:00",
      endTime: searchParams.get("endTime") || "10:00",
    };
  });

  // Track last-searched values to prevent redundant searches
  const lastSearchedRef = useRef<string>("");

  const currentSearchKey = useMemo(() => {
    return JSON.stringify({
      city: filters.city,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      transmission: filters.transmission,
      fuelType: filters.fuelType,
      minSeats: filters.minSeats,
      startDate: dateRange.startDate?.toISOString() || "",
      endDate: dateRange.endDate?.toISOString() || "",
      startTime: dateRange.startTime,
      endTime: dateRange.endTime,
    });
  }, [filters, dateRange]);

  const hasChanges = currentSearchKey !== lastSearchedRef.current;

  // Search function
  const searchVehicles = useCallback(async (page = 1, snapshot?: string) => {
    setIsLoading(true);
    if (snapshot) lastSearchedRef.current = snapshot;
    try {
      const params = new URLSearchParams();

      if (filters.city) params.append("city", filters.city);
      if (dateRange.startDate) {
        const startDateTime = new Date(dateRange.startDate);
        const [hours, minutes] = dateRange.startTime.split(":");
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        params.append("startDate", startDateTime.toISOString());
      }
      if (dateRange.endDate) {
        const endDateTime = new Date(dateRange.endDate);
        const [hours, minutes] = dateRange.endTime.split(":");
        endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        params.append("endDate", endDateTime.toISOString());
      }
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.transmission && filters.transmission !== "all") {
        params.append("transmission", filters.transmission);
      }
      if (filters.fuelType && filters.fuelType !== "all") {
        params.append("fuelType", filters.fuelType);
      }
      if (filters.minSeats && filters.minSeats !== "all") {
        params.append("minSeats", filters.minSeats);
      }
      params.append("sortBy", sortBy);
      params.append("page", page.toString());
      params.append("limit", "12");

      const response = await fetch(`/api/vehicles/search?${params.toString()}`);
      const data: SearchResponse = await response.json();

      if (page === 1) {
        setVehicles(data.vehicles);
      } else {
        setVehicles((prev) => [...prev, ...data.vehicles]);
      }
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error searching vehicles:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, dateRange, sortBy]);

  // Initial search on mount
  const initialSearchDone = useRef(false);
  useEffect(() => {
    if (!initialSearchDone.current) {
      initialSearchDone.current = true;
      lastSearchedRef.current = currentSearchKey;
      searchVehicles(1, currentSearchKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-search when sort changes
  useEffect(() => {
    if (initialSearchDone.current) {
      searchVehicles(1, currentSearchKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // Update URL with filters
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (dateRange.startDate) {
      params.set("startDate", dateRange.startDate.toISOString());
    }
    if (dateRange.endDate) {
      params.set("endDate", dateRange.endDate.toISOString());
    }
    if (dateRange.startTime) params.set("startTime", dateRange.startTime);
    if (dateRange.endTime) params.set("endTime", dateRange.endTime);
    router.push(`/search?${params.toString()}`, { scroll: false });
  }, [filters.city, dateRange, router]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (range: {
    startDate?: Date;
    endDate?: Date;
    startTime: string;
    endTime: string;
  }) => {
    setDateRange(range);
  };

  const handleApplyFilters = () => {
    if (!hasChanges && !isLoading) return;
    updateUrl();
    searchVehicles(1, currentSearchKey);
    setShowMobileFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      city: "",
      minPrice: "",
      maxPrice: "",
      transmission: "all",
      fuelType: "all",
      minSeats: "all",
    });
    setDateRange({
      startDate: undefined,
      endDate: undefined,
      startTime: "10:00",
      endTime: "10:00",
    });
    router.push("/search", { scroll: false });
  };

  const handleLoadMore = () => {
    if (pagination.hasMore) {
      searchVehicles(pagination.page + 1);
    }
  };

  const handleMarkerClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    // Scroll to the card in the sidebar (works for both map and list views)
    setTimeout(() => {
      const element = document.getElementById(`vehicle-${vehicleId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Search Header */}
      <div className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container py-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center w-full max-w-5xl mx-auto bg-background border border-border/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 p-1.5 gap-1">
            {/* Location */}
            <div className="flex-[1.5] min-w-[280px]">
              <PlacesAutocomplete
                value={filters.city}
                onChange={(value) => handleFilterChange("city", value)}
                placeholder="¿Dónde quieres retirar el vehículo?"
                variant="ghost"
              />
            </div>

            <div className="h-8 w-px bg-border my-auto mx-1" />

            {/* Date Range Picker */}
            <div className="flex-1 min-w-[240px]">
              <DateRangeWithTime
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                startTime={dateRange.startTime}
                endTime={dateRange.endTime}
                onChange={handleDateRangeChange}
                placeholder="¿Cuándo?"
                className="w-full border-none shadow-none bg-transparent h-12 hover:bg-transparent focus:ring-0"
              />
            </div>

            {/* Search Button */}
            <Button
              onClick={handleApplyFilters}
              disabled={isLoading || !hasChanges}
              className="rounded-full h-12 min-w-[130px] px-6 ml-1 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="font-semibold">Buscando</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Buscar</span>
                </>
              )}
            </Button>
          </div>

          {/* Mobile Layout */}
          <div className="flex md:hidden flex-col gap-3">
            <div className="flex items-center gap-2 p-1 bg-background border rounded-xl shadow-sm">
              <PlacesAutocomplete
                value={filters.city}
                onChange={(value) => handleFilterChange("city", value)}
                placeholder="¿A dónde vas?"
                className="flex-1"
              />
              <div className="w-px h-6 bg-border" />
              <Button
                onClick={() => setShowMobileFilters(true)}
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <DateRangeWithTime
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                startTime={dateRange.startTime}
                endTime={dateRange.endTime}
                onChange={handleDateRangeChange}
                placeholder="Fechas"
                compact
                className="flex-1 h-11 rounded-xl"
              />
              <Button
                onClick={handleApplyFilters}
                disabled={isLoading || !hasChanges}
                className="shrink-0 h-11 min-w-[52px] px-4 rounded-xl"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <SearchFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onApply={handleApplyFilters}
                  onReset={handleResetFilters}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <main>
            {/* Results Header */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                {isLoading ? (
                  "Buscando..."
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {pagination.total}
                    </span>{" "}
                    vehículos encontrados
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value)}
                >
                  <SelectTrigger className="w-[180px] hidden sm:flex">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevancia</SelectItem>
                    <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="rating">Mejor calificados</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode("map")}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && vehicles.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Empty State */}
            {!isLoading && vehicles.length === 0 && (
              <div className="text-center py-20">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                  <Car className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">No se encontraron vehículos</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Intenta ajustar los filtros o buscar en otra ubicación
                </p>
                <Button variant="outline" onClick={handleResetFilters} className="rounded-xl">
                  Limpiar filtros
                </Button>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && vehicles.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && vehicles.length > 0 && (
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} id={`vehicle-${vehicle.id}`}>
                    <VehicleListItem
                      vehicle={vehicle}
                      isSelected={selectedVehicleId === vehicle.id}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Map View */}
            {viewMode === "map" && vehicles.length > 0 && (
              <div className="grid gap-0 lg:grid-cols-[1fr_380px] rounded-xl overflow-hidden border border-border/40 shadow-sm bg-background">
                {/* Map panel */}
                <div className="h-[500px] lg:h-[calc(100vh-220px)] min-h-[400px] relative">
                  <VehicleMap
                    vehicles={vehicles
                      .filter((v) => v.city)
                      .map((v) => ({
                        id: v.id,
                        location: { lat: -34.9011, lng: -56.1645 },
                        title: `${v.make} ${v.model}`,
                        price: v.basePriceDay,
                      }))}
                    onMarkerClick={handleMarkerClick}
                    selectedVehicleId={selectedVehicleId}
                    className="h-full"
                  />
                  {/* Vehicle count overlay */}
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md rounded-lg px-3 py-1.5 shadow-md border border-border/40">
                    <span className="text-xs font-semibold font-display">
                      {vehicles.length} vehículo{vehicles.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Card sidebar */}
                <div className="border-t lg:border-t-0 lg:border-l border-border/40 flex flex-col">
                  {/* Sidebar header */}
                  <div className="px-4 py-3 border-b border-border/40 bg-muted/30 shrink-0">
                    <h3 className="font-display font-semibold text-sm">Resultados</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pasa el mouse sobre una tarjeta para ver en el mapa
                    </p>
                  </div>
                  {/* Scrollable cards */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[300px] lg:max-h-none">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} id={`vehicle-${vehicle.id}`}>
                        <VehicleMapCard
                          vehicle={vehicle}
                          isSelected={selectedVehicleId === vehicle.id}
                          onHover={setSelectedVehicleId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Load More */}
            {viewMode !== "map" && pagination.hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Cargar más resultados
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Dialog */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <Card className="absolute inset-y-0 left-0 w-full max-w-sm overflow-y-auto">
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              showMobile
              onClose={() => setShowMobileFilters(false)}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
