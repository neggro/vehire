"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(vehicleId: string): Promise<{ success: boolean; isFavorite: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, isFavorite: false, error: "Debes iniciar sesión para guardar favoritos" };
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_vehicleId: { userId: user.id, vehicleId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      revalidatePath("/dashboard/favorites");
      return { success: true, isFavorite: false };
    }

    await prisma.favorite.create({
      data: { userId: user.id, vehicleId },
    });
    revalidatePath("/dashboard/favorites");
    return { success: true, isFavorite: true };
  } catch {
    return { success: false, isFavorite: false, error: "Error al actualizar favoritos" };
  }
}

export async function getUserFavoriteIds(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      select: { vehicleId: true },
    });
    return favorites.map((f) => f.vehicleId);
  } catch {
    return [];
  }
}
