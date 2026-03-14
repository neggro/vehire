"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
} from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { BOOKING_STATUS_LABELS } from "@/constants";

interface BookingRow {
  id: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  vehicle: { make: string; model: string };
  driver: { fullName: string };
  host: { fullName: string };
  payment: { status: string; provider: string } | null;
}

interface BookingsResponse {
  bookings: BookingRow[];
  total: number;
  page: number;
  pageSize: number;
}

const statusColor: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  ACTIVE: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  HELD: "Retenido",
  RELEASED: "Liberado",
  REFUNDED: "Reembolsado",
  FAILED: "Fallido",
};

export default function AdminBookingsPage() {
  const [data, setData] = useState<BookingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const timeout = setTimeout(fetchBookings, 300);
    return () => clearTimeout(timeout);
  }, [fetchBookings]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFrom, dateTo]);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion de Reservas</h1>
        <p className="text-muted-foreground">
          {data ? `${data.total} reservas en total` : "Cargando..."}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por conductor, anfitrion o vehiculo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="ACTIVE">En curso</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Desde</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
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
      ) : !data || data.bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron reservas</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Vehiculo</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Conductor</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Anfitrion</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Fechas</th>
                  <th className="text-right px-4 py-3 font-medium">Monto</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Pago</th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${booking.id}`} className="font-mono text-xs hover:underline">
                        {booking.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {booking.vehicle.make} {booking.vehicle.model}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {booking.driver.fullName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {booking.host.fullName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      <span className="whitespace-nowrap">
                        {new Date(booking.startDate).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}
                        {" - "}
                        {new Date(booking.endDate).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPrice(booking.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColor[booking.status] || "default"}>
                        {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {booking.payment ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {booking.payment.provider === "MERCADOPAGO" ? "MP" : "PayPal"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {paymentStatusLabels[booking.payment.status] || booking.payment.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin pago</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Pagina {page} de {totalPages}
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
