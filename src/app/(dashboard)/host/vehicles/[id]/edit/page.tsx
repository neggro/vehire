import { notFound, redirect } from "next/navigation";
import { createClient as getServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import EditVehicleForm from "./edit-vehicle-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVehiclePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/host/vehicles");
  }

  // Fetch vehicle with images
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  // Check ownership
  if (vehicle.hostId !== user.id) {
    redirect("/host/vehicles");
  }

  // Transform for the form
  const vehicleData = {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year.toString(),
    color: vehicle.color,
    plateNumber: vehicle.plateNumber,
    vin: vehicle.vin || "",
    seats: vehicle.seats.toString(),
    transmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    mileage: vehicle.mileage?.toString() || "",
    description: vehicle.description || "",
    city: vehicle.city,
    state: vehicle.state || "",
    address: vehicle.address || "",
    basePriceDay: (vehicle.basePriceDay / 100).toString(),
    weekendPriceDay: vehicle.weekendPriceDay ? (vehicle.weekendPriceDay / 100).toString() : "",
    estimatedValue: vehicle.estimatedValue ? (vehicle.estimatedValue / 100).toString() : "",
    deliveryAvailable: vehicle.deliveryAvailable,
    deliveryPrice: vehicle.deliveryPrice ? (vehicle.deliveryPrice / 100).toString() : "",
    instantBooking: vehicle.instantBooking,
    mileageLimit: vehicle.mileageLimit?.toString() || "300",
    features: vehicle.features,
    images: vehicle.images.map((img) => img.url),
    status: vehicle.status,
  };

  return <EditVehicleForm initialData={vehicleData} />;
}
