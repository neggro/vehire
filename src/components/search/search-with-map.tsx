"use client";

import { useState, useEffect, useCallback } from "react";
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
  Calendar,
  Users,
  Fuel,
  Gauge,
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

function VehicleCard({ vehicle, compact = false }: { vehicle: Vehicle; compact?: boolean }) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/vehicle/${vehicle.id}`}>
        <div className="relative aspect-[4/3] bg-muted">
          {vehicle.images?.[0]?.url ? (
            <img
              src={vehicle.images[0].url}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">🚗</span>
            </div>
          )}
          <button
            className="absolute top-3 right-3 rounded-full bg-white/80 p-2 hover:bg-white transition-colors"
            onClick={(e) => {
              e.preventDefault();
              // TODO: Implement favorites
            }}
          >
            <Heart className="h-4 w-4" />
          </button>
          <Badge className="absolute bottom-3 left-3" variant="secondary">
            {vehicle.city}
          </Badge>
        </div>
      </Link>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <Link href={`/vehicle/${vehicle.id}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-muted-foreground">{vehicle.year}</p>
            </div>
            {vehicle.rating !== null && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{vehicle.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {!compact && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {vehicle.seats}
              </span>
              <span className="flex items-center gap-1">
                <Gauge className="h-4 w-4" />
                {TRANSMISSION_LABELS[vehicle.transmission as keyof typeof TRANSMISSION_LABELS] || vehicle.transmission}
              </span>
              <span className="flex items-center gap-1">
                <Fuel className="h-4 w-4" />
                {FUEL_TYPE_LABELS[vehicle.fuelType as keyof typeof FUEL_TYPE_LABELS] || vehicle.fuelType}
              </span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold">
                {formatPrice(vehicle.basePriceDay)}
              </span>
              <span className="text-sm text-muted-foreground">/día</span>
            </div>
            <Button size="sm" asChild>
              <Link href={`/vehicle/${vehicle.id}`}>Ver más</Link>
            </Button>
          </div>
        </Link>
      </CardContent>
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
    <div className={`space-y-6 ${showMobile ? "p-6" : ""}`}>
      {showMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Filtros</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Ubicación</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ciudad o dirección"
            className="pl-10"
            value={filters.city}
            onChange={(e) => onFilterChange("city", e.target.value)}
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Precio por día ($U)</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Mín"
            type="number"
            value={filters.minPrice}
            onChange={(e) => onFilterChange("minPrice", e.target.value)}
          />
          <Input
            placeholder="Máx"
            type="number"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange("maxPrice", e.target.value)}
          />
        </div>
      </div>

      {/* Transmission */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Transmisión</label>
        <Select
          value={filters.transmission}
          onValueChange={(value) => onFilterChange("transmission", value)}
        >
          <SelectTrigger>
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Combustible</label>
        <Select
          value={filters.fuelType}
          onValueChange={(value) => onFilterChange("fuelType", value)}
        >
          <SelectTrigger>
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
      <div className="space-y-2">
        <label className="text-sm font-medium">Asientos</label>
        <Select
          value={filters.minSeats}
          onValueChange={(value) => onFilterChange("minSeats", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Cualquiera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquiera</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
            <SelectItem value="5">5+</SelectItem>
            <SelectItem value="7">7+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Button className="w-full" onClick={onApply}>
          <Search className="mr-2 h-4 w-4" />
          Aplicar filtros
        </Button>
        <Button variant="outline" className="w-full" onClick={onReset}>
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

  // Search function
  const searchVehicles = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.city) params.append("city", filters.city);
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
  }, [filters, sortBy]);

  // Initial search and when filters/sort change
  useEffect(() => {
    searchVehicles(1);
  }, [searchVehicles]);

  // Update URL with filters
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    router.push(`/search?${params.toString()}`, { scroll: false });
  }, [filters.city, router]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    updateUrl();
    searchVehicles(1);
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
    router.push("/search", { scroll: false });
  };

  const handleLoadMore = () => {
    if (pagination.hasMore) {
      searchVehicles(pagination.page + 1);
    }
  };

  const handleMarkerClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setViewMode("list");
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
      <div className="border-b bg-background">
        <div className="container py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ciudad o ubicación..."
                className="pl-10"
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleApplyFilters();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 md:flex-none lg:hidden"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button
                className="flex-1 md:flex-none"
                onClick={handleApplyFilters}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Buscar
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
            <Card className="sticky top-4">
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
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No se encontraron vehículos con los filtros seleccionados
                </p>
                <Button variant="outline" onClick={handleResetFilters}>
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
                  <div
                    key={vehicle.id}
                    id={`vehicle-${vehicle.id}`}
                    className={`transition-all duration-200 ${
                      selectedVehicleId === vehicle.id
                        ? "ring-2 ring-primary rounded-lg"
                        : ""
                    }`}
                  >
                    <VehicleCard vehicle={vehicle} />
                  </div>
                ))}
              </div>
            )}

            {/* Map View */}
            {viewMode === "map" && vehicles.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[600px]">
                  <VehicleMap
                    vehicles={vehicles
                      .filter((v) => v.city) // Only vehicles with location
                      .map((v) => ({
                        id: v.id,
                        location: { lat: -34.9011, lng: -56.1645 }, // TODO: Get real coordinates
                        title: `${v.make} ${v.model}`,
                        price: v.basePriceDay,
                      }))}
                    onMarkerClick={handleMarkerClick}
                    selectedVehicleId={selectedVehicleId}
                    className="h-full"
                  />
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      id={`vehicle-${vehicle.id}`}
                      className={`transition-all duration-200 ${
                        selectedVehicleId === vehicle.id
                          ? "ring-2 ring-primary rounded-lg"
                          : ""
                      }`}
                      onMouseEnter={() => setSelectedVehicleId(vehicle.id)}
                      onMouseLeave={() => setSelectedVehicleId(null)}
                    >
                      <VehicleCard vehicle={vehicle} />
                    </div>
                  ))}
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
