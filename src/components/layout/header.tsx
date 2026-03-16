import { Link } from "@/i18n/navigation";
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
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Logo } from "@/components/layout/logo";
import { Plus, User, Heart, MessageSquare, Car, LayoutDashboard, LogOut } from "lucide-react";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MobileNav } from "./mobile-nav";
import { HeaderWrapper } from "./header-wrapper";
import { getTranslations } from "next-intl/server";

export async function Header() {
  const t = await getTranslations("common");
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
            {t("nav.searchVehicles")}
          </Link>
          {user && isHost && (
            <Link
              href="/host/vehicles"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
            >
              {t("nav.myVehicles")}
            </Link>
          )}
          {user && (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
            >
              {t("nav.myBookings")}
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <>
              {isHost && (
                <Button asChild size="sm" className="hidden sm:flex gap-1.5 rounded-lg shadow-sm">
                  <Link href="/host/vehicles/new">
                    <Plus className="h-4 w-4" />
                    {t("nav.publish")}
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
                  <Link href="/dashboard">
                    <DropdownMenuItem className="py-2.5 px-4 cursor-pointer">
                      <LayoutDashboard className="mr-2.5 h-4 w-4 text-muted-foreground" />
                      <span>{t("nav.dashboard")}</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard/favorites">
                    <DropdownMenuItem className="py-2.5 px-4 cursor-pointer">
                      <Heart className="mr-2.5 h-4 w-4 text-muted-foreground" />
                      <span>{t("nav.favorites")}</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/messages">
                    <DropdownMenuItem className="py-2.5 px-4 cursor-pointer">
                      <MessageSquare className="mr-2.5 h-4 w-4 text-muted-foreground" />
                      <span>{t("nav.messages")}</span>
                    </DropdownMenuItem>
                  </Link>
                  {isHost && (
                    <Link href="/host">
                      <DropdownMenuItem className="py-2.5 px-4 cursor-pointer">
                        <Car className="mr-2.5 h-4 w-4 text-muted-foreground" />
                        <span>{t("nav.hostPanel")}</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <Link href="/dashboard/settings">
                    <DropdownMenuItem className="py-2.5 px-4 cursor-pointer">
                      <User className="mr-2.5 h-4 w-4 text-muted-foreground" />
                      <span>{t("nav.settings")}</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <a href="/api/auth/signout">
                    <DropdownMenuItem className="py-2.5 px-4 cursor-pointer text-destructive">
                      <LogOut className="mr-2.5 h-4 w-4" />
                      <span>{t("nav.logout")}</span>
                    </DropdownMenuItem>
                  </a>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild className="rounded-lg shadow-sm">
                <Link href="/login">{t("nav.login")}</Link>
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
