"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  uploadImmediately?: boolean;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onFilesChange,
  maxFiles = 10,
  disabled = false,
  className,
  uploadImmediately = false,
  bucket = "vehicle-images",
  folder = "temp",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file-${index}`, file);
    });
    formData.append("bucket", bucket);
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error uploading files");
    }

    const { urls } = await response.json();
    return urls;
  }, [bucket, folder]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (disabled) return;

      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - value.length;

      if (remainingSlots <= 0) {
        setError(`Maximum ${maxFiles} images allowed`);
        return;
      }

      const filesToProcess = fileArray.slice(0, remainingSlots);

      // Validate file types
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      const invalidFiles = filesToProcess.filter(
        (f) => !validTypes.includes(f.type)
      );

      if (invalidFiles.length > 0) {
        setError("Only JPG, PNG, and WebP images are allowed");
        return;
      }

      // Validate file sizes (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      const oversizedFiles = filesToProcess.filter((f) => f.size > maxSize);

      if (oversizedFiles.length > 0) {
        setError("Images must be less than 5MB");
        return;
      }

      setError(null);

      // Store files for later upload
      const newLocalFiles = [...localFiles, ...filesToProcess];
      setLocalFiles(newLocalFiles);

      // Notify parent about files
      if (onFilesChange) {
        onFilesChange(newLocalFiles);
      }

      // If uploadImmediately, upload now
      if (uploadImmediately) {
        setIsUploading(true);
        try {
          const urls = await uploadFiles(filesToProcess);
          onChange([...value, ...urls]);
          setLocalFiles([]);
          if (onFilesChange) {
            onFilesChange([]);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to upload images");
          // Revert local files on error
          setLocalFiles(localFiles);
          if (onFilesChange) {
            onFilesChange(localFiles);
          }
        } finally {
          setIsUploading(false);
        }
      } else {
        // Create local preview URLs
        const newUrls = filesToProcess.map((file) => URL.createObjectURL(file));
        onChange([...value, ...newUrls]);
      }
    },
    [disabled, maxFiles, value, onChange, onFilesChange, localFiles, uploadImmediately, uploadFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newUrls = [...value];
      const removedUrl = newUrls[index];

      // Revoke blob URL if it's a local preview
      if (removedUrl.startsWith("blob:")) {
        URL.revokeObjectURL(removedUrl);
      }

      newUrls.splice(index, 1);
      onChange(newUrls);

      // Also remove from local files if applicable
      if (index < localFiles.length) {
        const newLocalFiles = [...localFiles];
        newLocalFiles.splice(index, 1);
        setLocalFiles(newLocalFiles);
        if (onFilesChange) {
          onFilesChange(newLocalFiles);
        }
      }
    },
    [value, onChange, localFiles, onFilesChange]
  );

  const moveImage = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= value.length) return;
      const newUrls = [...value];
      const [removed] = newUrls.splice(from, 1);
      newUrls.splice(to, 0, removed);
      onChange(newUrls);
    },
    [value, onChange]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragging && !disabled && "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled || isUploading}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center text-center">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-3" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
          )}
          <p className="text-sm font-medium mb-1">
            {isUploading ? "Subiendo..." : "Arrastra imágenes aquí o haz clic para subir"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG o WebP hasta 5MB ({value.length}/{maxFiles} imágenes)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Image Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square group rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={url}
                alt={`Imagen ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary Badge */}
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                  Principal
                </span>
              )}

              {/* Local file indicator */}
              {url.startsWith("blob:") && (
                <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">
                  Pendiente
                </span>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => moveImage(index, 0)}
                    title="Establecer como principal"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => removeImage(index)}
                  title="Eliminar imagen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
