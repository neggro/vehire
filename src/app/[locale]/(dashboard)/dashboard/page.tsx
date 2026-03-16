import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Calendar,
  CreditCard,
  Star,
  ArrowRight,
  Clock,
  TrendingUp,
  AlertCircle,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tc = await getTranslations("common");
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile with Prisma
  const profile = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { fullName: true, roles: true, kycStatus: true },
  });

  // Get user's bookings as driver with Prisma
  const driverBookings = await prisma.booking.findMany({
    where: { driverId: user!.id },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
      status: true,
      vehicle: {
        select: { make: true, model: true, year: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get stats
  const totalBookings = await prisma.booking.count({
    where: { driverId: user!.id },
  });

  // Get user's pending reservations (future only)
  const pendingReservations = await prisma.pendingReservation.findMany({
    where: {
      driverId: user!.id,
      startDate: { gte: new Date() },
    },
    include: {
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          city: true,
          images: {
            select: { url: true },
            orderBy: { order: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const isHost = profile?.roles?.includes("HOST");

  return (
    <div className="container py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("greeting", { name: profile?.fullName?.split(" ")[0] || "Usuario" })}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("welcome")}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalBookings")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("kycStatus")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                profile?.kycStatus === "VERIFIED"
                  ? "success"
                  : profile?.kycStatus === "REJECTED"
                  ? "destructive"
                  : "warning"
              }
            >
              {profile?.kycStatus === "VERIFIED"
                ? tc("labels.verified")
                : profile?.kycStatus === "REJECTED"
                ? tc("labels.rejected")
                : tc("labels.pending")}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("yourRole")}</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {profile?.roles?.map((role: string) => (
                <Badge key={role} variant="secondary">
                  {tc(`userRoles.${role}` as any) || role}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("upcomingTrips")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {driverBookings?.filter(
                (b) => b.status === "CONFIRMED" || b.status === "ACTIVE"
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Become a Host CTA (if not host) */}
      {!isHost && (
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {t("becomeHost")}
                </h3>
                <p className="text-muted-foreground">
                  {t("becomeHostDesc")}
                </p>
              </div>
              <Button asChild>
                <Link href="/host/onboarding">
                  {t("getStarted")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Reservations (incomplete bookings) */}
      {pendingReservations.length > 0 && (
        <Card className="mb-8 border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">{t("pendingBookings")}</CardTitle>
            </div>
            <CardDescription>
              {t("pendingBookingsDesc", { count: pendingReservations.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingReservations.map((pr) => (
                <div
                  key={pr.id}
                  className="flex items-center gap-4 rounded-lg border bg-card p-3"
                >
                  <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                    {pr.vehicle.images[0]?.url ? (
                      <img
                        src={pr.vehicle.images[0].url}
                        alt={`${pr.vehicle.make} ${pr.vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {pr.vehicle.make} {pr.vehicle.model} ({pr.vehicle.year})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pr.startDate.toLocaleDateString("es-UY", {
                        day: "numeric",
                        month: "short",
                      })} - {pr.endDate.toLocaleDateString("es-UY", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {formatPrice(pr.totalAmount)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      asChild
                    >
                      <Link href={`/booking/${pr.vehicle.id}?resume=${pr.id}`}>
                        {tc("actions.continue")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Bookings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentBookings")}</CardTitle>
            <CardDescription>{t("recentBookingsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {driverBookings && driverBookings.length > 0 ? (
              <div className="space-y-4">
                {driverBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {booking.vehicle?.make} {booking.vehicle?.model}{" "}
                        {booking.vehicle?.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.startDate).toLocaleDateString("es-UY")} -{" "}
                        {new Date(booking.endDate).toLocaleDateString("es-UY")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          booking.status === "COMPLETED"
                            ? "success"
                            : booking.status === "CONFIRMED"
                            ? "default"
                            : booking.status === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {tc(`bookingStatus.${booking.status}` as any)}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(booking.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/bookings">
                    {t("viewAllBookings")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t("noBookings")}
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/search">{t("searchVehicles")}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("quickActions")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/search">
                  <Car className="mr-2 h-4 w-4" />
                  {t("searchVehicles")}
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t("myBookings")}
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/favorites">
                  <Heart className="mr-2 h-4 w-4" />
                  {t("myFavorites")}
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/dashboard/kyc">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {t("verifyIdentity")}
                </Link>
              </Button>
              {isHost && (
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/host">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {t("hostPanel")}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("needHelp")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t("needHelpDesc")}
              </p>
              <Button variant="outline" className="w-full">
                {t("contactSupport")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
