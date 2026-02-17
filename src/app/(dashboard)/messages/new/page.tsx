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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, HeadphonesIcon, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewMessagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "SUPPORT_DRIVER",
    title: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setIsLoading(true);
    try {
      // Create conversation
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          title: formData.title || undefined,
          initialMessage: formData.message,
        }),
      });

      if (!response.ok) throw new Error("Error creating conversation");

      const { conversationId } = await response.json();

      toast({
        title: "Conversación creada",
        description: "Tu mensaje ha sido enviado",
      });

      router.push(`/messages/${conversationId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la conversación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions = [
    {
      value: "SUPPORT_DRIVER",
      label: "Soporte para Conductores",
      description: "Ayuda con reservas, pagos o problemas como conductor",
      icon: Car,
    },
    {
      value: "SUPPORT_HOST",
      label: "Soporte para Anfitriones",
      description: "Ayuda con vehículos, pagos o problemas como anfitrión",
      icon: HeadphonesIcon,
    },
  ];

  const selectedType = typeOptions.find((t) => t.value === formData.type);

  return (
    <div className="container max-w-2xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/messages"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mensajes
        </Link>
        <h1 className="text-3xl font-bold">Nuevo mensaje</h1>
        <p className="text-muted-foreground">
          Inicia una nueva conversación con nuestro equipo de soporte
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del mensaje</CardTitle>
          <CardDescription>
            Completa la información para iniciar la conversación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de consulta</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-sm text-muted-foreground">
                  {selectedType.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Asunto (opcional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Ej: Problema con el pago de mi reserva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Describe tu consulta o problema..."
                rows={6}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !formData.message.trim()}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar mensaje
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
