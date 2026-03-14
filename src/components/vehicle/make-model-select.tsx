"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VEHICLE_MAKES, OTHER_OPTION, getModelsForMake } from "@/constants/vehicles";

interface MakeModelSelectProps {
  make: string;
  model: string;
  customMake: string;
  customModel: string;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
  onCustomMakeChange: (value: string) => void;
  onCustomModelChange: (value: string) => void;
}

export function MakeModelSelect({
  make,
  model,
  customMake,
  customModel,
  onMakeChange,
  onModelChange,
  onCustomMakeChange,
  onCustomModelChange,
}: MakeModelSelectProps) {
  const models = useMemo(() => {
    if (!make || make === OTHER_OPTION) return [];
    return getModelsForMake(make);
  }, [make]);

  const isCustomMake = make === OTHER_OPTION;
  const isCustomModel = model === OTHER_OPTION;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Marca *</Label>
        <Select
          value={make}
          onValueChange={(value) => {
            onMakeChange(value);
            // Reset model when make changes
            onModelChange("");
            onCustomModelChange("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar marca" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_MAKES.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {m.name}
              </SelectItem>
            ))}
            <SelectItem value={OTHER_OPTION}>Otra marca</SelectItem>
          </SelectContent>
        </Select>
        {isCustomMake && (
          <Input
            placeholder="Escribí la marca"
            value={customMake}
            onChange={(e) => onCustomMakeChange(e.target.value)}
            autoFocus
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Modelo *</Label>
        {isCustomMake ? (
          <Input
            placeholder="Escribí el modelo"
            value={customModel}
            onChange={(e) => onCustomModelChange(e.target.value)}
          />
        ) : (
          <>
            <Select
              value={model}
              onValueChange={onModelChange}
              disabled={!make}
            >
              <SelectTrigger>
                <SelectValue placeholder={make ? "Seleccionar modelo" : "Primero seleccioná la marca"} />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_OPTION}>Otro modelo</SelectItem>
              </SelectContent>
            </Select>
            {isCustomModel && (
              <Input
                placeholder="Escribí el modelo"
                value={customModel}
                onChange={(e) => onCustomModelChange(e.target.value)}
                autoFocus
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Resolves the actual make/model strings from the select state.
 * Returns the custom value if "other" was selected, otherwise the dropdown value.
 */
export function resolveMakeModel(
  make: string,
  model: string,
  customMake: string,
  customModel: string
): { make: string; model: string } {
  const resolvedMake = make === OTHER_OPTION ? customMake.trim() : make;
  const resolvedModel =
    make === OTHER_OPTION || model === OTHER_OPTION
      ? customModel.trim()
      : model;
  return { make: resolvedMake, model: resolvedModel };
}

/**
 * Initializes the select state from existing make/model values (for edit forms).
 * Determines if the value matches a known make/model or should use "other".
 */
export function initMakeModelState(existingMake: string, existingModel: string) {
  const knownMake = VEHICLE_MAKES.find(
    (m) => m.name.toLowerCase() === existingMake.toLowerCase()
  );

  if (!knownMake) {
    return {
      make: OTHER_OPTION,
      model: "",
      customMake: existingMake,
      customModel: existingModel,
    };
  }

  const knownModel = knownMake.models.find(
    (m) => m.name.toLowerCase() === existingModel.toLowerCase()
  );

  if (!knownModel) {
    return {
      make: knownMake.name,
      model: OTHER_OPTION,
      customMake: "",
      customModel: existingModel,
    };
  }

  return {
    make: knownMake.name,
    model: knownModel.name,
    customMake: "",
    customModel: "",
  };
}
