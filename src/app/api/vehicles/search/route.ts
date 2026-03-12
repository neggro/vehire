import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vehicles/search
 * Search vehicles with filters
 *
 * Query params:
 * - city: string (partial match)
 * - startDate: ISO datetime string (includes time)
 * - endDate: ISO datetime string (includes time)
 * - minPrice: number (in cents)
 * - maxPrice: number (in cents)
 * - transmission: "automatic" | "manual"
 * - fuelType: string
 * - minSeats: number
 * - sortBy: "price_asc" | "price_desc" | "rating" | "relevance"
 * - page: number (default 1)
 * - limit: number (default 12)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const city = searchParams.get("city");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const transmission = searchParams.get("transmission");
    const fuelType = searchParams.get("fuelType");
    const minSeats = searchParams.get("minSeats");
    const sortBy = searchParams.get("sortBy") || "relevance";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    // Build where clause
    const where: any = {
      status: "ACTIVE",
    };

    // City filter (case-insensitive partial match)
    if (city) {
      where.city = {
        contains: city,
        mode: "insensitive",
      };
    }

    // Price filters
    if (minPrice || maxPrice) {
      where.basePriceDay = {};
      if (minPrice) {
        where.basePriceDay.gte = parseInt(minPrice, 10);
      }
      if (maxPrice) {
        where.basePriceDay.lte = parseInt(maxPrice, 10);
      }
    }

    // Transmission filter
    if (transmission && transmission !== "all") {
      where.transmission = transmission;
    }

    // Fuel type filter
    if (fuelType && fuelType !== "all") {
      where.fuelType = fuelType;
    }

    // Seats filter
    if (minSeats && minSeats !== "all") {
      where.seats = {
        gte: parseInt(minSeats, 10),
      };
    }

    // If dates are provided, check availability
    let unavailableVehicleIds: string[] = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Find bookings that overlap with the requested dates (including time)
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          OR: [
            // Booking starts before and ends after our start
            {
              AND: [
                { startDate: { lte: start } },
                { endDate: { gt: start } },
              ],
            },
            // Booking starts before and ends after our end
            {
              AND: [
                { startDate: { lt: end } },
                { endDate: { gte: end } },
              ],
            },
            // Booking is completely within our range
            {
              AND: [
                { startDate: { gte: start } },
                { endDate: { lte: end } },
              ],
            },
            // Our range is completely within booking
            {
              AND: [
                { startDate: { lte: start } },
                { endDate: { gte: end } },
              ],
            },
          ],
        },
        select: { vehicleId: true },
      });

      unavailableVehicleIds = Array.from(new Set(overlappingBookings.map((b) => b.vehicleId)));

      // Also check explicit availability blocks (date-only, so extract date part)
      const startDateOnly = new Date(start);
      startDateOnly.setHours(0, 0, 0, 0);
      const endDateOnly = new Date(end);
      endDateOnly.setHours(0, 0, 0, 0);

      const blockedVehicles = await prisma.availability.findMany({
        where: {
          date: {
            gte: startDateOnly,
            lte: endDateOnly,
          },
          isAvailable: false,
        },
        select: { vehicleId: true },
      });

      unavailableVehicleIds = Array.from(
        new Set([...unavailableVehicleIds, ...blockedVehicles.map((b) => b.vehicleId)])
      );
    }

    // Exclude unavailable vehicles
    if (unavailableVehicleIds.length > 0) {
      where.id = { notIn: unavailableVehicleIds };
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" }; // Default: relevance (newest first)
    switch (sortBy) {
      case "price_asc":
        orderBy = { basePriceDay: "asc" };
        break;
      case "price_desc":
        orderBy = { basePriceDay: "desc" };
        break;
      case "rating":
        orderBy = { reviewsReceived: { _count: "desc" } };
        break;
    }

    // Get total count for pagination
    const total = await prisma.vehicle.count({ where });

    // Get vehicles with pagination
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            reviewsReceived: {
              select: { rating: true },
            },
          },
        },
        images: {
          select: { url: true },
          orderBy: { order: "asc" },
          take: 1,
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format response
    const formattedVehicles = vehicles.map((vehicle) => {
      // Calculate average rating from host's reviews
      const hostReviews = vehicle.host.reviewsReceived;
      const avgRating =
        hostReviews.length > 0
          ? hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length
          : null;

      return {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        city: vehicle.city,
        state: vehicle.state,
        basePriceDay: vehicle.basePriceDay,
        weekendPriceDay: vehicle.weekendPriceDay,
        images: vehicle.images,
        features: vehicle.features || [],
        seats: vehicle.seats,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        rating: avgRating,
        reviewCount: hostReviews.length,
        host: {
          id: vehicle.host.id,
          fullName: vehicle.host.fullName,
        },
      };
    });

    return NextResponse.json({
      vehicles: formattedVehicles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error searching vehicles:", error);
    return NextResponse.json(
      { error: "Error al buscar vehículos" },
      { status: 500 }
    );
  }
}
