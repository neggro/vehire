"use client";

import { VehicleCard, type VehicleCardData } from "@/components/search/vehicle-cards";

export function FavoritesGrid({
  vehicles,
  favoriteIds,
}: {
  vehicles: VehicleCardData[];
  favoriteIds: string[];
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          isFavorite={favoriteIds.includes(vehicle.id)}
          isLoggedIn={true}
        />
      ))}
    </div>
  );
}
