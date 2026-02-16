import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/actions/user";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Car, Plus, BarChart3, Calendar, Settings } from "lucide-react";

const hostNavItems = [
  { href: "/host", label: "Dashboard", icon: BarChart3 },
  { href: "/host/vehicles", label: "Vehículos", icon: Car },
  { href: "/host/bookings", label: "Reservas", icon: Calendar },
  { href: "/host/settings", label: "Configuración", icon: Settings },
];

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/host");
  }

  // Ensure user exists in our database
  await ensureUserExists();

  // Check if user has HOST role
  const { data: profileData } = await supabase
    .from("users")
    .select("roles")
    .eq("id", user.id)
    .single();

  const profile = profileData as { roles: string[] } | null;
  const isHost = profile?.roles?.includes("HOST");

  // If not a host, show onboarding content instead of the normal layout
  if (!isHost) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">{children}</main>
        <Footer />
      </div>
    );
  }

  // Full host layout with sidebar for hosts
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r bg-muted/30 lg:block">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-auto p-4">
            <nav className="space-y-2">
              {hostNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t">
              <Button className="w-full" asChild>
                <Link href="/host/vehicles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Publicar vehículo
                </Link>
              </Button>
            </div>
          </div>
        </aside>
        <main className="flex-1 bg-muted/30">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
