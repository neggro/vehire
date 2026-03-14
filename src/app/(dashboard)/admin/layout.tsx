import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminUser, hasPermission } from "@/lib/admin";
import { ADMIN_PERMISSIONS } from "@/constants";
import {
  ShieldCheck,
  Users,
  Car,
  Settings,
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
} from "lucide-react";
import { AdminMobileNav } from "./admin-mobile-nav";

const allNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, iconKey: "dashboard", permission: null },
  { href: "/admin/users", label: "Usuarios", icon: Users, iconKey: "users", permission: ADMIN_PERMISSIONS.USERS },
  { href: "/admin/vehicles", label: "Vehiculos", icon: Car, iconKey: "vehicles", permission: ADMIN_PERMISSIONS.VEHICLES },
  { href: "/admin/bookings", label: "Reservas", icon: CalendarCheck, iconKey: "bookings", permission: ADMIN_PERMISSIONS.BOOKINGS },
  { href: "/admin/payments", label: "Pagos", icon: CreditCard, iconKey: "payments", permission: ADMIN_PERMISSIONS.PAYMENTS },
  { href: "/admin/kyc", label: "KYC", icon: ShieldCheck, iconKey: "kyc", permission: ADMIN_PERMISSIONS.KYC },
  { href: "/admin/settings", label: "Configuracion", icon: Settings, iconKey: "settings", permission: ADMIN_PERMISSIONS.SETTINGS },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/dashboard");
  }

  const navItems = allNavItems.filter(
    (item) =>
      item.permission === null ||
      hasPermission(adminUser.adminPermissions, item.permission)
  );

  return (
    <div className="flex flex-1">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-muted/30 lg:block">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-auto p-4">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-semibold">Panel Admin</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
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

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <AdminMobileNav navItems={navItems.map((item) => ({ href: item.href, label: item.label, iconKey: item.iconKey }))} />
      </div>

      <main className="flex-1">{children}</main>
    </div>
  );
}
