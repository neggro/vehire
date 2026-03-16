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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Car,
  MapPin,
  Fuel,
  Users,
  DollarSign,
  CalendarCheck,
} from "lucide-react";
import { formatDate, formatPrice, getInitials } from "@/lib/utils";

interface VehicleDetail {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  city: string;
  description: string | null;
  basePriceDay: number;
  weekendPriceDay: number | null;
  deliveryAvailable: boolean;
  deliveryPrice: number | null;
  status: string;
  instantBooking: boolean;
  features: string[];
  seats: number;
  transmission: string;
  fuelType: string;
  mileage: number | null;
  createdAt: string;
  images: Array<{ id: string; url: string; isPrimary: boolean; order: number }>;
  host: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  bookings: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    driver: { fullName: string };
  }>;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "warning",
  ACTIVE: "success",
  PAUSED: "default",
  REJECTED: "destructive",
};

const bookingStatusColor: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  ACTIVE: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default function AdminVehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.id as string;
  const { toast } = useToast();
  const t = useTranslations("admin.vehicles");
  const tc = useTranslations("common");

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  useEffect(() => {
    async function fetchVehicle() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/vehicles/${vehicleId}`);
        if (res.ok) {
          const data = await res.json();
          setVehicle(data);
          setNewStatus(data.status);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchVehicle();
  }, [vehicleId]);

  const handleStatusSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: statusNotes }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVehicle((prev) => (prev ? { ...prev, status: updated.status } : prev));
        setStatusNotes("");
        toast({ title: t("vehicleStatusUpdated") });
      } else {
        const err = await res.json();
        toast({ title: tc("labels.error"), description: err.error, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">{t("vehicleNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/admin/vehicles">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToVehicles")}
        </Link>
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">
          {vehicle.make} {vehicle.model} {vehicle.year}
        </h1>
        <Badge variant={statusVariant[vehicle.status] || "default"}>
          {tc(`vehicleStatus.${vehicle.status}`)}
        </Badge>
      </div>

      {/* Image Gallery */}
      {vehicle.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 rounded-lg overflow-hidden">
          {vehicle.images
            .sort((a, b) => a.order - b.order)
            .map((img) => (
              <div
                key={img.id}
                className={`relative aspect-video ${img.isPrimary ? "col-span-2 row-span-2" : ""}`}
              >
                <Image
                  src={img.url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vehicle Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("vehicleInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("color")}</p>
                <p className="font-medium">{vehicle.color}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("plateNumber")}</p>
                <p className="font-medium">{vehicle.plateNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("seats")}</p>
                <p className="font-medium flex items-center gap-1">
                  <Users className="h-4 w-4" /> {vehicle.seats}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("transmission")}</p>
                <p className="font-medium">
                  {tc(`transmission.${vehicle.transmission}`)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("fuel")}</p>
                <p className="font-medium flex items-center gap-1">
                  <Fuel className="h-4 w-4" />
                  {tc(`fuelType.${vehicle.fuelType}`)}
                </p>
              </div>
              {vehicle.mileage && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("mileage")}</p>
                  <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">{t("city")}</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {vehicle.city}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("instantBooking")}</p>
                <p className="font-medium">{vehicle.instantBooking ? t("yes") : t("no")}</p>
              </div>
            </div>

            {vehicle.features.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("features")}</p>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((f) => (
                      <Badge key={f} variant="outline">
                        {tc(`features.${f}`)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {vehicle.description && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("description")}</p>
                  <p className="text-sm whitespace-pre-wrap">{vehicle.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Host Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("host")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/users/${vehicle.host.id}`} className="flex items-center gap-3 hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={vehicle.host.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(vehicle.host.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{vehicle.host.fullName}</p>
                  <p className="text-xs text-muted-foreground">{vehicle.host.email}</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t("pricing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("basePricePerDay")}</span>
                <span className="font-medium">{formatPrice(vehicle.basePriceDay)}</span>
              </div>
              {vehicle.weekendPriceDay && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("weekendPrice")}</span>
                  <span className="font-medium">{formatPrice(vehicle.weekendPriceDay)}</span>
                </div>
              )}
              {vehicle.deliveryAvailable && vehicle.deliveryPrice && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t("delivery")}</span>
                  <span className="font-medium">{formatPrice(vehicle.deliveryPrice)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("statusManagement")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">{t("newStatus")}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">{tc("vehicleStatus.DRAFT")}</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">{tc("vehicleStatus.PENDING_APPROVAL")}</SelectItem>
                    <SelectItem value="ACTIVE">{tc("vehicleStatus.ACTIVE")}</SelectItem>
                    <SelectItem value="PAUSED">{tc("vehicleStatus.PAUSED")}</SelectItem>
                    <SelectItem value="REJECTED">{tc("vehicleStatus.REJECTED")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">{t("notesOptional")}</Label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder={t("statusChangeReason")}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleStatusSave}
                disabled={saving || newStatus === vehicle.status}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? t("saving") : t("updateStatus")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        {vehicle.bookings.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                {t("recentBookings")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium">{tc("labels.driver")}</th>
                      <th className="text-left px-4 py-3 font-medium">{tc("labels.host")}</th>
                      <th className="text-right px-4 py-3 font-medium">{t("amount")}</th>
                      <th className="text-left px-4 py-3 font-medium">{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicle.bookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link href={`/admin/bookings/${booking.id}`} className="hover:underline font-medium">
                            {booking.driver.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatPrice(booking.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={bookingStatusColor[booking.status] || "default"}>
                            {tc(`bookingStatus.${booking.status}`)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
