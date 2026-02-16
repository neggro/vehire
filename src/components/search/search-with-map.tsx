"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  VEHICLE_FEATURES,
} from "@/constants";
import { formatPrice } from "@/lib/utils";
import { VehicleMap } from "@/components/map/vehicle-map";

// Mock data for demo with locations
const mockVehicles = [
  {
    id: "1",
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    city: "Montevideo",
    basePriceDay: 250000,
    images: [],
    features: ["ac", "bluetooth", "gps"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    rating: 4.8,
    reviewCount: 24,
    location: { lat: -34.9011, lng: -56.1645 },
  },
  {
    id: "2",
    make: "Volkswagen",
    model: "Polo",
    year: 2021,
    city: "Punta del Este",
    basePriceDay: 180000,
    images: [],
    features: ["ac", "bluetooth"],
    seats: 5,
    transmission: "manual",
    fuelType: "gasoline",
    rating: 4.6,
    reviewCount: 18,
    location: { lat: -34.9033, lng: -56.1882 },
  },
  {
    id: "3",
    make: "Chevrolet",
    model: "Cruze",
    year: 2023,
    city: "Montevideo",
    basePriceDay: 300000,
    images: [],
    features: ["ac", "bluetooth", "gps", "backup_camera"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    rating: 4.9,
    reviewCount: 32,
    location: { lat: -34.9055, lng: -56.1523 },
  },
  {
    id: "4",
    make: "Renault",
    model: "Sandero",
    year: 2020,
    city: "Colonia",
    basePriceDay: 150000,
    images: [],
    features: ["ac"],
    seats: 5,
    transmission: "manual",
    fuelType: "gasoline",
    rating: 4.5,
    reviewCount: 12,
    location: { lat: -34.9077, lng: -56.2011 },
  },
  {
    id: "5",
    make: "Hyundai",
    model: "Tucson",
    year: 2022,
    city: "Montevideo",
    basePriceDay: 350000,
    images: [],
    features: ["ac", "bluetooth", "gps", "backup_camera", "cruise_control"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    rating: 4.7,
    reviewCount: 28,
    location: { lat: -34.8999, lng: -56.1399 },
  },
  {
    id: "6",
    make: "Fiat",
    model: "Cronos",
    year: 2021,
    city: "Montevideo",
    basePriceDay: 160000,
    images: [],
    features: ["ac", "bluetooth"],
    seats: 5,
    transmission: "manual",
    fuelType: "gasoline",
    rating: 4.4,
    reviewCount: 15,
    location: { lat: -34.9122, lng: -56.1755 },
  },
];

type ViewMode = "grid" | "list" | "map";

function VehicleCard({ vehicle, compact = false }: { vehicle: typeof mockVehicles[0]; compact?: boolean }) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-[4/3] bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🚗</span>
        </div>
        <button className="absolute top-3 right-3 rounded-full bg-white/80 p-2 hover:bg-white transition-colors">
          <Heart className="h-4 w-4" />
        </button>
        <Badge className="absolute bottom-3 left-3" variant="secondary">
          {vehicle.city}
        </Badge>
      </div>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">{vehicle.year}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{vehicle.rating}</span>
          </div>
        </div>

        {!compact && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {vehicle.seats}
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              {TRANSMISSION_LABELS[vehicle.transmission]}
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="h-4 w-4" />
              {FUEL_TYPE_LABELS[vehicle.fuelType]}
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
      </CardContent>
    </Card>
  );
}

interface SearchFiltersProps {
  showMobile?: boolean;
  onClose?: () => void;
}

function SearchFilters({ showMobile, onClose }: SearchFiltersProps) {
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
          <Input placeholder="Ciudad o dirección" className="pl-10" />
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Fechas</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Inicio" className="pl-10" />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Fin" className="pl-10" />
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Precio por día</label>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Mín" type="number" />
          <Input placeholder="Máx" type="number" />
        </div>
      </div>

      {/* Vehicle Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Transmisión</label>
        <Select>
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
        <Select>
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
        <Select>
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

      {/* Features */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Características</label>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_FEATURES.slice(0, 6).map((feature) => (
            <Badge
              key={feature.id}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
            >
              {feature.label}
            </Badge>
          ))}
        </div>
      </div>

      <Button className="w-full">
        <Search className="mr-2 h-4 w-4" />
        Aplicar filtros
      </Button>
    </div>
  );
}

export default function SearchWithMap() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleMarkerClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setViewMode("list");
    // Scroll to the vehicle card
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
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 md:flex-none">
                <Calendar className="mr-2 h-4 w-4" />
                Fechas
              </Button>
              <Button
                variant="outline"
                className="flex-1 md:flex-none lg:hidden"
                onClick={() => setShowMobileFilters(true)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button className="flex-1 md:flex-none">
                <Search className="mr-2 h-4 w-4" />
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
                <SearchFilters />
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <main>
            {/* Results Header */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  {mockVehicles.length}
                </span>{" "}
                vehículos encontrados
              </p>
              <div className="flex items-center gap-2">
                <Select defaultValue="relevance">
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

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {mockVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {mockVehicles.map((vehicle) => (
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
            {viewMode === "map" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[600px]">
                  <VehicleMap
                    vehicles={mockVehicles.map((v) => ({
                      id: v.id,
                      location: v.location,
                      title: `${v.make} ${v.model}`,
                      price: v.basePriceDay,
                    }))}
                    onMarkerClick={handleMarkerClick}
                    selectedVehicleId={selectedVehicleId}
                    className="h-full"
                  />
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {mockVehicles.map((vehicle) => (
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
            {viewMode !== "map" && (
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg">
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
            <SearchFilters showMobile onClose={() => setShowMobileFilters(false)} />
          </Card>
        </div>
      )}
    </div>
  );
}
