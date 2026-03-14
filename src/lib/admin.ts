import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/constants";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  adminPermissions: string[];
};

/**
 * Verifies the current user is an admin and optionally checks for a specific permission.
 * Returns the admin user or a NextResponse error.
 */
export async function requireAdmin(
  requiredPermission?: AdminPermission
): Promise<{ user: AdminUser } | { error: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return {
      error: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      roles: true,
      adminPermissions: true,
    },
  });

  if (!profile || !profile.roles.includes("ADMIN")) {
    return {
      error: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
    };
  }

  // Check specific permission if required
  if (requiredPermission && !hasPermission(profile.adminPermissions, requiredPermission)) {
    return {
      error: NextResponse.json(
        { error: "No tiene permisos para esta acción" },
        { status: 403 }
      ),
    };
  }

  return { user: profile as AdminUser };
}

/**
 * Check if an admin has a specific permission.
 * admin:full grants access to everything.
 */
export function hasPermission(
  adminPermissions: string[],
  permission: AdminPermission
): boolean {
  if (adminPermissions.includes(ADMIN_PERMISSIONS.FULL)) return true;
  return adminPermissions.includes(permission);
}

/**
 * Server-side helper for admin pages (Server Components).
 * Returns the admin user profile or null if not authorized.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const profile = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      roles: true,
      adminPermissions: true,
    },
  });

  if (!profile || !profile.roles.includes("ADMIN")) return null;

  return profile as AdminUser;
}
