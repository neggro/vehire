import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Car, Menu, Plus, User, MessageSquare } from "lucide-react";
import { APP_NAME } from "@/constants";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function Header() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { fullName: true, avatarUrl: true, roles: true },
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">{APP_NAME}</span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/search"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Buscar vehículos
          </Link>
          {user && profile?.roles?.includes("HOST") && (
            <Link
              href="/host/vehicles"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Mis vehículos
            </Link>
          )}
          {user && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Mis reservas
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <>
              {profile?.roles?.includes("HOST") && (
                <Button asChild size="sm" className="hidden sm:flex">
                  <Link href="/host/vehicles/new">
                    <Plus className="h-4 w-4 mr-1" />
                    Publicar vehículo
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatarUrl || ""} alt={profile?.fullName || ""} />
                      <AvatarFallback>
                        {profile?.fullName?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.fullName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Mensajes</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile?.roles?.includes("HOST") && (
                    <DropdownMenuItem asChild>
                      <Link href="/host">
                        <Car className="mr-2 h-4 w-4" />
                        <span>Panel de anfitrión</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/api/auth/signout">
                      <span>Cerrar sesión</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild className="hidden sm:flex">
                <Link href="/register">Registrarse</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
