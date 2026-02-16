import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Users,
  Fuel,
  Gauge,
  Star,
  Heart,
  Share2,
  Shield,
  Clock,
  CheckCircle,
  MessageCircle,
} from "lucide-react";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS, VEHICLE_FEATURES } from "@/constants";

// Types
interface Review {
  id: string;
  rating: number;
  comment: string;
  author: string;
  date: string;
}

// Mock vehicle data for demo (will be replaced with real data)
const mockVehicle = {
  id: "1",
  make: "Toyota",
  model: "Corolla",
  year: 2022,
  color: "Blanco Perla",
  city: "Montevideo",
  basePriceDay: 250000,
  weekendPriceDay: 300000,
  description: "Excelente Toyota Corolla 2022 en perfectas condiciones. Ideal para viajes de negocios o vacaciones familiares. El auto cuenta con todos los servicios al día y se entrega impecable.\n\nPerfecto para recorrer Uruguay con comodidad y seguridad. Incluye seguro completo y asistencia en carretera 24/7.",
  features: ["ac", "bluetooth", "gps", "usb", "backup_camera", "cruise_control"],
  seats: 5,
  transmission: "automatic",
  fuelType: "gasoline",
  mileage: 25000,
  mileageLimit: 300,
  deliveryAvailable: true,
  deliveryPrice: 50000,
  images: [],
  host: {
    id: "host1",
    fullName: "Carlos Rodríguez",
    avatarUrl: null,
    responseTime: "1 hora",
    rating: 4.9,
    reviewCount: 47,
    tripsCount: 89,
    memberSince: "2023-01-15",
  },
  location: {
    lat: -34.9011,
    lng: -56.1645,
    address: "Pocitos, Montevideo",
  },
  rating: 4.8,
  reviewCount: 24,
  rules: [
    "No fumar en el vehículo",
    "No se permiten mascotas",
    "Devolver con el mismo nivel de combustible",
    "Máximo 300 km por día",
  ],
};

const reviews = [
  {
    id: "1",
    rating: 5,
    comment: "Excelente auto, muy bien cuidado. El anfitrión muy amable y puntual. Sin duda lo volvería a alquilar.",
    author: "María García",
    date: "2024-01-15",
  },
  {
    id: "2",
    rating: 5,
    comment: "Todo perfecto, el auto está impecable y funciona de maravilla. Muy recomendado.",
    author: "Juan Pérez",
    date: "2024-01-10",
  },
  {
    id: "3",
    rating: 4,
    comment: "Muy buena experiencia. El auto cumplió con todas las expectativas.",
    author: "Ana Martínez",
    date: "2024-01-05",
  },
];

function ImageGallery() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-8xl">🚗</span>
      </div>
      {/* Navigation arrows */}
      <button className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white">
        <ChevronRight className="h-5 w-5" />
      </button>
      {/* Image counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
        1 / 5
      </div>
      {/* Actions */}
      <div className="absolute right-4 top-4 flex gap-2">
        <button className="rounded-full bg-white/80 p-2 shadow-lg hover:bg-white">
          <Share2 className="h-5 w-5" />
        </button>
        <button className="rounded-full bg-white/80 p-2 shadow-lg hover:bg-white">
          <Heart className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function VehicleInfo({ vehicle }: { vehicle: typeof mockVehicle }) {
  return (
    <div className="space-y-6">
      {/* Title and rating */}
      <div>
        <h1 className="text-3xl font-bold">
          {vehicle.make} {vehicle.model} {vehicle.year}
        </h1>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{vehicle.rating}</span>
            <span className="text-muted-foreground">({vehicle.reviewCount} reseñas)</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{vehicle.city}</span>
          </div>
        </div>
      </div>

      {/* Quick specs */}
      <div className="flex flex-wrap gap-4">
        <Badge variant="secondary" className="gap-1 px-3 py-1">
          <Users className="h-4 w-4" />
          {vehicle.seats} asientos
        </Badge>
        <Badge variant="secondary" className="gap-1 px-3 py-1">
          <Gauge className="h-4 w-4" />
          {TRANSMISSION_LABELS[vehicle.transmission]}
        </Badge>
        <Badge variant="secondary" className="gap-1 px-3 py-1">
          <Fuel className="h-4 w-4" />
          {FUEL_TYPE_LABELS[vehicle.fuelType]}
        </Badge>
        <Badge variant="secondary" className="gap-1 px-3 py-1">
          {vehicle.color}
        </Badge>
      </div>

      {/* Description */}
      <div>
        <h2 className="mb-2 text-xl font-semibold">Descripción</h2>
        <p className="whitespace-pre-line text-muted-foreground">
          {vehicle.description}
        </p>
      </div>

      {/* Features */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Características</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {vehicle.features.map((featureId) => {
            const feature = VEHICLE_FEATURES.find((f) => f.id === featureId);
            if (!feature) return null;
            return (
              <div
                key={featureId}
                className="flex items-center gap-2 rounded-lg border p-3"
              >
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm">{feature.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Reglas del vehículo</h2>
        <ul className="space-y-2">
          {vehicle.rules.map((rule, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mileage info */}
      {vehicle.mileageLimit && (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Kilometraje:</strong> {vehicle.mileageLimit} km por día incluidos.
            Kilómetros adicionales: $50 por km.
          </p>
        </div>
      )}
    </div>
  );
}

function BookingCard({ vehicle }: { vehicle: typeof mockVehicle }) {
  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold">{formatPrice(vehicle.basePriceDay)}</span>
            <span className="text-muted-foreground">/día</span>
          </div>
          {vehicle.weekendPriceDay && (
            <span className="text-sm text-muted-foreground">
              Finde: {formatPrice(vehicle.weekendPriceDay)}/día
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date picker placeholder */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-3">
            <label className="text-xs text-muted-foreground">Retiro</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Seleccionar fecha</span>
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <label className="text-xs text-muted-foreground">Devolución</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Seleccionar fecha</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border p-3">
          <label className="text-xs text-muted-foreground">Ubicación</label>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{vehicle.location.address}</span>
          </div>
        </div>

        {/* Delivery option */}
        {vehicle.deliveryAvailable && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Entrega a domicilio</span>
            </div>
            <span className="text-sm font-medium">
              +{formatPrice(vehicle.deliveryPrice!)}
            </span>
          </div>
        )}

        {/* Price summary */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>--</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Depósito de garantía</span>
            <span>--</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>Selecciona fechas</span>
          </div>
        </div>

        <Button className="w-full" size="lg">
          Reservar
        </Button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Seguro incluido</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Cancelación gratis</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HostCard({ host }: { host: typeof mockVehicle.host }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={host.avatarUrl || ""} />
            <AvatarFallback className="text-lg">
              {host.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{host.fullName}</h3>
              <Badge variant="secondary" className="text-xs">
                Super Anfitrión
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{host.rating}</span>
              <span>({host.reviewCount} reseñas)</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>{host.tripsCount} viajes completados</p>
              <p>Miembro desde {new Date(host.memberSince).getFullYear()}</p>
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Responde en {host.responseTime}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" />
            Contactar
          </Button>
          <Button variant="outline" className="w-full">
            Ver perfil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewsSection({ reviews }: { reviews: Review[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Reseñas ({reviews.length})
        </h2>
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">4.8</span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{review.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.date).toLocaleDateString("es-UY", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-muted-foreground">{review.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="w-full">
        Ver todas las reseñas
      </Button>
    </div>
  );
}

function LocationMap() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ubicación</h2>
      <div className="aspect-[2/1] overflow-hidden rounded-xl bg-muted">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Pocitos, Montevideo
            </p>
            <p className="text-xs text-muted-foreground">
              Ubicación exacta tras confirmar reserva
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VehiclePageProps {
  params: Promise<{ id: string }>;
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  const { id } = await params;

  // In production, fetch vehicle from database
  // const supabase = await getServerClient();
  // const { data: vehicle } = await supabase
  //   .from("vehicles")
  //   .select(`
  //     *,
  //     host:users(*),
  //     images:vehicle_images(*),
  //     reviews(*)
  //   `)
  //   .eq("id", id)
  //   .single();

  // if (!vehicle) {
  //   notFound();
  // }

  const vehicle = mockVehicle;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container py-4">
          <Link
            href="/search"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a búsqueda
          </Link>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main content */}
          <div className="space-y-8">
            <ImageGallery />
            <VehicleInfo vehicle={vehicle} />
            <LocationMap />
            <ReviewsSection reviews={reviews} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BookingCard vehicle={vehicle} />
            <HostCard host={vehicle.host} />
          </div>
        </div>
      </div>
    </div>
  );
}
