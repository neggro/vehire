import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminUser, hasPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ADMIN_PERMISSIONS } from "@/constants";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Users,
  Car,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  CalendarCheck,
  CreditCard,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const adminUser = await getAdminUser();
  if (!adminUser) redirect("/dashboard");

  const t = await getTranslations("admin");
  const tc = await getTranslations("common");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeVehicles,
    pendingKYC,
    activeBookings,
    monthlyRevenue,
    recentBookings,
    pendingVehicles,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.vehicle.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { kycStatus: "PENDING" } }),
    prisma.booking.count({ where: { status: { in: ["CONFIRMED", "ACTIVE"] } } }),
    prisma.payment.aggregate({
      where: {
        status: { in: ["HELD", "RELEASED"] },
        paidAt: { gte: startOfMonth },
      },
      _sum: { platformFee: true },
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { fullName: true } },
        vehicle: { select: { make: true, model: true } },
      },
    }),
    prisma.vehicle.count({ where: { status: "PENDING_APPROVAL" } }),
  ]);

  const canPayments = hasPermission(adminUser.adminPermissions, ADMIN_PERMISSIONS.PAYMENTS);
  const canUsers = hasPermission(adminUser.adminPermissions, ADMIN_PERMISSIONS.USERS);
  const canVehicles = hasPermission(adminUser.adminPermissions, ADMIN_PERMISSIONS.VEHICLES);
  const canBookings = hasPermission(adminUser.adminPermissions, ADMIN_PERMISSIONS.BOOKINGS);
  const canKYC = hasPermission(adminUser.adminPermissions, ADMIN_PERMISSIONS.KYC);

  const statusColor: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
    PENDING: "warning",
    CONFIRMED: "default",
    ACTIVE: "success",
    COMPLETED: "secondary",
    CANCELLED: "destructive",
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-4 md:grid-cols-2 mb-8 ${canPayments ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.activeVehicles")}</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVehicles}</div>
            {pendingVehicles > 0 && (
              <p className="text-xs text-yellow-600">{t("stats.pendingApproval", { count: pendingVehicles })}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.kycPending")}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingKYC}</div>
            <p className="text-xs text-muted-foreground">{t("stats.verificationRequests")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.activeBookings")}</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBookings}</div>
          </CardContent>
        </Card>
        {canPayments && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("stats.monthlyCommissions")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(monthlyRevenue._sum.platformFee || 0)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("quickActions.title")}</CardTitle>
            <CardDescription>{t("quickActions.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {canKYC && (
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/kyc">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {t("quickActions.reviewKYC")}
                  </span>
                  {pendingKYC > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                      {pendingKYC}
                    </span>
                  )}
                </Link>
              </Button>
            )}
            {canVehicles && (
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/vehicles">
                  <span className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {t("quickActions.pendingVehicles")}
                  </span>
                  {pendingVehicles > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                      {pendingVehicles}
                    </span>
                  )}
                </Link>
              </Button>
            )}
            {canUsers && (
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/users">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t("quickActions.manageUsers")}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {canBookings && (
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/bookings">
                  <span className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    {t("quickActions.viewBookings")}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {canPayments && (
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/admin/payments">
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t("quickActions.viewPayments")}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t("recentActivity.title")}</CardTitle>
            <CardDescription>{t("recentActivity.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("recentActivity.noActivity")}
              </p>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {booking.vehicle.make} {booking.vehicle.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.driver.fullName} - {formatDate(booking.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusColor[booking.status] || "default"}>
                      {tc(`bookingStatus.${booking.status}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
