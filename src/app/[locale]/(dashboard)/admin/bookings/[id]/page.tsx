"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Car,
  User,
  CreditCard,
  AlertTriangle,
  Star,
} from "lucide-react";
import { formatDate, formatPrice, getInitials } from "@/lib/utils";

interface BookingDetail {
  id: string;
  startDate: string;
  endDate: string;
  pickupTime: string | null;
  returnTime: string | null;
  baseAmount: number;
  deliveryFee: number | null;
  platformFee: number;
  depositAmount: number;
  totalAmount: number;
  status: string;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  pickupLocation: string | null;
  returnLocation: string | null;
  createdAt: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    images: Array<{ url: string; isPrimary: boolean }>;
  };
  driver: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  host: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  payment: {
    id: string;
    amount: number;
    platformFee: number;
    hostPayout: number;
    provider: string;
    currency: string;
    status: string;
    mpPaymentId: string | null;
    paypalOrderId: string | null;
    paidAt: string | null;
  } | null;
  incidents: Array<{
    id: string;
    type: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { fullName: string };
  } | null;
}

const statusColor: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  ACTIVE: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default function AdminBookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const t = useTranslations("admin.bookings");
  const tc = useTranslations("common");

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/bookings/${bookingId}`);
        if (res.ok) {
          setBooking(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">{t("bookingNotFound")}</p>
      </div>
    );
  }

  const primaryImage = booking.vehicle.images.find((i) => i.isPrimary) || booking.vehicle.images[0];

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/admin/bookings">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToBookings")}
        </Link>
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{t("bookingNumber", { id: booking.id.slice(0, 8) })}</h1>
        <Badge variant={statusColor[booking.status] || "default"}>
          {tc(`bookingStatus.${booking.status}`)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Booking Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("bookingDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("startDate")}</p>
                <p className="font-medium">{formatDate(booking.startDate)}</p>
                {booking.pickupTime && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> {booking.pickupTime}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("endDate")}</p>
                <p className="font-medium">{formatDate(booking.endDate)}</p>
                {booking.returnTime && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> {booking.returnTime}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Amounts */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("baseAmount")}</span>
                <span>{formatPrice(booking.baseAmount)}</span>
              </div>
              {booking.deliveryFee && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("delivery")}</span>
                  <span>{formatPrice(booking.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("platformFee")}</span>
                <span>{formatPrice(booking.platformFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("deposit")}</span>
                <span>{formatPrice(booking.depositAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>{t("total")}</span>
                <span>{formatPrice(booking.totalAmount)}</span>
              </div>
            </div>

            {booking.pickupLocation && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("pickupLocation")}</p>
                    <p className="text-sm">{booking.pickupLocation}</p>
                  </div>
                  {booking.returnLocation && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("returnLocation")}</p>
                      <p className="text-sm">{booking.returnLocation}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {booking.status === "CANCELLED" && booking.cancellationReason && (
              <>
                <Separator />
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">{t("cancelled")}</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{booking.cancellationReason}</p>
                  {booking.cancelledAt && (
                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                      {formatDate(booking.cancelledAt)}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Car className="h-4 w-4" />
              {t("vehicle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {primaryImage && (
              <div className="relative aspect-video rounded-md overflow-hidden mb-3">
                <Image
                  src={primaryImage.url}
                  alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <Link href={`/admin/vehicles/${booking.vehicle.id}`} className="font-medium hover:underline">
              {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year}
            </Link>
          </CardContent>
        </Card>

        {/* Driver Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("driver")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/admin/users/${booking.driver.id}`} className="flex items-center gap-3 hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.driver.avatarUrl || undefined} />
                <AvatarFallback>{getInitials(booking.driver.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{booking.driver.fullName}</p>
                <p className="text-xs text-muted-foreground">{booking.driver.email}</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Host Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("host")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/admin/users/${booking.host.id}`} className="flex items-center gap-3 hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={booking.host.avatarUrl || undefined} />
                <AvatarFallback>{getInitials(booking.host.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{booking.host.fullName}</p>
                <p className="text-xs text-muted-foreground">{booking.host.email}</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("payment")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {booking.payment ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">
                    {booking.payment.provider === "MERCADOPAGO" ? "Mercado Pago" : "PayPal"}
                  </Badge>
                  <Badge variant={booking.payment.status === "HELD" || booking.payment.status === "RELEASED" ? "success" : "warning"}>
                    {tc(`paymentStatus.${booking.payment.status}`)}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("paymentAmount")}</span>
                    <span>{formatPrice(booking.payment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("paymentFee")}</span>
                    <span>{formatPrice(booking.payment.platformFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("hostPayout")}</span>
                    <span>{formatPrice(booking.payment.hostPayout)}</span>
                  </div>
                </div>
                {booking.payment.mpPaymentId && (
                  <p className="text-xs text-muted-foreground">
                    MP ID: {booking.payment.mpPaymentId}
                  </p>
                )}
                {booking.payment.paypalOrderId && (
                  <p className="text-xs text-muted-foreground">
                    PayPal ID: {booking.payment.paypalOrderId}
                  </p>
                )}
                {booking.payment.paidAt && (
                  <p className="text-xs text-muted-foreground">
                    {t("paidOn")}: {formatDate(booking.payment.paidAt)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noPaymentInfo")}</p>
            )}
          </CardContent>
        </Card>

        {/* Incidents */}
        {booking.incidents.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                {t("incidents")} ({booking.incidents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{incident.type}</span>
                      <Badge variant={incident.status === "open" ? "warning" : "success"}>
                        {incident.status === "open" ? t("incidentOpen") : t("incidentResolved")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{incident.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(incident.createdAt)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review */}
        {booking.review && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {t("review")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < booking.review!.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{booking.review.reviewer.fullName}</span>
              </div>
              {booking.review.comment && (
                <p className="text-sm text-muted-foreground">{booking.review.comment}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">{formatDate(booking.review.createdAt)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
