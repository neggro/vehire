import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

interface SimilarVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  city: string;
  state: string | null;
  basePriceDay: number;
  images: { url: string }[];
}

/**
 * Find users with pending reservations for a vehicle that was just booked
 * and send them notifications with similar vehicles
 */
export async function notifyPendingReservationHolders(params: {
  vehicleId: string;
  bookedStartDate: Date;
  bookedEndDate: Date;
  bookedBy: string; // User ID who made the booking
}) {
  const { vehicleId, bookedStartDate, bookedEndDate, bookedBy } = params;

  // Find pending reservations for the same vehicle with overlapping dates
  // (excluding the user who just booked)
  const conflictingPendingReservations = await prisma.pendingReservation.findMany({
    where: {
      vehicleId,
      driverId: { not: bookedBy },
      startDate: { lt: bookedEndDate },
      endDate: { gt: bookedStartDate },
    },
    include: {
      driver: {
        include: { emailSettings: true },
      },
      vehicle: {
        select: {
          make: true,
          model: true,
          year: true,
          city: true,
          transmission: true,
          seats: true,
        },
      },
    },
  });

  if (conflictingPendingReservations.length === 0) {
    return { notified: 0 };
  }

  // Get the booked vehicle details for the email
  const bookedVehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      make: true,
      model: true,
      year: true,
      city: true,
    },
  });

  if (!bookedVehicle) {
    return { notified: 0 };
  }

  // For each user with a conflicting pending reservation
  for (const pendingRes of conflictingPendingReservations) {
    // Check if user has marketing emails enabled (or booking reminders)
    const emailSettings = pendingRes.driver.emailSettings;
    if (emailSettings?.bookingReminders === false) {
      continue; // User opted out of these notifications
    }

    // Find similar vehicles
    const similarVehicles = await findSimilarVehicles({
      vehicleId,
      city: pendingRes.vehicle.city,
      excludeVehicleIds: [vehicleId],
      startDate: pendingRes.startDate,
      endDate: pendingRes.endDate,
      seats: pendingRes.vehicle.seats,
      transmission: pendingRes.vehicle.transmission,
      limit: 3,
    });

    // Send notification email
    try {
      await sendVehicleUnavailableEmail({
        to: pendingRes.driver.email,
        userName: pendingRes.driver.fullName,
        bookedVehicle: {
          make: bookedVehicle.make,
          model: bookedVehicle.model,
          year: bookedVehicle.year,
          city: bookedVehicle.city,
        },
        pendingReservation: {
          startDate: pendingRes.startDate,
          endDate: pendingRes.endDate,
        },
        similarVehicles: similarVehicles.map((v) => ({
          id: v.id,
          make: v.make,
          model: v.model,
          year: v.year,
          city: v.city,
          state: v.state,
          basePriceDay: v.basePriceDay,
          imageUrl: v.images[0]?.url,
        })),
      });

      // Mark reminder as sent
      await prisma.pendingReservation.update({
        where: { id: pendingRes.id },
        data: { reminderSentAt: new Date() },
      });
    } catch (error) {
      console.error(`Failed to send notification to ${pendingRes.driver.email}:`, error);
    }
  }

  return { notified: conflictingPendingReservations.length };
}

/**
 * Find similar vehicles based on criteria
 */
async function findSimilarVehicles(params: {
  vehicleId: string;
  city: string;
  excludeVehicleIds: string[];
  startDate: Date;
  endDate: Date;
  seats: number;
  transmission: string;
  limit: number;
}): Promise<SimilarVehicle[]> {
  const {
    city,
    excludeVehicleIds,
    startDate,
    endDate,
    seats,
    transmission,
    limit,
  } = params;

  // Find vehicles that:
  // 1. Are active
  // 2. Match city or similar characteristics
  // 3. Have similar seats
  // 4. Don't have conflicting bookings
  const similarVehicles = await prisma.vehicle.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: excludeVehicleIds },
      city: { contains: city, mode: "insensitive" },
      seats: { gte: seats - 1, lte: seats + 1 },
      bookings: {
        none: {
          status: { in: ["CONFIRMED", "ACTIVE"] },
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
      },
    },
    include: {
      images: {
        select: { url: true },
        orderBy: { order: "asc" },
        take: 1,
      },
    },
    orderBy: [
      { transmission: "asc" }, // Same transmission first
      { basePriceDay: "asc" },
    ],
    take: limit,
  });

  return similarVehicles;
}

interface VehicleUnavailableEmailParams {
  to: string;
  userName: string;
  bookedVehicle: {
    make: string;
    model: string;
    year: number;
    city: string;
  };
  pendingReservation: {
    startDate: Date;
    endDate: Date;
  };
  similarVehicles: {
    id: string;
    make: string;
    model: string;
    year: number;
    city: string;
    state: string | null;
    basePriceDay: number;
    imageUrl: string | null;
  }[];
}

async function sendVehicleUnavailableEmail(params: VehicleUnavailableEmailParams) {
  const { to, userName, bookedVehicle, pendingReservation, similarVehicles } = params;

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-UY", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("es-UY", {
      style: "currency",
      currency: "UYU",
      minimumFractionDigits: 0,
    }).format(cents / 100);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const similarVehiclesHtml =
    similarVehicles.length > 0
      ? `
        <div style="margin-top: 24px;">
          <h3 style="margin-bottom: 16px; font-size: 18px;">Vehículos similares disponibles:</h3>
          ${similarVehicles
            .map(
              (v) => `
            <a href="${baseUrl}/vehicle/${v.id}" style="display: block; text-decoration: none; color: inherit;">
              <div style="display: flex; gap: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
                <div style="width: 100px; height: 75px; background: #f3f4f6; border-radius: 8px; overflow: hidden;">
                  ${
                    v.imageUrl
                      ? `<img src="${v.imageUrl}" alt="${v.make} ${v.model}" style="width: 100%; height: 100%; object-fit: cover;" />`
                      : ""
                  }
                </div>
                <div style="flex: 1;">
                  <p style="font-weight: 600; margin: 0 0 4px 0;">${v.make} ${v.model} (${v.year})</p>
                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px 0;">${v.city}${v.state ? `, ${v.state}` : ""}</p>
                  <p style="font-weight: 600; color: #2563eb; margin: 0;">${formatPrice(v.basePriceDay)}/día</p>
                </div>
              </div>
            </a>
          `
            )
            .join("")}
        </div>
      `
      : `
        <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0;">No encontramos vehículos similares disponibles para esas fechas. Te recomendamos <a href="${baseUrl}/search" style="color: #2563eb;">buscar otras opciones</a>.</p>
        </div>
      `;

  await sendEmail({
    to,
    subject: `El vehículo que te interesaba ya no está disponible`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Hola ${userName},</h1>

        <p style="font-size: 16px;">
          Te escribimos para contarte que el <strong>${bookedVehicle.make} ${bookedVehicle.model} (${bookedVehicle.year})</strong> en ${bookedVehicle.city}
          que tenías pendiente para el <strong>${formatDate(pendingReservation.startDate)}</strong> ya no está disponible.
        </p>

        <p style="font-size: 16px;">
          Otro usuario completó el pago antes y el vehículo fue reservado.
        </p>

        <p style="font-size: 16px; margin-bottom: 8px;">
          ¡Pero no te preocupes! Encontramos algunas alternativas que podrían interesarte:
        </p>

        ${similarVehiclesHtml}

        <div style="margin-top: 32px;">
          <a href="${baseUrl}/search" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Buscar más vehículos
          </a>
        </div>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

        <p style="font-size: 14px; color: #6b7280;">
          ¿No quieres recibir estos recordatorios? Puedes configurar tus preferencias en
          <a href="${baseUrl}/dashboard/settings" style="color: #2563eb;">Configuración de emails</a>.
        </p>
      </body>
      </html>
    `,
  });
}
