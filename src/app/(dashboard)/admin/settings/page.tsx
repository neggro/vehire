"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Percent, Calendar, Clock } from "lucide-react";

interface PlatformSettings {
  platformFeePercent: number;
  depositPercent: number;
  weekendMarkupPercent: number;
  minBookingDays: number;
  maxBookingDays: number;
  cancellationFreeHours: number;
}

interface SettingCardProps {
  label: string;
  description: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
  onSave: (value: number) => Promise<void>;
  min?: number;
  max?: number;
}

function SettingCard({ label, description, value, suffix, icon, onSave, min = 0, max = 999 }: SettingCardProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleSave = async () => {
    const num = Number(editValue);
    if (isNaN(num) || num < min || num > max) return;
    setSaving(true);
    try {
      await onSave(num);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-muted-foreground">{icon}</div>
            <div>
              <h3 className="font-medium">{label}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {!editing ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{value}{suffix}</span>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-24 text-right"
                min={min}
                max={max}
              />
              <span className="text-sm text-muted-foreground">{suffix}</span>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); setEditValue(String(value)); }}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          setSettings(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const updateSetting = async (key: keyof PlatformSettings, value: number) => {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSettings(updated);
      toast({ title: "Configuracion actualizada" });
    } else {
      const err = await res.json();
      toast({ title: "Error", description: err.error, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">No se pudieron cargar las configuraciones</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuracion de la plataforma
        </h1>
        <p className="text-muted-foreground">
          Ajusta los parametros generales de la plataforma
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        <SettingCard
          label="Comision de plataforma"
          description="Porcentaje que cobra la plataforma por cada reserva"
          value={settings.platformFeePercent}
          suffix="%"
          icon={<Percent className="h-5 w-5" />}
          onSave={(v) => updateSetting("platformFeePercent", v)}
          min={0}
          max={50}
        />
        <SettingCard
          label="Deposito"
          description="Porcentaje del valor del vehiculo que se cobra como deposito"
          value={settings.depositPercent}
          suffix="%"
          icon={<Percent className="h-5 w-5" />}
          onSave={(v) => updateSetting("depositPercent", v)}
          min={0}
          max={50}
        />
        <SettingCard
          label="Recargo fin de semana"
          description="Porcentaje de recargo sobre el precio base los fines de semana"
          value={settings.weekendMarkupPercent}
          suffix="%"
          icon={<Percent className="h-5 w-5" />}
          onSave={(v) => updateSetting("weekendMarkupPercent", v)}
          min={0}
          max={100}
        />
        <SettingCard
          label="Dias minimos de reserva"
          description="Cantidad minima de dias para una reserva"
          value={settings.minBookingDays}
          suffix=" dias"
          icon={<Calendar className="h-5 w-5" />}
          onSave={(v) => updateSetting("minBookingDays", v)}
          min={1}
          max={30}
        />
        <SettingCard
          label="Dias maximos de reserva"
          description="Cantidad maxima de dias para una reserva"
          value={settings.maxBookingDays}
          suffix=" dias"
          icon={<Calendar className="h-5 w-5" />}
          onSave={(v) => updateSetting("maxBookingDays", v)}
          min={1}
          max={365}
        />
        <SettingCard
          label="Cancelacion gratuita"
          description="Horas despues de la reserva en que se puede cancelar sin costo"
          value={settings.cancellationFreeHours}
          suffix=" hrs"
          icon={<Clock className="h-5 w-5" />}
          onSave={(v) => updateSetting("cancellationFreeHours", v)}
          min={0}
          max={168}
        />
      </div>
    </div>
  );
}
