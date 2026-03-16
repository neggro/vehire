import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { FavoritesGrid } from "./favorites-grid";
import type { VehicleCardData } from "@/components/search/vehicle-cards";
import { getTranslations } from "next-intl/server";

export default async function FavoritesPage() {
  const t = await getTranslations("dashboard.favorites");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: {
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
          status: true,
          images: {
            select: { url: true },
            orderBy: { order: "asc" },
            take: 1,
          },
          host: {
            select: { id: true, fullName: true },
          },
          bookings: {
            where: { review: { isNot: null } },
            select: {
              review: { select: { rating: true } },
            },
          },
        },
      },
    },
  });

  // Map to VehicleCardData and filter out inactive vehicles
  const vehicles: VehicleCardData[] = favorites
    .filter((f) => f.vehicle.status === "ACTIVE")
    .map((f) => {
      const v = f.vehicle;
      const reviews = v.bookings.map((b) => b.review).filter(Boolean);
      const rating = reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviews.length) * 10) / 10
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
        rating,
        reviewCount: reviews.length,
        host: v.host,
      };
    });

  const favoriteIds = vehicles.map((v) => v.id);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backToDashboard")}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight font-display">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {vehicles.length > 0
            ? vehicles.length === 1
              ? t("vehicleCount", { count: vehicles.length })
              : t("vehicleCountPlural", { count: vehicles.length })
            : t("noFavoritesYet")}
        </p>
      </div>

      {vehicles.length > 0 ? (
        <FavoritesGrid vehicles={vehicles} favoriteIds={favoriteIds} />
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t("emptyTitle")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("emptyDescription")}
            </p>
            <Button asChild>
              <Link href="/search">{t("searchVehicles")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
