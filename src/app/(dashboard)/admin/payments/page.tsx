"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";

interface PaymentRow {
  id: string;
  amount: number;
  platformFee: number;
  hostPayout: number;
  provider: string;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    vehicle: { make: string; model: string };
    driver: { fullName: string };
    host: { fullName: string };
  };
}

interface PaymentsResponse {
  payments: PaymentRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    totalCollected: number;
    platformFees: number;
    pendingPayouts: number;
  };
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  HELD: "Retenido",
  RELEASED: "Liberado",
  REFUNDED: "Reembolsado",
  FAILED: "Fallido",
};

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  PROCESSING: "default",
  HELD: "success",
  RELEASED: "success",
  REFUNDED: "secondary",
  FAILED: "destructive",
};

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (providerFilter !== "all") params.set("provider", providerFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, providerFilter, dateFrom, dateTo]);

  useEffect(() => {
    const timeout = setTimeout(fetchPayments, 300);
    return () => clearTimeout(timeout);
  }, [fetchPayments]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, providerFilter, dateFrom, dateTo]);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pagos</h1>
        <p className="text-muted-foreground">
          {data ? `${data.total} pagos registrados` : "Cargando..."}
        </p>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recaudado (este mes)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(data.summary.totalCollected)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comisiones ganadas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPrice(data.summary.platformFees)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pagos pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatPrice(data.summary.pendingPayouts)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="PROCESSING">Procesando</SelectItem>
                  <SelectItem value="HELD">Retenido</SelectItem>
                  <SelectItem value="RELEASED">Liberado</SelectItem>
                  <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                  <SelectItem value="FAILED">Fallido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="MERCADOPAGO">Mercado Pago</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Desde</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-auto" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Hasta</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-auto" />
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
      ) : !data || data.payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No se encontraron pagos</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Reserva</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Vehiculo</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Conductor</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Anfitrion</th>
                  <th className="text-right px-4 py-3 font-medium">Monto</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Comision</th>
                  <th className="text-left px-4 py-3 font-medium">Proveedor</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${payment.booking.id}`} className="font-mono text-xs hover:underline">
                        {payment.booking.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {payment.booking.vehicle.make} {payment.booking.vehicle.model}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {payment.booking.driver.fullName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {payment.booking.host.fullName}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      {formatPrice(payment.platformFee)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {payment.provider === "MERCADOPAGO" ? "MP" : "PayPal"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[payment.status] || "default"}>
                        {statusLabels[payment.status] || payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                      {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
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
