"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/actions/favorites";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function FavoriteButton({
  vehicleId,
  isFavorite: initialFavorite = false,
  isLoggedIn = false,
  className = "",
}: {
  vehicleId: string;
  isFavorite?: boolean;
  isLoggedIn?: boolean;
  className?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations("vehicle.gallery");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login?redirect=/search");
      return;
    }

    // Optimistic update
    setIsFavorite((prev) => !prev);

    startTransition(async () => {
      const result = await toggleFavorite(vehicleId);
      if (!result.success) {
        // Revert on failure
        setIsFavorite((prev) => !prev);
      }
    });
  };

  return (
    <button
      className={`rounded-full bg-white/90 dark:bg-background/90 p-2 hover:bg-white dark:hover:bg-background shadow-sm hover:shadow-md hover:scale-110 transition-all duration-200 ${className}`}
      onClick={handleClick}
      disabled={isPending}
      aria-label={isFavorite ? t("removeFavorite") : t("addFavorite")}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          isFavorite
            ? "fill-red-500 text-red-500"
            : "text-gray-600 dark:text-gray-300"
        }`}
      />
    </button>
  );
}
