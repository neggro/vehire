import { Suspense } from "react";
import Link from "next/link";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  Mail,
  Shield,
  Car,
  Calendar,
  DollarSign,
  Star,
  ArrowRight,
} from "lucide-react";
import { ProfileForm } from "./profile-form";
import { formatPriceFromCents } from "@/lib/bookings";

async function HostSettingsContent() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile with stats
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      roles: true,
      kycStatus: true,
      createdAt: true,
    },
  });

  if (!profile) {
    return (
      <div className="p-6">
        <p>Perfil no encontrado</p>
      </div>
    );
  }

  // Get host statistics
  const [vehiclesCount, bookingsCount, totalEarnings, averageRating] = await Promise.all([
    // Vehicles count
    prisma.vehicle.count({
      where: { hostId: user.id },
    }),
    // Completed bookings count
    prisma.booking.count({
      where: {
        hostId: user.id,
        status: { in: ["COMPLETED", "ACTIVE"] },
      },
    }),
    // Total earnings (from completed bookings)
    prisma.payment.aggregate({
      where: {
        booking: { hostId: user.id },
        status: "RELEASED",
      },
      _sum: {
        hostPayout: true,
      },
    }),
    // Average rating as host
    prisma.review.aggregate({
      where: {
        revieweeId: user.id,
      },
      _avg: {
        rating: true,
      },
    }),
  ]);

  const kycStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING: { label: "Pendiente", variant: "secondary" },
    VERIFIED: { label: "Verificado", variant: "default" },
    REJECTED: { label: "Rechazado", variant: "destructive" },
  };

  const kycInfo = kycStatusMap[profile.kycStatus] || kycStatusMap.PENDING;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu perfil y configuración de anfitrión
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información personal
              </CardTitle>
              <CardDescription>
                Tu información de contacto visible para los conductores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                fullName={profile.fullName}
                phone={profile.phone || ""}
                email={profile.email}
              />
            </CardContent>
          </Card>

          {/* KYC Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verificación de identidad
              </CardTitle>
              <CardDescription>
                Estado de verificación para operar como anfitrión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Estado de verificación</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.kycStatus === "VERIFIED"
                        ? "Tu identidad ha sido verificada"
                        : profile.kycStatus === "REJECTED"
                        ? "Tu verificación fue rechazada"
                        : "Completa la verificación para publicar vehículos"}
                    </p>
                  </div>
                </div>
                <Badge variant={kycInfo.variant}>{kycInfo.label}</Badge>
              </div>

              {profile.kycStatus !== "VERIFIED" && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Sube tu documento de identidad para completar la verificación
                    </p>
                    <Button asChild size="sm">
                      <Link href="/dashboard/kyc">
                        Verificar identidad
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Configura cómo recibes notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Las notificaciones se envían a tu email: <strong>{profile.email}</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Host Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
              <CardDescription>Tu actividad como anfitrión</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Car className="h-4 w-4" />
                  <span className="text-sm">Vehículos</span>
                </div>
                <span className="font-semibold">{vehiclesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Reservas completadas</span>
                </div>
                <span className="font-semibold">{bookingsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Ganancias totales</span>
                </div>
                <span className="font-semibold">
                  {formatPriceFromCents(totalEarnings._sum.hostPayout || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">Calificación promedio</span>
                </div>
                <span className="font-semibold">
                  {averageRating._avg.rating
                    ? averageRating._avg.rating.toFixed(1)
                    : "Sin calificaciones"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/host/vehicles/new">
                  <Car className="mr-2 h-4 w-4" />
                  Publicar nuevo vehículo
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/host/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver reservas
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/kyc">
                  <Shield className="mr-2 h-4 w-4" />
                  Verificación de identidad
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Miembro desde</span>
                <span>
                  {profile.createdAt.toLocaleDateString("es-UY", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Roles</span>
                <div className="flex gap-1">
                  {profile.roles.map((role) => (
                    <Badge key={role} variant="outline" className="text-xs">
                      {role === "USER"
                        ? "Usuario"
                        : role === "DRIVER"
                        ? "Conductor"
                        : role === "HOST"
                        ? "Anfitrión"
                        : role === "ADMIN"
                        ? "Admin"
                        : role}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function HostSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <p>Cargando configuración...</p>
        </div>
      }
    >
      <HostSettingsContent />
    </Suspense>
  );
}
