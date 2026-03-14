"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Search,
  Car,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Plus,
  LogOut,
  User,
} from "lucide-react";

interface MobileNavProps {
  isLoggedIn: boolean;
  isHost: boolean;
}

export function MobileNav({ isLoggedIn, isHost }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden rounded-lg"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setOpen(false)}
        >
          {/* Drawer */}
          <div
            className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-background shadow-2xl animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-display font-bold text-lg">Menú</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Links */}
              <nav className="flex-1 overflow-y-auto py-4">
                <div className="space-y-1 px-3">
                  <MobileNavLink
                    href="/search"
                    icon={Search}
                    label="Buscar vehículos"
                    onClick={() => setOpen(false)}
                  />
                  {isLoggedIn && (
                    <>
                      <MobileNavLink
                        href="/dashboard"
                        icon={LayoutDashboard}
                        label="Dashboard"
                        onClick={() => setOpen(false)}
                      />
                      <MobileNavLink
                        href="/dashboard/favorites"
                        icon={Heart}
                        label="Favoritos"
                        onClick={() => setOpen(false)}
                      />
                      <MobileNavLink
                        href="/messages"
                        icon={MessageSquare}
                        label="Mensajes"
                        onClick={() => setOpen(false)}
                      />
                      {isHost && (
                        <>
                          <MobileNavLink
                            href="/host/vehicles"
                            icon={Car}
                            label="Mis vehículos"
                            onClick={() => setOpen(false)}
                          />
                          <MobileNavLink
                            href="/host/vehicles/new"
                            icon={Plus}
                            label="Publicar vehículo"
                            onClick={() => setOpen(false)}
                          />
                        </>
                      )}
                      <MobileNavLink
                        href="/dashboard/settings"
                        icon={User}
                        label="Configuración"
                        onClick={() => setOpen(false)}
                      />
                    </>
                  )}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t space-y-2">
                {isLoggedIn ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2.5 rounded-lg"
                    asChild
                  >
                    <Link href="/api/auth/signout">
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button className="w-full rounded-lg" asChild>
                      <Link href="/login">Registrarse</Link>
                    </Button>
                    <Button variant="outline" className="w-full rounded-lg" asChild>
                      <Link href="/login">Ingresar</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors"
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
