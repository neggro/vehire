import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  ShieldCheck,
  Users,
  Car,
  DollarSign,
  Settings,
  LayoutDashboard,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/kyc", label: "KYC", icon: ShieldCheck },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/vehicles", label: "Vehículos", icon: Car },
  { href: "/admin/payments", label: "Pagos", icon: DollarSign },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // Get user profile with Prisma
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { roles: true },
  });

  // Check if user is admin
  const isAdmin = profile?.roles?.includes("ADMIN");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-muted/30 lg:block">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-auto p-4">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-semibold">Panel Admin</span>
          </div>
          <nav className="space-y-2">
            {adminNavItems.map((item) => (
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
        </div>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
