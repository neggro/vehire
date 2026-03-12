import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/locations
 * Returns distinct cities from active vehicles, with count and representative coordinates.
 *
 * Query params:
 * - q: string (optional, filter by partial match)
 * - lat: number (optional, user latitude for distance sorting)
 * - lng: number (optional, user longitude for distance sorting)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const userLat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const userLng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;

    const where: any = {
      status: "ACTIVE",
    };

    if (q && q.length >= 1) {
      where.city = {
        contains: q,
        mode: "insensitive",
      };
    }

    // Group by city and get count + average coordinates
    const cities = await prisma.vehicle.groupBy({
      by: ["city"],
      where,
      _count: { id: true },
      _avg: { locationLat: true, locationLng: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    });

    let results = cities.map((c) => ({
      city: c.city,
      count: c._count.id,
      lat: c._avg.locationLat!,
      lng: c._avg.locationLng!,
    }));

    // Sort by distance if user location provided
    if (userLat !== null && userLng !== null) {
      results = results
        .map((r) => ({
          ...r,
          distance: haversineKm(userLat, userLng, r.lat, r.lng),
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    return NextResponse.json({ locations: results });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Error al obtener ubicaciones" },
      { status: 500 }
    );
  }
}

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
