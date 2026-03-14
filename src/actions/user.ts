"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface BecomeHostResult {
  success: boolean;
  error?: string;
}

export async function becomeHost(): Promise<BecomeHostResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes estar autenticado" };
    }

    // Check if user exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      // Create user first
      const fullName = user.user_metadata?.full_name ||
                       user.user_metadata?.name ||
                       user.email?.split("@")[0] ||
                       "Usuario";

      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          fullName,
          roles: ["DRIVER", "HOST"],
          kycStatus: "PENDING",
        },
      });
    } else {
      // Add HOST role if not already present
      if (!existingUser.roles.includes("HOST")) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            roles: [...existingUser.roles, "HOST"],
          },
        });
      }
    }

    revalidatePath("/host");
    revalidatePath("/host/onboarding");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error becoming host:", error);
    return {
      success: false,
      error: "Error al convertirte en anfitrión",
    };
  }
}

export async function ensureUserExists(): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes estar autenticado" };
    }

    // Check if user exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (existingUser) {
      return { success: true, userId: user.id };
    }

    // Create user
    const fullName = user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     user.email?.split("@")[0] ||
                     "Usuario";

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        fullName,
        roles: ["DRIVER"],
        kycStatus: "PENDING",
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return {
      success: false,
      error: "Error al crear el perfil de usuario",
    };
  }
}

export async function updateUserProfile(data: {
  fullName?: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes estar autenticado" };
    }

    // Validate input
    if (data.fullName !== undefined && !data.fullName.trim()) {
      return { success: false, error: "El nombre es requerido" };
    }

    // Update user in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
      },
    });

    revalidatePath("/host/settings");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: "Error al actualizar el perfil",
    };
  }
}
