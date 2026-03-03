import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS, VEHICLE_FEATURES } from "@/constants";
import { BookingCard } from "./booking-card";
import { ImageGallery } from "./image-gallery";

// Types
interface VehiclePageProps {
  params: Promise<{ id: string }>;
}

interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  city: string;
  state: string | null;
  country: string;
  address: string | null;
  description: string | null;
  basePriceDay: number;
  weekendPriceDay: number | null;
  estimatedValue: number | null;
  deliveryAvailable: boolean;
  deliveryPrice: number | null;
  features: string[];
  seats: number;
  transmission: string;
  fuelType: string;
  mileage: number | null;
  mileageLimit: number | null;
  status: string;
  images: { id: string; url: string; order: number; isPrimary: boolean }[];
  location: {
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
  rating: number | null;
  reviewCount: number;
  tripsCount: number;
  host: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    rating: number | null;
    reviewCount: number;
    tripsCount: number;
    memberSince: Date;
  };
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    author: string;
    authorAvatar: string | null;
  }[];
  rules: string[];
}

async function getVehicle(id: string): Promise<VehicleData | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      color: true,
      city: true,
      state: true,
      country: true,
      address: true,
      description: true,
      basePriceDay: true,
      weekendPriceDay: true,
      estimatedValue: true,
      deliveryAvailable: true,
      deliveryPrice: true,
      status: true,
      features: true,
      seats: true,
      transmission: true,
      fuelType: true,
      mileage: true,
      mileageLimit: true,
      locationLat: true,
      locationLng: true,
      locationPublicLat: true,
      locationPublicLng: true,
      createdAt: true,
      host: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          createdAt: true,
          reviewsReceived: {
            where: { isPublic: true },
            select: { rating: true },
          },
          vehicles: {
            select: { id: true },
            where: { status: "ACTIVE" },
          },
        },
      },
      images: {
        select: { id: true, url: true, order: true, isPrimary: true },
        orderBy: { order: "asc" },
      },
      bookings: {
        where: {
          status: { in: ["COMPLETED"] },
          review: { isNot: null },
        },
        select: {
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              reviewer: {
                select: { fullName: true, avatarUrl: true },
              },
            },
          },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          bookings: {
            where: { status: "COMPLETED" },
          },
        },
      },
    },
  });

  if (!vehicle) return null;

  // Only return active or paused vehicles to public
  if (vehicle.status !== "ACTIVE" && vehicle.status !== "PAUSED") {
    return null;
  }

  // Calculate host stats
  const hostReviewCount = vehicle.host.reviewsReceived.length;
  const hostRating = hostReviewCount > 0
    ? vehicle.host.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / hostReviewCount
    : null;

  // Calculate vehicle rating from reviews
  const reviews = vehicle.bookings
    .map((b) => b.review)
    .filter(Boolean);
  const reviewCount = reviews.length;
  const rating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviewCount
    : null;

  // Build rules array
  const rules = [
    "No fumar en el vehículo",
    "No se permiten mascotas",
    "Devolver con el mismo nivel de combustible",
    vehicle.mileageLimit ? `Máximo ${vehicle.mileageLimit} km por día` : null,
  ].filter(Boolean) as string[];

  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    city: vehicle.city,
    state: vehicle.state,
    country: vehicle.country,
    address: vehicle.locationPublicLat ? null : vehicle.address,
    description: vehicle.description,
    basePriceDay: vehicle.basePriceDay,
    weekendPriceDay: vehicle.weekendPriceDay,
    estimatedValue: vehicle.estimatedValue,
    deliveryAvailable: vehicle.deliveryAvailable,
    deliveryPrice: vehicle.deliveryPrice,
    features: vehicle.features,
    seats: vehicle.seats,
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    mileage: vehicle.mileage,
    mileageLimit: vehicle.mileageLimit,
    status: vehicle.status,
    images: vehicle.images,
    location: {
      lat: vehicle.locationPublicLat || vehicle.locationLat,
      lng: vehicle.locationPublicLng || vehicle.locationLng,
      address: vehicle.locationPublicLat
        ? `${vehicle.city}${vehicle.state ? `, ${vehicle.state}` : ""}`
        : vehicle.address,
    },
    rating: rating ? Math.round(rating * 10) / 10 : null,
    reviewCount,
    tripsCount: vehicle._count.bookings,
    host: {
      id: vehicle.host.id,
      fullName: vehicle.host.fullName,
      avatarUrl: vehicle.host.avatarUrl,
      rating: hostRating ? Math.round(hostRating * 10) / 10 : null,
      reviewCount: hostReviewCount,
      tripsCount: vehicle.host.vehicles.length,
      memberSince: vehicle.host.createdAt,
    },
    reviews: reviews.map((r) => ({
      id: r!.id,
      rating: r!.rating,
      comment: r!.comment,
      createdAt: r!.createdAt,
      author: r!.reviewer.fullName,
      authorAvatar: r!.reviewer.avatarUrl,
    })),
    rules,
  };
}

function VehicleInfo({ vehicle }: { vehicle: VehicleData }) {
  return (
    <div className="space-y-6">
      {/* Title and rating */}
      <div>
        <h1 className="text-3xl font-bold">
          {vehicle.make} {vehicle.model} {vehicle.year}
        </h1>
        <div className="mt-2 flex items-center gap-4">
          {vehicle.rating && (
            <>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{vehicle.rating}</span>
                <span className="text-muted-foreground">({vehicle.reviewCount} reseñas)</span>
              </div>
              <span className="text-muted-foreground">•</span>
            </>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ""}</span>
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
          {TRANSMISSION_LABELS[vehicle.transmission] || vehicle.transmission}
        </Badge>
        <Badge variant="secondary" className="gap-1 px-3 py-1">
          <Fuel className="h-4 w-4" />
          {FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType}
        </Badge>
        <Badge variant="secondary" className="gap-1 px-3 py-1">
          {vehicle.color}
        </Badge>
      </div>

      {/* Description */}
      {vehicle.description && (
        <div>
          <h2 className="mb-2 text-xl font-semibold">Descripción</h2>
          <p className="whitespace-pre-line text-muted-foreground">
            {vehicle.description}
          </p>
        </div>
      )}

      {/* Features */}
      {vehicle.features.length > 0 && (
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
      )}

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

function HostCard({ host }: { host: VehicleData["host"] }) {
  const isSuperHost = host.rating && host.rating >= 4.8 && host.reviewCount >= 10;

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
              {isSuperHost && (
                <Badge variant="secondary" className="text-xs">
                  Super Anfitrión
                </Badge>
              )}
            </div>
            {host.rating && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{host.rating}</span>
                <span>({host.reviewCount} reseñas)</span>
              </div>
            )}
            <div className="mt-2 text-sm text-muted-foreground">
              <p>{host.tripsCount} vehículos activos</p>
              <p>Miembro desde {new Date(host.memberSince).getFullYear()}</p>
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

function ReviewsSection({ reviews, rating }: { reviews: VehicleData["reviews"]; rating: number | null }) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Reseñas ({reviews.length})
        </h2>
        {rating && (
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{rating}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {reviews.slice(0, 5).map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={review.authorAvatar || ""} />
                    <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{review.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("es-UY", {
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
              {review.comment && (
                <p className="mt-3 text-muted-foreground">{review.comment}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length > 5 && (
        <Button variant="outline" className="w-full">
          Ver todas las reseñas
        </Button>
      )}
    </div>
  );
}

function LocationMap({ vehicle }: { vehicle: VehicleData }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ubicación</h2>
      <div className="aspect-[2/1] overflow-hidden rounded-xl bg-muted">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {vehicle.location.address || vehicle.city}
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

export default async function VehiclePage({ params }: VehiclePageProps) {
  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

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
            <ImageGallery images={vehicle.images} vehicleName={`${vehicle.make} ${vehicle.model}`} />
            <VehicleInfo vehicle={vehicle} />
            <LocationMap vehicle={vehicle} />
            <ReviewsSection reviews={vehicle.reviews} rating={vehicle.rating} />
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
