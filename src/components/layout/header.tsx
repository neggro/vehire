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
import { Logo } from "@/components/layout/logo";
import { Menu, Plus, User, MessageSquare, Car, LayoutDashboard, LogOut } from "lucide-react";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MobileNav } from "./mobile-nav";
import { HeaderWrapper } from "./header-wrapper";

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

  const isHost = profile?.roles?.includes("HOST");

  return (
    <HeaderWrapper>
    <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo size="md" />

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/search"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
          >
            Buscar vehículos
          </Link>
          {user && isHost && (
            <Link
              href="/host/vehicles"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
            >
              Mis vehículos
            </Link>
          )}
          {user && (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
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
              {isHost && (
                <Button asChild size="sm" className="hidden sm:flex gap-1.5 rounded-lg shadow-sm">
                  <Link href="/host/vehicles/new">
                    <Plus className="h-4 w-4" />
                    Publicar
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-border hover:ring-primary/30 transition-all">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatarUrl || ""} alt={profile?.fullName || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold">
                        {profile?.fullName?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl shadow-xl border-border/50" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold font-display leading-none">
                        {profile?.fullName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="py-2.5 px-4 cursor-pointer">
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2.5 h-4 w-4 text-muted-foreground" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5 px-4 cursor-pointer">
                    <Link href="/messages">
                      <MessageSquare className="mr-2.5 h-4 w-4 text-muted-foreground" />
                      <span>Mensajes</span>
                    </Link>
                  </DropdownMenuItem>
                  {isHost && (
                    <DropdownMenuItem asChild className="py-2.5 px-4 cursor-pointer">
                      <Link href="/host">
                        <Car className="mr-2.5 h-4 w-4 text-muted-foreground" />
                        <span>Panel de anfitrión</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="py-2.5 px-4 cursor-pointer">
                    <Link href="/dashboard/settings">
                      <User className="mr-2.5 h-4 w-4 text-muted-foreground" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="py-2.5 px-4 cursor-pointer text-destructive">
                    <Link href="/api/auth/signout">
                      <LogOut className="mr-2.5 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild className="rounded-lg shadow-sm">
                <Link href="/login">Ingresar</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <MobileNav isLoggedIn={!!user} isHost={!!isHost} />
        </div>
      </div>
    </header>
    </HeaderWrapper>
  );
}
