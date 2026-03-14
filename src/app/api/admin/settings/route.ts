import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ADMIN_PERMISSIONS } from "@/constants";

export async function GET() {
  const result = await requireAdmin(ADMIN_PERMISSIONS.SETTINGS);
  if ("error" in result) return result.error;

  const configs = await prisma.systemConfig.findMany({
    orderBy: { key: "asc" },
  });

  return NextResponse.json(configs);
}

export async function PUT(request: NextRequest) {
  const result = await requireAdmin(ADMIN_PERMISSIONS.SETTINGS);
  if ("error" in result) return result.error;

  const body = await request.json();
  const { key, value, description } = body;

  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "Los campos key y value son requeridos" },
      { status: 400 }
    );
  }

  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: {
      value,
      ...(description !== undefined && { description }),
    },
    create: {
      key,
      value,
      description: description || null,
    },
  });

  return NextResponse.json(config);
}
