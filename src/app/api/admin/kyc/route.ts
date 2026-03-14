import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS, DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.KYC);
  if ("error" in result) return result.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE))));
  const status = searchParams.get("status") || "";

  const where: Prisma.KYCDocumentWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  const [documents, total] = await Promise.all([
    prisma.kYCDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        documentUrl: true,
        status: true,
        reviewedBy: true,
        reviewedAt: true,
        notes: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            kycStatus: true,
          },
        },
      },
    }),
    prisma.kYCDocument.count({ where }),
  ]);

  // Group documents by user
  const groupedByUser = documents.reduce(
    (acc, doc) => {
      const userId = doc.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: doc.user,
          documents: [],
        };
      }
      acc[userId].documents.push({
        id: doc.id,
        type: doc.type,
        documentUrl: doc.documentUrl,
        status: doc.status,
        reviewedBy: doc.reviewedBy,
        reviewedAt: doc.reviewedAt,
        notes: doc.notes,
        createdAt: doc.createdAt,
      });
      return acc;
    },
    {} as Record<string, { user: typeof documents[0]["user"]; documents: Array<Omit<typeof documents[0], "user">> }>
  );

  return NextResponse.json({
    groups: Object.values(groupedByUser),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
