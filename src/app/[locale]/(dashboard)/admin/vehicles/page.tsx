"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Car,
} from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";

interface VehicleRow {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  basePriceDay: number;
  status: string;
  createdAt: string;
  images: Array<{ url: string; isPrimary: boolean }>;
  host: { id: string; fullName: string };
  _count: { bookings: number };
}

interface VehiclesResponse {
  vehicles: VehicleRow[];
  total: number;
  page: number;
  pageSize: number;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "warning",
  ACTIVE: "success",
  PAUSED: "default",
  REJECTED: "destructive",
};

export default function AdminVehiclesPage() {
  const t = useTranslations("admin.vehicles");
  const tc = useTranslations("common");
  const [data, setData] = useState<VehiclesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { toast } = useToast();

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (cityFilter) params.set("city", cityFilter);

      const res = await fetch(`/api/admin/vehicles?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, cityFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchVehicles, 300);
    return () => clearTimeout(timeout);
  }, [fetchVehicles]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, cityFilter]);

  const handleQuickAction = async (vehicleId: string, action: "ACTIVE" | "REJECTED") => {
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        toast({ title: action === "ACTIVE" ? t("vehicleApproved") : t("vehicleRejected") });
        fetchVehicles();
      } else {
        const err = await res.json();
        toast({ title: tc("labels.error"), description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: t("connectionError"), variant: "destructive" });
    }
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {data ? t("vehiclesRegistered", { count: data.total }) : tc("actions.loading")}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="DRAFT">{tc("vehicleStatus.DRAFT")}</SelectItem>
                <SelectItem value="PENDING_APPROVAL">{tc("vehicleStatus.PENDING_APPROVAL")}</SelectItem>
                <SelectItem value="ACTIVE">{tc("vehicleStatus.ACTIVE")}</SelectItem>
                <SelectItem value="PAUSED">{tc("vehicleStatus.PAUSED")}</SelectItem>
                <SelectItem value="REJECTED">{tc("vehicleStatus.REJECTED")}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={t("filterByCity")}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full sm:w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !data || data.vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noVehicles")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">{t("vehicleDetails")}</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t("host")}</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">{t("city")}</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">{t("pricePerDay")}</th>
                  <th className="text-left px-4 py-3 font-medium">{t("status")}</th>
                  <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">{t("bookings")}</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">{t("created")}</th>
                  <th className="text-right px-4 py-3 font-medium">{tc("actions.edit")}</th>
                </tr>
              </thead>
              <tbody>
                {data.vehicles.map((vehicle) => {
                  const primaryImage = vehicle.images.find((i) => i.isPrimary) || vehicle.images[0];
                  return (
                    <tr key={vehicle.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/vehicles/${vehicle.id}`} className="flex items-center gap-3">
                          {primaryImage ? (
                            <div className="relative h-10 w-14 rounded overflow-hidden bg-muted flex-shrink-0">
                              <Image
                                src={primaryImage.url}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <Car className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium hover:underline">
                            {vehicle.make} {vehicle.model} {vehicle.year}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Link href={`/admin/users/${vehicle.host.id}`} className="text-muted-foreground hover:underline">
                          {vehicle.host.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {vehicle.city}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        {formatPrice(vehicle.basePriceDay)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[vehicle.status] || "default"}>
                          {tc(`vehicleStatus.${vehicle.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {vehicle._count.bookings}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                        {formatDate(vehicle.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {vehicle.status === "PENDING_APPROVAL" ? (
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleQuickAction(vehicle.id, "ACTIVE")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleQuickAction(vehicle.id, "REJECTED")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/vehicles/${vehicle.id}`}>{t("view")}</Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {t("pageOf", { page, totalPages })}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
