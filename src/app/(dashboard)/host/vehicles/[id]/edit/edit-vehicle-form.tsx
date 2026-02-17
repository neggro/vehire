"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  VEHICLE_FEATURES,
  VEHICLE_STATUS_LABELS,
} from "@/constants";
import {
  ArrowLeft,
  Loader2,
  X,
  Car,
  MapPin,
  DollarSign,
  Settings,
  Save,
} from "lucide-react";
import { ImageUpload } from "@/components/upload/image-upload";
import { updateVehicle } from "@/actions/vehicle";

const STEPS = [
  { id: 1, title: "Información básica", icon: Car },
  { id: 2, title: "Ubicación", icon: MapPin },
  { id: 3, title: "Precios", icon: DollarSign },
  { id: 4, title: "Configuración", icon: Settings },
];

interface VehicleFormData {
  id: string;
  make: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
  vin: string;
  seats: string;
  transmission: string;
  fuelType: string;
  mileage: string;
  description: string;
  city: string;
  state: string;
  address: string;
  basePriceDay: string;
  weekendPriceDay: string;
  estimatedValue: string;
  deliveryAvailable: boolean;
  deliveryPrice: string;
  mileageLimit: string;
  features: string[];
  images: string[];
  status: string;
}

interface EditVehicleFormProps {
  initialData: VehicleFormData;
}

export default function EditVehicleForm({ initialData }: EditVehicleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(initialData.features);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState<VehicleFormData>(initialData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent form submission on Enter key for steps 1-3
    if (e.key === "Enter" && currentStep < 4) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if not on step 4
    if (currentStep < 4) {
      return;
    }

    setIsLoading(true);

    try {
      // First, upload any pending files
      let uploadedUrls: string[] = [];

      if (pendingFiles.length > 0) {
        const uploadFormData = new FormData();
        pendingFiles.forEach((file, index) => {
          uploadFormData.append(`file-${index}`, file);
        });
        uploadFormData.append("bucket", "vehicle-images");
        uploadFormData.append("folder", "temp");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || "Error al subir imágenes");
        }

        const { urls } = await uploadResponse.json();
        uploadedUrls = urls;
      }

      // Combine existing images (non-blob) with newly uploaded
      const existingUrls = formData.images.filter((url) => !url.startsWith("blob:"));
      const allImages = [...existingUrls, ...uploadedUrls];

      // Call server action to update vehicle
      const result = await updateVehicle({
        vehicleId: formData.id,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        color: formData.color,
        plateNumber: formData.plateNumber,
        vin: formData.vin || undefined,
        seats: parseInt(formData.seats),
        transmission: formData.transmission,
        fuelType: formData.fuelType,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        description: formData.description || undefined,
        city: formData.city,
        state: formData.state || undefined,
        address: formData.address || undefined,
        basePriceDay: Math.round(parseFloat(formData.basePriceDay) * 100),
        weekendPriceDay: formData.weekendPriceDay
          ? Math.round(parseFloat(formData.weekendPriceDay) * 100)
          : undefined,
        estimatedValue: formData.estimatedValue
          ? Math.round(parseFloat(formData.estimatedValue) * 100)
          : undefined,
        deliveryAvailable: formData.deliveryAvailable,
        deliveryPrice: formData.deliveryPrice
          ? Math.round(parseFloat(formData.deliveryPrice) * 100)
          : undefined,
        mileageLimit: formData.mileageLimit
          ? parseInt(formData.mileageLimit)
          : undefined,
        features: selectedFeatures,
        images: allImages,
      });

      if (!result.success) {
        toast({
          title: "Error al actualizar vehículo",
          description: result.error || "Ocurrió un error inesperado",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Vehículo actualizado",
        description: "Los cambios han sido guardados correctamente",
      });

      router.push("/host/vehicles");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.make &&
          formData.model &&
          formData.year &&
          formData.color &&
          formData.plateNumber &&
          formData.seats &&
          formData.transmission &&
          formData.fuelType
        );
      case 2:
        return formData.city;
      case 3:
        return formData.basePriceDay;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "PAUSED":
        return "warning";
      case "DRAFT":
        return "secondary";
      case "PENDING_APPROVAL":
        return "outline";
      default:
        return "destructive";
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/host/vehicles"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mis vehículos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar vehículo</h1>
            <p className="text-muted-foreground">
              {formData.make} {formData.model} {formData.year}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(formData.status) as any}>
            {VEHICLE_STATUS_LABELS[formData.status] || formData.status}
          </Badge>
        </div>
      </div>

      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  currentStep >= step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted text-muted-foreground"
                }`}
              >
                <step.icon className="h-5 w-5" />
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-4 h-0.5 w-16 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-sm">
          {STEPS.map((step) => (
            <span
              key={step.id}
              className={
                currentStep >= step.id
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
              <CardDescription>
                Ingresa los detalles principales de tu vehículo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="make">Marca *</Label>
                  <Input
                    id="make"
                    name="make"
                    placeholder="Ej: Toyota"
                    value={formData.make}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    name="model"
                    placeholder="Ej: Corolla"
                    value={formData.model}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="year">Año *</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    placeholder="2022"
                    min="2000"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color *</Label>
                  <Input
                    id="color"
                    name="color"
                    placeholder="Blanco"
                    value={formData.color}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Asientos *</Label>
                  <Input
                    id="seats"
                    name="seats"
                    type="number"
                    min="2"
                    max="9"
                    value={formData.seats}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">Matrícula *</Label>
                  <Input
                    id="plateNumber"
                    name="plateNumber"
                    placeholder="ABC 1234"
                    value={formData.plateNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (opcional)</Label>
                  <Input
                    id="vin"
                    name="vin"
                    placeholder="Número de chasis"
                    value={formData.vin}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmisión *</Label>
                  <Select
                    value={formData.transmission}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, transmission: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRANSMISSION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Combustible *</Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, fuelType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FUEL_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Kilometraje</Label>
                <Input
                  id="mileage"
                  name="mileage"
                  type="number"
                  placeholder="25000"
                  value={formData.mileage}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe tu vehículo, sus características y por qué es ideal para alquilar..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
              <CardDescription>
                ¿Dónde se encuentra tu vehículo?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Montevideo"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Departamento</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="Montevideo"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección (opcional)</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Dirección exacta (solo visible tras confirmar reserva)"
                  value={formData.address}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  La dirección exacta solo será visible para el conductor después
                  de confirmar la reserva.
                </p>
              </div>

              {/* Map placeholder */}
              <div className="aspect-[2/1] rounded-lg border bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">Selecciona la ubicación en el mapa</p>
                  <p className="text-xs">(Integración con Google Maps)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Pricing */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Precios</CardTitle>
              <CardDescription>
                Configura tus tarifas de alquiler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="basePriceDay">Precio por día (UYU) *</Label>
                  <Input
                    id="basePriceDay"
                    name="basePriceDay"
                    type="number"
                    placeholder="2500"
                    min="100"
                    value={formData.basePriceDay}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Precio base de lunes a viernes
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekendPriceDay">Precio fin de semana (UYU)</Label>
                  <Input
                    id="weekendPriceDay"
                    name="weekendPriceDay"
                    type="number"
                    placeholder="3000"
                    min="100"
                    value={formData.weekendPriceDay}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sábados, domingos y feriados
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Valor estimado del vehículo (UYU)</Label>
                <Input
                  id="estimatedValue"
                  name="estimatedValue"
                  type="number"
                  placeholder="2500000"
                  value={formData.estimatedValue}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Se usa para calcular el depósito de garantía (10% del valor)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileageLimit">Límite diario de km</Label>
                <Input
                  id="mileageLimit"
                  name="mileageLimit"
                  type="number"
                  placeholder="300"
                  value={formData.mileageLimit}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground">
                  Kilómetros incluidos por día. Exceso: $50/km
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Entrega a domicilio</Label>
                    <p className="text-sm text-muted-foreground">
                      Ofrece entregar el vehículo en otra ubicación
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.deliveryAvailable}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryAvailable: e.target.checked,
                      }))
                    }
                    className="h-4 w-4"
                  />
                </div>
                {formData.deliveryAvailable && (
                  <div className="mt-4">
                    <Label htmlFor="deliveryPrice">Costo de entrega (UYU)</Label>
                    <Input
                      id="deliveryPrice"
                      name="deliveryPrice"
                      type="number"
                      placeholder="500"
                      value={formData.deliveryPrice}
                      onChange={handleChange}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              {/* Price preview */}
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Vista previa de precios</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Precio por día:</span>
                    <span className="font-medium">
                      {formData.basePriceDay
                        ? `$${parseInt(formData.basePriceDay).toLocaleString()}`
                        : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comisión de plataforma (15%):</span>
                    <span>
                      {formData.basePriceDay
                        ? `$${Math.round(parseInt(formData.basePriceDay) * 0.15).toLocaleString()}`
                        : "--"}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1 mt-1">
                    <span>Tus ganancias por día:</span>
                    <span className="text-primary">
                      {formData.basePriceDay
                        ? `$${Math.round(parseInt(formData.basePriceDay) * 0.85).toLocaleString()}`
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Features & Photos */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Características y fotos</CardTitle>
              <CardDescription>
                Selecciona las características y sube fotos de tu vehículo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features */}
              <div>
                <Label className="mb-3 block">Características</Label>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_FEATURES.map((feature) => (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => toggleFeature(feature.id)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        selectedFeatures.includes(feature.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:border-primary hover:bg-primary/10"
                      }`}
                    >
                      {feature.label}
                      {selectedFeatures.includes(feature.id) && (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <Label className="mb-3 block">Fotos del vehículo</Label>
                <ImageUpload
                  value={formData.images}
                  onChange={(urls) =>
                    setFormData((prev) => ({ ...prev, images: urls }))
                  }
                  onFilesChange={setPendingFiles}
                  maxFiles={10}
                />
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-3">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Vehículo:</span>{" "}
                    {formData.make} {formData.model} {formData.year}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Ubicación:</span>{" "}
                    {formData.city}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Precio:</span>{" "}
                    {formData.basePriceDay
                      ? `$${parseInt(formData.basePriceDay).toLocaleString()}/día`
                      : "--"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Características:</span>{" "}
                    {selectedFeatures.length} seleccionadas
                  </p>
                  <p>
                    <span className="text-muted-foreground">Fotos:</span>{" "}
                    {formData.images.length} subidas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
            >
              Anterior
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentStep((prev) => prev + 1);
              }}
              disabled={!canProceed()}
            >
              Siguiente
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
