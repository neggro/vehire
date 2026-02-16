import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { KYC_DOCUMENT_LABELS } from "@/constants";

// Mock data for KYC reviews
const pendingReviews = [
  {
    id: "1",
    userId: "user1",
    user: {
      fullName: "María García",
      email: "maria@example.com",
      avatarUrl: null,
    },
    submittedAt: "2024-02-10",
    documents: [
      { type: "id_document", status: "PENDING" },
      { type: "license", status: "PENDING" },
      { type: "selfie", status: "PENDING" },
    ],
  },
  {
    id: "2",
    userId: "user2",
    user: {
      fullName: "Juan Pérez",
      email: "juan@example.com",
      avatarUrl: null,
    },
    submittedAt: "2024-02-09",
    documents: [
      { type: "id_document", status: "PENDING" },
      { type: "license", status: "PENDING" },
      { type: "selfie", status: "PENDING" },
    ],
  },
];

const recentDecisions = [
  {
    id: "3",
    userId: "user3",
    user: {
      fullName: "Ana Martínez",
      email: "ana@example.com",
    },
    status: "VERIFIED",
    reviewedAt: "2024-02-10",
    reviewedBy: "Admin",
  },
  {
    id: "4",
    userId: "user4",
    user: {
      fullName: "Carlos López",
      email: "carlos@example.com",
    },
    status: "REJECTED",
    reviewedAt: "2024-02-09",
    reviewedBy: "Admin",
    notes: "Documento ilegible",
  },
];

export default function AdminKYCPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Verificación KYC</h1>
        <p className="text-muted-foreground">
          Revisa y aprueba solicitudes de verificación de identidad
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pendientes de revisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {pendingReviews.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Aprobados (este mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {recentDecisions.filter((d) => d.status === "VERIFIED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Rechazados (este mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {recentDecisions.filter((d) => d.status === "REJECTED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pendientes ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">Revisados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingReviews.length > 0 ? (
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {review.user.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{review.user.fullName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {review.user.email}
                          </p>
                          <div className="mt-2 flex gap-2">
                            {review.documents.map((doc) => (
                              <Badge key={doc.type} variant="outline">
                                {KYC_DOCUMENT_LABELS[doc.type]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="warning">
                          <Clock className="mr-1 h-3 w-3" />
                          Enviado {new Date(review.submittedAt).toLocaleDateString("es-UY")}
                        </Badge>
                        <Button asChild>
                          <Link href={`/admin/kyc/${review.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Revisar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  ¡Todo al día!
                </h3>
                <p className="text-muted-foreground text-center">
                  No hay solicitudes pendientes de revisión
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviewed">
          <div className="space-y-4">
            {recentDecisions.map((decision) => (
              <Card key={decision.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {decision.user.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{decision.user.fullName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {decision.user.email}
                        </p>
                        {decision.notes && (
                          <p className="text-sm text-red-500 mt-1">
                            Nota: {decision.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          decision.status === "VERIFIED" ? "success" : "destructive"
                        }
                      >
                        {decision.status === "VERIFIED" ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {decision.status === "VERIFIED" ? "Aprobado" : "Rechazado"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Revisado el{" "}
                        {new Date(decision.reviewedAt).toLocaleDateString("es-UY")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
