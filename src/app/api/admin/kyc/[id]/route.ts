import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS } from "@/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.KYC);
  if ("error" in result) return result.error;

  const { id } = await params;

  const document = await prisma.kYCDocument.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          kycStatus: true,
          roles: true,
          createdAt: true,
          kycDocuments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Documento KYC no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(document);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.KYC);
  if ("error" in result) return result.error;
  const { user: admin } = result;

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  if (!status || !["VERIFIED", "REJECTED"].includes(status)) {
    return NextResponse.json(
      { error: "Status inválido. Valores permitidos: VERIFIED, REJECTED" },
      { status: 400 }
    );
  }

  const document = await prisma.kYCDocument.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Documento KYC no encontrado" },
      { status: 404 }
    );
  }

  // Update the document
  const updated = await prisma.kYCDocument.update({
    where: { id },
    data: {
      status,
      notes: notes || null,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
  });

  // Check all documents for this user to determine overall KYC status
  const allDocuments = await prisma.kYCDocument.findMany({
    where: { userId: document.userId },
    select: { status: true },
  });

  let userKycStatus: "PENDING" | "VERIFIED" | "REJECTED" = "PENDING";

  if (allDocuments.some((d) => d.status === "REJECTED")) {
    userKycStatus = "REJECTED";
  } else if (
    allDocuments.length > 0 &&
    allDocuments.every((d) => d.status === "VERIFIED")
  ) {
    userKycStatus = "VERIFIED";
  }

  await prisma.user.update({
    where: { id: document.userId },
    data: { kycStatus: userKycStatus },
  });

  return NextResponse.json({
    document: updated,
    userKycStatus,
  });
}
