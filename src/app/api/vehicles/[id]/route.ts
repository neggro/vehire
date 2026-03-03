import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        color: true,
        plateNumber: true,
        city: true,
        state: true,
        country: true,
        address: true,
        description: true,
        basePriceDay: true,
        weekendPriceDay: true,
        estimatedValue: true,
        deliveryAvailable: true,
        deliveryPrice: true,
        status: true,
        features: true,
        seats: true,
        transmission: true,
        fuelType: true,
        mileage: true,
        mileageLimit: true,
        locationLat: true,
        locationLng: true,
        locationPublicLat: true,
        locationPublicLng: true,
        createdAt: true,
        host: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            createdAt: true,
            reviewsReceived: {
              where: { isPublic: true },
              select: { rating: true },
            },
            vehicles: {
              select: { id: true },
              where: { status: "ACTIVE" },
            },
          },
        },
        images: {
          select: { id: true, url: true, order: true, isPrimary: true },
          orderBy: { order: "asc" },
        },
        bookings: {
          where: {
            status: { in: ["COMPLETED"] },
            review: { isNot: null },
          },
          select: {
            review: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                reviewer: {
                  select: { fullName: true, avatarUrl: true },
                },
              },
            },
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            bookings: {
              where: { status: "COMPLETED" },
            },
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Only return active or paused vehicles to public
    if (vehicle.status !== "ACTIVE" && vehicle.status !== "PAUSED") {
      return NextResponse.json({ error: "Vehicle not available" }, { status: 404 });
    }

    // Calculate host stats
    const hostReviewCount = vehicle.host.reviewsReceived.length;
    const hostRating = hostReviewCount > 0
      ? vehicle.host.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / hostReviewCount
      : null;

    // Calculate vehicle rating from reviews
    const reviews = vehicle.bookings
      .map((b) => b.review)
      .filter(Boolean);
    const reviewCount = reviews.length;
    const rating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviewCount
      : null;

    // Format response
    const response = {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      city: vehicle.city,
      state: vehicle.state,
      country: vehicle.country,
      address: vehicle.locationPublicLat ? null : vehicle.address, // Only show exact address if no public location
      description: vehicle.description,
      basePriceDay: vehicle.basePriceDay,
      weekendPriceDay: vehicle.weekendPriceDay,
      estimatedValue: vehicle.estimatedValue,
      deliveryAvailable: vehicle.deliveryAvailable,
      deliveryPrice: vehicle.deliveryPrice,
      features: vehicle.features,
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuelType,
      mileage: vehicle.mileage,
      mileageLimit: vehicle.mileageLimit,
      status: vehicle.status,
      images: vehicle.images,
      location: {
        lat: vehicle.locationPublicLat || vehicle.locationLat,
        lng: vehicle.locationPublicLng || vehicle.locationLng,
        address: vehicle.locationPublicLat
          ? `${vehicle.city}${vehicle.state ? `, ${vehicle.state}` : ""}`
          : vehicle.address,
      },
      rating: rating ? Math.round(rating * 10) / 10 : null,
      reviewCount,
      tripsCount: vehicle._count.bookings,
      host: {
        id: vehicle.host.id,
        fullName: vehicle.host.fullName,
        avatarUrl: vehicle.host.avatarUrl,
        rating: hostRating ? Math.round(hostRating * 10) / 10 : null,
        reviewCount: hostReviewCount,
        tripsCount: vehicle.host.vehicles.length,
        memberSince: vehicle.host.createdAt,
      },
      reviews: reviews.map((r) => ({
        id: r!.id,
        rating: r!.rating,
        comment: r!.comment,
        createdAt: r!.createdAt,
        author: r!.reviewer.fullName,
        authorAvatar: r!.reviewer.avatarUrl,
      })),
      // Default rules (could be moved to database later)
      rules: [
        "No fumar en el vehículo",
        "No se permiten mascotas",
        "Devolver con el mismo nivel de combustible",
        vehicle.mileageLimit ? `Máximo ${vehicle.mileageLimit} km por día` : null,
      ].filter(Boolean),
    };

    return NextResponse.json({ vehicle: response });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
