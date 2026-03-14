"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Car,
  SlidersHorizontal,
  Grid3X3,
  List,
  Map,
  X,
  Loader2,
} from "lucide-react";
import { VehicleMap } from "@/components/map/vehicle-map";
import { PlacesAutocomplete } from "./places-autocomplete";
import { DateRangeWithTime } from "./date-range-picker";
import {
  VehicleCard,
  VehicleListItem,
  VehicleMapCard,
  type VehicleCardData,
} from "./vehicle-cards";
import { getUserFavoriteIds } from "@/actions/favorites";
import { createClient } from "@/lib/supabase/client";

interface SearchResponse {
  vehicles: VehicleCardData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

type ViewMode = "grid" | "list" | "map";

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
  const [vehicles, setVehicles] = useState<VehicleCardData[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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

  // Fetch user auth state and favorites on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsLoggedIn(true);
        getUserFavoriteIds().then((ids) => setFavoriteIds(new Set(ids)));
      }
    });
  }, []);

  // Search key for deduplication
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
      sortBy,
    });
  }, [filters, dateRange, sortBy]);

  const lastSearchedRef = useRef<string>("");

  // Search function
  const searchVehicles = useCallback(async (page = 1) => {
    setIsLoading(true);
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

  // Auto-search with debounce when any filter/date/sort changes
  useEffect(() => {
    if (currentSearchKey === lastSearchedRef.current) return;

    const timeout = setTimeout(() => {
      lastSearchedRef.current = currentSearchKey;
      searchVehicles(1);

      // Update URL
      const params = new URLSearchParams();
      if (filters.city) params.set("city", filters.city);
      if (dateRange.startDate) params.set("startDate", dateRange.startDate.toISOString());
      if (dateRange.endDate) params.set("endDate", dateRange.endDate.toISOString());
      if (dateRange.startTime) params.set("startTime", dateRange.startTime);
      if (dateRange.endTime) params.set("endTime", dateRange.endTime);
      router.push(`/search?${params.toString()}`, { scroll: false });
    }, 400);

    return () => clearTimeout(timeout);
  }, [currentSearchKey, searchVehicles, filters.city, dateRange, router]);

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

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isLoading && !isLoadingMore.current) {
          isLoadingMore.current = true;
          searchVehicles(pagination.page + 1).finally(() => {
            isLoadingMore.current = false;
          });
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pagination.hasMore, pagination.page, isLoading, searchVehicles]);

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

            {isLoading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2 shrink-0" />
            )}
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
            <DateRangeWithTime
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              startTime={dateRange.startTime}
              endTime={dateRange.endTime}
              onChange={handleDateRangeChange}
              placeholder="Fechas"
              compact
              className="w-full h-11 rounded-xl"
            />
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
                    className="hidden sm:inline-flex rounded-none"
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 py-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card overflow-hidden">
                    <div className="aspect-[16/10] bg-muted animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="h-5 w-36 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
                        <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))}
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
                  <VehicleCard key={vehicle.id} vehicle={vehicle} isFavorite={favoriteIds.has(vehicle.id)} isLoggedIn={isLoggedIn} />
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
                      isFavorite={favoriteIds.has(vehicle.id)}
                      isLoggedIn={isLoggedIn}
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

            {/* Infinite scroll sentinel */}
            {viewMode !== "map" && pagination.hasMore && (
              <div ref={loadMoreRef} className="mt-8 flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
