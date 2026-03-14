"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FavoriteButton } from "@/components/search/favorite-button";

interface ImageData {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

interface ImageGalleryProps {
  images: ImageData[];
  vehicleName: string;
  vehicleId: string;
  isFavorite?: boolean;
  isLoggedIn?: boolean;
}

export function ImageGallery({ images, vehicleName, vehicleId, isFavorite = false, isLoggedIn = false }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[currentIndex] : null;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const threshold = 50;
    if (touchDeltaX.current > threshold) {
      goToPrevious();
    } else if (touchDeltaX.current < -threshold) {
      goToNext();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: vehicleName,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Enlace copiado",
        description: "El enlace se copió al portapapeles",
      });
    }
  };


  return (
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {hasImages && currentImage ? (
        <Image
          src={currentImage.url}
          alt={`${vehicleName} - Imagen ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
          priority={currentIndex === 0}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl">🚗</span>
        </div>
      )}

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white transition-colors"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white transition-colors"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Image counter */}
      {hasImages && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Thumbnail strip — desktop only, visible on hover */}
      {images.length > 1 && (
        <div
          className={`
            absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2
            hidden md:flex
            transition-opacity duration-200
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
        >
          {images.slice(0, 5).map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative h-12 w-12 rounded-md overflow-hidden border-2 transition-colors ${
                index === currentIndex
                  ? "border-primary"
                  : "border-transparent hover:border-white/50"
              }`}
            >
              <Image
                src={image.url}
                alt={`Miniatura ${index + 1}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            </button>
          ))}
          {images.length > 5 && (
            <div className="h-12 w-12 rounded-md bg-black/60 flex items-center justify-center text-white text-xs">
              +{images.length - 5}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={handleShare}
          className="rounded-full bg-white/80 p-2 shadow-lg hover:bg-white transition-colors"
          aria-label="Compartir"
        >
          <Share2 className="h-5 w-5" />
        </button>
        <FavoriteButton
          vehicleId={vehicleId}
          isFavorite={isFavorite}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}
