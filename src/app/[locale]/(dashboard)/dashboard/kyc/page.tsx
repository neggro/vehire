"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import { useTranslations } from "next-intl";

interface DocumentStatus {
  type: string;
  status: "pending" | "uploading" | "uploaded" | "verified" | "rejected";
  url?: string;
  notes?: string;
}

export default function KYCPage() {
  const t = useTranslations("dashboard.kyc");
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
        return <Badge variant="success">{t("statusVerified")}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{t("statusRejected")}</Badge>;
      case "uploaded":
        return <Badge variant="warning">{t("statusInReview")}</Badge>;
      case "uploading":
        return <Badge variant="secondary">{t("statusUploading")}</Badge>;
      default:
        return <Badge variant="outline">{t("statusPending")}</Badge>;
    }
  };

  const getDocumentDescription = (type: string): string => {
    switch (type) {
      case KYC_DOCUMENT_TYPES.ID_DOCUMENT:
        return t("docDescIdDocument");
      case KYC_DOCUMENT_TYPES.LICENSE:
        return t("docDescLicense");
      case KYC_DOCUMENT_TYPES.SELFIE:
        return t("docDescSelfie");
      default:
        return "";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: t("invalidFile"),
        description: t("invalidFileDesc"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("fileTooLarge"),
        description: t("fileTooLargeDesc"),
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
      // Upload via API route
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/kyc/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { document } = await response.json();

      // Update local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.type === type
            ? { ...doc, status: "uploaded", url: document.documentUrl }
            : doc
        )
      );

      toast({
        title: t("documentUploaded"),
        description: t("documentUploadedDesc", { document: KYC_DOCUMENT_LABELS[type] }),
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
        title: t("uploadError"),
        description: t("uploadErrorDesc"),
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
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
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
                  ? t("documentsSent")
                  : t("pendingVerification")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {allUploaded
                  ? t("documentsSentDesc")
                  : t("pendingVerificationDesc")}
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
                      {t("upload")}
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
                      {t("replace")}
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
          <CardTitle className="text-lg">{t("requirements")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              {t("req1")}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              {t("req2")}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              {t("req3")}
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
              {t("req4")}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
