"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

interface KYCDocument {
  id: string;
  type: string;
  documentUrl: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface KYCGroup {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    kycStatus: string;
  };
  documents: KYCDocument[];
}

interface KYCResponse {
  groups: KYCGroup[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const kycBadgeVariant: Record<string, "success" | "warning" | "destructive"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "destructive",
};

export default function AdminKYCPage() {
  const t = useTranslations("admin.kyc");
  const tc = useTranslations("common");

  const [tab, setTab] = useState("PENDING");
  const [data, setData] = useState<KYCResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { toast } = useToast();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [dialogDocIds, setDialogDocIds] = useState<string[]>([]);
  const [dialogNotes, setDialogNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchKYC = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc?status=${tab}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchKYC();
  }, [fetchKYC]);

  const openActionDialog = (docIds: string[], action: "VERIFIED" | "REJECTED") => {
    setDialogDocIds(docIds);
    setDialogAction(action);
    setDialogNotes("");
    setDialogOpen(true);
  };

  const handleAction = async () => {
    if (dialogDocIds.length === 0) return;
    setSubmitting(true);
    try {
      const results = await Promise.all(
        dialogDocIds.map((docId) =>
          fetch(`/api/admin/kyc/${docId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: dialogAction,
              notes: dialogNotes || undefined,
            }),
          })
        )
      );

      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast({
          title: dialogAction === "VERIFIED" ? t("kycApproved") : t("kycRejected"),
        });
        setDialogOpen(false);
        fetchKYC();
      } else {
        toast({ title: tc("labels.error"), description: t("processingError"), variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="PENDING">{t("pending")}</TabsTrigger>
          <TabsTrigger value="VERIFIED">{t("verified")}</TabsTrigger>
          <TabsTrigger value="REJECTED">{t("rejected")}</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !data || data.groups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                {tab === "PENDING" ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t("allCaughtUp")}</h3>
                    <p className="text-muted-foreground text-center">{t("noPendingRequests")}</p>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {t("noUsersStatus", { status: tab === "VERIFIED" ? t("verified").toLowerCase() : t("rejected").toLowerCase() })}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.groups.map((group) => (
                <Card key={group.user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar>
                          <AvatarImage src={group.user.avatarUrl || undefined} />
                          <AvatarFallback>{getInitials(group.user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-semibold">{group.user.fullName}</h3>
                          <p className="text-sm text-muted-foreground truncate">{group.user.email}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {group.documents.map((doc) => (
                              <Badge key={doc.id} variant="outline" className="text-xs">
                                {tc(`kycDocuments.${doc.type}`)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge variant={kycBadgeVariant[group.user.kycStatus] || "secondary"}>
                          {tab === "PENDING" && <Clock className="mr-1 h-3 w-3" />}
                          {tab === "VERIFIED" && <CheckCircle className="mr-1 h-3 w-3" />}
                          {tab === "REJECTED" && <XCircle className="mr-1 h-3 w-3" />}
                          {tc(`labels.${group.user.kycStatus.toLowerCase()}`)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(group.documents[0]?.createdAt)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedUser(expandedUser === group.user.id ? null : group.user.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {expandedUser === group.user.id ? t("hideDocuments") : t("viewDocuments")}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Documents */}
                    {expandedUser === group.user.id && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {group.documents.map((doc) => (
                            <div key={doc.id} className="border rounded-md p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  {tc(`kycDocuments.${doc.type}`)}
                                </span>
                                <Badge variant={kycBadgeVariant[doc.status] || "secondary"} className="text-xs">
                                  {tc(`labels.${doc.status.toLowerCase()}`)}
                                </Badge>
                              </div>
                              <div className="relative aspect-video rounded bg-muted mb-2 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={doc.documentUrl}
                                  alt={tc(`kycDocuments.${doc.type}`)}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <Button variant="outline" size="sm" className="w-full" asChild>
                                <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-2" />
                                  {t("viewFull")}
                                </a>
                              </Button>
                              {doc.notes && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {t("note", { note: doc.notes })}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Action buttons for pending */}
                        {tab === "PENDING" && (
                          <div className="flex gap-2 mt-4 justify-end">
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => openActionDialog(group.documents.map((d) => d.id), "REJECTED")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {t("rejectUser")}
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openActionDialog(group.documents.map((d) => d.id), "VERIFIED")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {t("approveUser")}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "VERIFIED" ? t("approveKYCTitle") : t("rejectKYCTitle")}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "VERIFIED" ? t("approveKYCDescription") : t("rejectKYCDescription")}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-sm mb-2 block">{t("notesLabel")}</Label>
            <Textarea
              value={dialogNotes}
              onChange={(e) => setDialogNotes(e.target.value)}
              placeholder={
                dialogAction === "REJECTED"
                  ? t("rejectionReasonPlaceholder")
                  : t("additionalNotesPlaceholder")
              }
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              {tc("actions.cancel")}
            </Button>
            <Button
              onClick={handleAction}
              disabled={submitting}
              className={dialogAction === "VERIFIED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {submitting
                ? t("processing")
                : dialogAction === "VERIFIED"
                ? t("confirmApproval")
                : t("confirmRejection")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
