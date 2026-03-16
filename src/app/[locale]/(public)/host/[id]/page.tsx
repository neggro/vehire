import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  Star,
  Users,
  Car,
  Calendar,
  Shield,
  CheckCircle,
  MessageCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { VehicleCard, type VehicleCardData } from "@/components/search/vehicle-cards";
import { PaginatedReviews, type ReviewData } from "@/components/reviews/paginated-reviews";
import { getTranslations } from "next-intl/server";

interface HostPageProps {
  params: Promise<{ id: string }>;
}

async function getHostProfile(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      createdAt: true,
      kycStatus: true,
      roles: true,
      vehicles: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          city: true,
          state: true,
          basePriceDay: true,
          weekendPriceDay: true,
          seats: true,
          transmission: true,
          fuelType: true,
          features: true,
          images: {
            select: { url: true },
            orderBy: { order: "asc" },
            take: 1,
          },
          bookings: {
            where: { status: "COMPLETED" },
            select: {
              id: true,
              review: {
                select: { rating: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      reviewsReceived: {
        where: { isPublic: true },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewer: {
            select: { fullName: true, avatarUrl: true },
          },
          booking: {
            select: {
              vehicle: {
                select: { make: true, model: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          bookingsAsHost: {
            where: { status: "COMPLETED" },
          },
        },
      },
    },
  });

  if (!user) return null;

  const isHost = user.roles.includes("HOST") || user.vehicles.length > 0;
  if (!isHost) return null;

  // Calculate overall rating
  const allReviews = user.reviewsReceived;
  const reviewCount = allReviews.length;
  const rating = reviewCount > 0
    ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
    : null;

  // Rating distribution
  const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allReviews.forEach((r) => {
    ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
  });

  const isSuperHost = rating !== null && rating >= 4.8 && reviewCount >= 10;

  // Format vehicles to match VehicleCardData
  const vehicles: VehicleCardData[] = user.vehicles.map((v) => {
    const vehicleReviews = v.bookings
      .map((b) => b.review)
      .filter((r): r is { rating: number } => r !== null);
    const vRating = vehicleReviews.length > 0
      ? Math.round((vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length) * 10) / 10
      : null;

    return {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      city: v.city,
      state: v.state,
      basePriceDay: v.basePriceDay,
      weekendPriceDay: v.weekendPriceDay,
      images: v.images,
      features: v.features,
      seats: v.seats,
      transmission: v.transmission,
      fuelType: v.fuelType,
      rating: vRating,
      reviewCount: vehicleReviews.length,
      host: {
        id: user.id,
        fullName: user.fullName,
      },
    };
  });

  // Format reviews
  const reviews: ReviewData[] = allReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    author: r.reviewer.fullName,
    authorAvatar: r.reviewer.avatarUrl,
    vehicleName: r.booking.vehicle
      ? `${r.booking.vehicle.make} ${r.booking.vehicle.model}`
      : "",
  }));

  const completedTrips = user._count.bookingsAsHost;
  const responseRate = completedTrips > 0 ? Math.min(100, 80 + Math.floor(completedTrips / 5)) : 0;

  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    memberSince: user.createdAt,
    kycVerified: user.kycStatus === "VERIFIED",
    rating,
    reviewCount,
    completedTrips,
    responseRate,
    isSuperHost,
    vehicles,
    reviews,
    ratingDistribution,
  };
}

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <div className="text-center space-y-1">
      <Icon className="h-5 w-5 mx-auto text-muted-foreground" />
      <p className="text-2xl font-bold font-display">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function HostProfilePage({ params }: HostPageProps) {
  const { id } = await params;
  const host = await getHostProfile(id);
  const t = await getTranslations("host.profile");
  const tc = await getTranslations("common");
  const tv = await getTranslations("vehicle.detail");

  if (!host) {
    notFound();
  }

  const memberMonths = Math.floor(
    (Date.now() - new Date(host.memberSince).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const memberYear = new Date(host.memberSince).getFullYear();
  const memberYears = Math.floor(memberMonths / 12);
  const memberDuration = memberMonths < 12
    ? `${memberMonths} ${t("months")}`
    : `${memberYears} ${memberYears > 1 ? t("years") : t("year")}`;

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
            {tc("nav.backToSearch")}
          </Link>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Host Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
              <AvatarImage src={host.avatarUrl || ""} />
              <AvatarFallback className="text-3xl font-display">
                {host.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-3xl font-bold font-display">{host.fullName}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {host.isSuperHost && (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      <Star className="h-3 w-3 fill-yellow-600 text-yellow-600 mr-1" />
                      {tv("superHost")}
                    </Badge>
                  )}
                  {host.kycVerified && (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {tc("labels.verified")}
                    </Badge>
                  )}
                </div>
              </div>

              {host.rating && (
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-lg">{host.rating}</span>
                  <span className="text-muted-foreground">({host.reviewCount} {tc("labels.reviews")})</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t("memberSince", { year: memberYear, duration: memberDuration })}
                </span>
                {host.kycVerified && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    {t("identityVerified")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <StatCard icon={Car} value={host.vehicles.length} label={t("activeVehicles")} />
                <StatCard icon={Users} value={host.completedTrips} label={t("completedTrips")} />
                <StatCard
                  icon={Star}
                  value={host.rating ? host.rating.toFixed(1) : "—"}
                  label={t("averageRating")}
                />
                <StatCard icon={MessageCircle} value={`${host.responseRate}%`} label={t("responseRate")} />
              </div>
            </CardContent>
          </Card>

          {/* Vehicles - using shared VehicleCard */}
          {host.vehicles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold font-display">
                {t("vehiclesOf", { name: host.fullName.split(" ")[0] })}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {host.vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            </div>
          )}

          {/* Reviews with pagination */}
          {host.reviewCount > 0 ? (
            <PaginatedReviews
              reviews={host.reviews}
              rating={host.rating}
              ratingDistribution={host.ratingDistribution}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                <h3 className="font-semibold mb-1">{t("noReviews")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("noReviewsDesc", { name: host.fullName.split(" ")[0] })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
