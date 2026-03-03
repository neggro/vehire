"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface CreateVehicleInput {
  // Basic info
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  vin?: string;
  seats: number;
  transmission: string;
  fuelType: string;
  mileage?: number;
  description?: string;
  // Location
  city: string;
  state?: string;
  address?: string;
  locationLat?: number;
  locationLng?: number;
  // Pricing
  basePriceDay: number;
  weekendPriceDay?: number;
  estimatedValue?: number;
  deliveryAvailable?: boolean;
  deliveryPrice?: number;
  mileageLimit?: number;
  // Features
  features: string[];
  // Images
  images: string[];
}

interface CreateVehicleResult {
  success: boolean;
  vehicleId?: string;
  error?: string;
}

export async function createVehicle(
  input: CreateVehicleInput
): Promise<CreateVehicleResult> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes estar autenticado para publicar un vehículo" };
    }

    // Check if user has HOST role using Prisma
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { roles: true, kycStatus: true },
    });

    const hasHostRole = userData?.roles?.includes("HOST");

    // If not a host yet, add HOST role
    if (!hasHostRole) {
      const currentRoles = userData?.roles || ["USER", "DRIVER"];
      await prisma.user.update({
        where: { id: user.id },
        data: { roles: [...currentRoles, "HOST"] },
      });
    }

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        hostId: user.id,
        make: input.make,
        model: input.model,
        year: input.year,
        color: input.color,
        plateNumber: input.plateNumber,
        vin: input.vin || null,
        seats: input.seats,
        transmission: input.transmission,
        fuelType: input.fuelType,
        mileage: input.mileage || null,
        description: input.description || null,
        city: input.city,
        state: input.state || null,
        address: input.address || null,
        locationLat: input.locationLat || -34.9011, // Default Montevideo
        locationLng: input.locationLng || -56.1645,
        basePriceDay: input.basePriceDay,
        weekendPriceDay: input.weekendPriceDay || null,
        estimatedValue: input.estimatedValue || null,
        deliveryAvailable: input.deliveryAvailable || false,
        deliveryPrice: input.deliveryPrice || null,
        mileageLimit: input.mileageLimit || null,
        features: input.features,
        status: "DRAFT",
      },
    });

    // Upload and create image records if there are images
    if (input.images.length > 0) {
      // Filter out blob URLs (local previews) - these should have been uploaded already
      const uploadedUrls = input.images.filter((url) => !url.startsWith("blob:"));

      if (uploadedUrls.length > 0) {
        // Create image records
        await prisma.vehicleImage.createMany({
          data: uploadedUrls.map((url, index) => ({
            vehicleId: vehicle.id,
            url,
            order: index,
            isPrimary: index === 0,
          })),
        });
      }
    }

    revalidatePath("/host/vehicles");
    revalidatePath(`/host/vehicles/${vehicle.id}`);

    return { success: true, vehicleId: vehicle.id };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear el vehículo",
    };
  }
}

interface UpdateVehicleInput extends Partial<CreateVehicleInput> {
  vehicleId: string;
}

export async function updateVehicle(
  input: UpdateVehicleInput
): Promise<CreateVehicleResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes estar autenticado" };
    }

    // Check ownership
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });

    if (!existingVehicle) {
      return { success: false, error: "Vehículo no encontrado" };
    }

    if (existingVehicle.hostId !== user.id) {
      return { success: false, error: "No tienes permiso para editar este vehículo" };
    }

    // Update vehicle
    const updateData: any = {};

    if (input.make !== undefined) updateData.make = input.make;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.year !== undefined) updateData.year = input.year;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.plateNumber !== undefined) updateData.plateNumber = input.plateNumber;
    if (input.vin !== undefined) updateData.vin = input.vin;
    if (input.seats !== undefined) updateData.seats = input.seats;
    if (input.transmission !== undefined) updateData.transmission = input.transmission;
    if (input.fuelType !== undefined) updateData.fuelType = input.fuelType;
    if (input.mileage !== undefined) updateData.mileage = input.mileage;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.state !== undefined) updateData.state = input.state;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.locationLat !== undefined) updateData.locationLat = input.locationLat;
    if (input.locationLng !== undefined) updateData.locationLng = input.locationLng;
    if (input.basePriceDay !== undefined) updateData.basePriceDay = input.basePriceDay;
    if (input.weekendPriceDay !== undefined) updateData.weekendPriceDay = input.weekendPriceDay;
    if (input.estimatedValue !== undefined) updateData.estimatedValue = input.estimatedValue;
    if (input.deliveryAvailable !== undefined) updateData.deliveryAvailable = input.deliveryAvailable;
    if (input.deliveryPrice !== undefined) updateData.deliveryPrice = input.deliveryPrice;
    if (input.mileageLimit !== undefined) updateData.mileageLimit = input.mileageLimit;
    if (input.features !== undefined) updateData.features = input.features;

    await prisma.vehicle.update({
      where: { id: input.vehicleId },
      data: updateData,
    });

    // Update images if provided
    if (input.images !== undefined) {
      // Delete existing images
      await prisma.vehicleImage.deleteMany({
        where: { vehicleId: input.vehicleId },
      });

      // Create new image records
      const uploadedUrls = input.images.filter((url) => !url.startsWith("blob:"));

      if (uploadedUrls.length > 0) {
        await prisma.vehicleImage.createMany({
          data: uploadedUrls.map((url, index) => ({
            vehicleId: input.vehicleId,
            url,
            order: index,
            isPrimary: index === 0,
          })),
        });
      }
    }

    revalidatePath("/host/vehicles");
    revalidatePath(`/host/vehicles/${input.vehicleId}`);

    return { success: true, vehicleId: input.vehicleId };
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el vehículo",
    };
  }
}

export async function updateVehicleStatus(
  vehicleId: string,
  status: "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "PAUSED" | "REJECTED"
): Promise<CreateVehicleResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes estar autenticado" };
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return { success: false, error: "Vehículo no encontrado" };
    }

    if (vehicle.hostId !== user.id) {
      return { success: false, error: "No tienes permiso para editar este vehículo" };
    }

    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status },
    });

    revalidatePath("/host/vehicles");
    revalidatePath(`/host/vehicles/${vehicleId}`);

    return { success: true, vehicleId };
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    return {
      success: false,
      error: "Error al actualizar el estado del vehículo",
    };
  }
}

export async function deleteVehicle(vehicleId: string): Promise<CreateVehicleResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes estar autenticado" };
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return { success: false, error: "Vehículo no encontrado" };
    }

    if (vehicle.hostId !== user.id) {
      return { success: false, error: "No tienes permiso para eliminar este vehículo" };
    }

    // Delete images from storage
    const images = await prisma.vehicleImage.findMany({
      where: { vehicleId },
    });

    if (images.length > 0) {
      // Extract paths from URLs
      const paths = images.map((img) => {
        const url = new URL(img.url);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
        return pathMatch ? pathMatch[1] : null;
      }).filter(Boolean) as string[];

      if (paths.length > 0) {
        await supabase.storage.from("vehicle-images").remove(paths);
      }
    }

    // Delete vehicle (cascades to images and availability)
    await prisma.vehicle.delete({
      where: { id: vehicleId },
    });

    revalidatePath("/host/vehicles");

    return { success: true };
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return {
      success: false,
      error: "Error al eliminar el vehículo",
    };
  }
}
