"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createBrowserClient } from "@/lib/supabase";
import {
  KYC_DOCUMENT_TYPES,
  KYC_DOCUMENT_LABELS,
} from "@/constants";
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";

interface DocumentStatus {
  type: string;
  status: "pending" | "uploading" | "uploaded" | "verified" | "rejected";
  url?: string;
  notes?: string;
}

export default function KYCPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentStatus[]>([
    { type: KYC_DOCUMENT_TYPES.ID_DOCUMENT, status: "pending" },
    { type: KYC_DOCUMENT_TYPES.LICENSE, status: "pending" },
    { type: KYC_DOCUMENT_TYPES.SELFIE, status: "pending" },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "uploaded":
      case "uploading":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="success">Verificado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>;
      case "uploaded":
        return <Badge variant="warning">En revisión</Badge>;
      case "uploading":
        return <Badge variant="secondary">Subiendo...</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo inválido",
        description: "Por favor sube una imagen (JPG, PNG)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no puede exceder 5MB",
        variant: "destructive",
      });
      return;
    }

    // Upload file
    await uploadDocument(file, selectedType);
  };

  const uploadDocument = async (file: File, type: string) => {
    setIsLoading(true);

    // Update status to uploading
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.type === type ? { ...doc, status: "uploading" } : doc
      )
    );

    try {
      const supabase = createBrowserClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No autenticado");
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("kyc-documents")
        .getPublicUrl(fileName);

      // Save document record
      const { error: dbError } = await (supabase as any).from("kyc_documents").insert({
        userId: user.id,
        type,
        documentUrl: urlData.publicUrl,
        status: "PENDING",
      });

      if (dbError) {
        throw dbError;
      }

      // Update local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.type === type
            ? { ...doc, status: "uploaded", url: urlData.publicUrl }
            : doc
        )
      );

      toast({
        title: "Documento subido",
        description: `${KYC_DOCUMENT_LABELS[type]} ha sido subido correctamente`,
      });
    } catch (error) {
      console.error("Upload error:", error);

      // Reset status
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.type === type ? { ...doc, status: "pending" } : doc
        )
      );

      toast({
        title: "Error al subir",
        description: "No se pudo subir el documento. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const allUploaded = documents.every(
    (doc) => doc.status === "uploaded" || doc.status === "verified"
  );

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Verificación de identidad</h1>
        <p className="text-muted-foreground">
          Para publicar vehículos y recibir pagos, necesitamos verificar tu
          identidad
        </p>
      </div>

      {/* Status overview */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                allUploaded ? "bg-green-100" : "bg-yellow-100"
              }`}
            >
              {allUploaded ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {allUploaded
                  ? "Documentos enviados"
                  : "Pendiente de verificación"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {allUploaded
                  ? "Tu solicitud está siendo revisada. Te notificaremos por email."
                  : "Sube los documentos requeridos para completar la verificación"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Document list */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.type}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(doc.status)}
                  <div>
                    <h3 className="font-medium">
                      {KYC_DOCUMENT_LABELS[doc.type]}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getDocumentDescription(doc.type)}
                    </p>
                    {doc.notes && (
                      <p className="mt-1 text-sm text-red-500">{doc.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  {doc.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedType(doc.type);
                        fileInputRef.current?.click();
                      }}
                      disabled={isLoading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Subir
                    </Button>
                  )}
                  {doc.status === "uploaded" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedType(doc.type);
                        fileInputRef.current?.click();
                      }}
                      disabled={isLoading}
                    >
                      Reemplazar
                    </Button>
                  )}
                </div>
              </div>

              {/* Preview if uploaded */}
              {doc.url && (
                <div className="mt-4">
                  <img
                    src={doc.url}
                    alt={KYC_DOCUMENT_LABELS[doc.type]}
                    className="h-32 rounded-lg border object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requirements */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Requisitos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              Los documentos deben ser legibles y estar vigentes
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              Formato: JPG o PNG, máximo 5MB por archivo
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              La selfie debe mostrar tu rostro junto a tu documento
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              El proceso de verificación toma 1-2 días hábiles
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function getDocumentDescription(type: string): string {
  switch (type) {
    case KYC_DOCUMENT_TYPES.ID_DOCUMENT:
      return "Cédula de identidad, DNI o pasaporte (frente y dorso)";
    case KYC_DOCUMENT_TYPES.LICENSE:
      return "Licencia de conducir vigente";
    case KYC_DOCUMENT_TYPES.SELFIE:
      return "Foto tuya sosteniendo tu documento de identidad";
    default:
      return "";
  }
}
