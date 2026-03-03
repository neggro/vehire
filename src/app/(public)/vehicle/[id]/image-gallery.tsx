"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Image {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

interface ImageGalleryProps {
  images: Image[];
  vehicleName: string;
}

export function ImageGallery({ images, vehicleName }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[currentIndex] : null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: vehicleName,
        url: window.location.href,
      });
    } catch {
      // User cancelled or share not supported
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Enlace copiado",
        description: "El enlace se copió al portapapeles",
      });
    }
  };

  const handleFavorite = () => {
    toast({
      title: "Agregado a favoritos",
      description: "Esta función estará disponible pronto",
    });
  };

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
      {hasImages && currentImage ? (
        <img
          src={currentImage.url}
          alt={`${vehicleName} - Imagen ${currentIndex + 1}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl">🚗</span>
        </div>
      )}

      {/* Navigation arrows - only show if multiple images */}
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

      {/* Thumbnail strip for multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`h-12 w-12 rounded-md overflow-hidden border-2 transition-colors ${
                index === currentIndex
                  ? "border-primary"
                  : "border-transparent hover:border-white/50"
              }`}
            >
              <img
                src={image.url}
                alt={`Miniatura ${index + 1}`}
                className="h-full w-full object-cover"
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
        <button
          onClick={handleFavorite}
          className="rounded-full bg-white/80 p-2 shadow-lg hover:bg-white transition-colors"
          aria-label="Agregar a favoritos"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
