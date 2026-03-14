"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  CalendarCheck,
  Star,
  FileText,
  ExternalLink,
} from "lucide-react";
import { formatDate, formatPrice, getInitials } from "@/lib/utils";
import {
  USER_ROLE_LABELS,
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_LABELS,
  BOOKING_STATUS_LABELS,
  KYC_DOCUMENT_LABELS,
} from "@/constants";

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: string[];
  adminPermissions: string[];
  kycStatus: string;
  createdAt: string;
  _count: {
    vehicles: number;
    bookingsAsDriver: number;
    bookingsAsHost: number;
    reviewsGiven: number;
  };
  kycDocuments: Array<{
    id: string;
    type: string;
    documentUrl: string;
    status: string;
    createdAt: string;
  }>;
  bookingsAsDriver: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    vehicle: { make: string; model: string };
  }>;
}

const kycBadgeVariant: Record<string, "success" | "warning" | "destructive"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "destructive",
};

const kycLabels: Record<string, string> = {
  VERIFIED: "Verificado",
  PENDING: "Pendiente",
  REJECTED: "Rechazado",
};

const statusColor: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  ACTIVE: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const allRoles = ["USER", "HOST", "DRIVER", "ADMIN"] as const;
const editablePermissions = Object.entries(ADMIN_PERMISSIONS).filter(
  ([key]) => key !== "FULL"
);

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params.id as string;
  const { toast } = useToast();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [roles, setRoles] = useState<string[]>([]);
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [kycStatus, setKycStatus] = useState("PENDING");

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setRoles(data.roles);
          setAdminPermissions(data.adminPermissions.filter((p: string) => p !== ADMIN_PERMISSIONS.FULL));
          setIsSuperAdmin(data.adminPermissions.includes(ADMIN_PERMISSIONS.FULL));
          setKycStatus(data.kycStatus);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const togglePermission = (perm: string) => {
    setAdminPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalPermissions = isSuperAdmin
        ? [ADMIN_PERMISSIONS.FULL]
        : adminPermissions;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roles,
          adminPermissions: roles.includes("ADMIN") ? finalPermissions : [],
          kycStatus,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUser((prev) => (prev ? { ...prev, ...updated } : prev));
        toast({ title: "Usuario actualizado correctamente" });
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Error al actualizar", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

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

  if (!user) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/admin/users">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a usuarios
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{user.fullName}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.phone && (
                <p className="text-sm text-muted-foreground">{user.phone}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-3 justify-center">
                {user.roles.map((role) => (
                  <Badge key={role} variant={role === "ADMIN" ? "default" : "secondary"}>
                    {USER_ROLE_LABELS[role] || role}
                  </Badge>
                ))}
              </div>
              <Badge variant={kycBadgeVariant[user.kycStatus]} className="mt-2">
                KYC: {kycLabels[user.kycStatus] || user.kycStatus}
              </Badge>
              <p className="text-xs text-muted-foreground mt-3">
                Miembro desde {formatDate(user.createdAt)}
              </p>
            </div>

            <Separator className="my-4" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{user._count.bookingsAsDriver}</div>
                <p className="text-xs text-muted-foreground">Reservas (conductor)</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{user._count.bookingsAsHost}</div>
                <p className="text-xs text-muted-foreground">Reservas (anfitrion)</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{user._count.vehicles}</div>
                <p className="text-xs text-muted-foreground">Vehiculos</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{user._count.reviewsGiven}</div>
                <p className="text-xs text-muted-foreground">Resenas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Editar usuario</CardTitle>
            <CardDescription>Roles, permisos y estado KYC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Roles */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Roles</Label>
              <div className="grid grid-cols-2 gap-3">
                {allRoles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={roles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm font-normal cursor-pointer">
                      {USER_ROLE_LABELS[role]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Permissions (only if ADMIN role is selected) */}
            {roles.includes("ADMIN") && (
              <div>
                <Separator className="mb-4" />
                <Label className="text-sm font-medium mb-3 block">Permisos de administrador</Label>

                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="super-admin"
                    checked={isSuperAdmin}
                    onCheckedChange={setIsSuperAdmin}
                  />
                  <Label htmlFor="super-admin" className="text-sm font-normal cursor-pointer">
                    Super Admin (acceso total)
                  </Label>
                </div>

                {!isSuperAdmin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {editablePermissions.map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`perm-${key}`}
                          checked={adminPermissions.includes(value)}
                          onCheckedChange={() => togglePermission(value)}
                        />
                        <Label htmlFor={`perm-${key}`} className="text-sm font-normal cursor-pointer">
                          {ADMIN_PERMISSION_LABELS[value]}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* KYC Status */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Estado KYC</Label>
              <Select value={kycStatus} onValueChange={setKycStatus}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="VERIFIED">Verificado</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        {/* KYC Documents */}
        {user.kycDocuments.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos KYC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {user.kycDocuments.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {KYC_DOCUMENT_LABELS[doc.type] || doc.type}
                        </span>
                        <Badge variant={kycBadgeVariant[doc.status] || "secondary"}>
                          {kycLabels[doc.status] || doc.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {formatDate(doc.createdAt)}
                      </p>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Ver documento
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Bookings */}
        {user.bookingsAsDriver.length > 0 && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Reservas recientes (como conductor)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium">Vehiculo</th>
                      <th className="text-left px-4 py-3 font-medium">Fechas</th>
                      <th className="text-right px-4 py-3 font-medium">Monto</th>
                      <th className="text-left px-4 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.bookingsAsDriver.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link href={`/admin/bookings/${booking.id}`} className="hover:underline font-medium">
                            {booking.vehicle.make} {booking.vehicle.model}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatPrice(booking.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusColor[booking.status] || "default"}>
                            {BOOKING_STATUS_LABELS[booking.status] || booking.status}
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
