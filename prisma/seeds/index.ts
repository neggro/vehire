import { PrismaClient, UserRole, KYCStatus, VehicleStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@vehire.com" },
    update: {},
    create: {
      email: "admin@vehire.com",
      fullName: "Admin User",
      phone: "+59899999999",
      roles: [UserRole.USER, UserRole.ADMIN, UserRole.HOST, UserRole.DRIVER],
      kycStatus: KYCStatus.VERIFIED,
    },
  });

  console.log("Created admin user:", adminUser.email);

  // Create test host
  const hostUser = await prisma.user.upsert({
    where: { email: "host@vehire.com" },
    update: {},
    create: {
      email: "host@vehire.com",
      fullName: "Host Test",
      phone: "+59899988888",
      roles: [UserRole.USER, UserRole.HOST],
      kycStatus: KYCStatus.VERIFIED,
    },
  });

  console.log("Created host user:", hostUser.email);

  // Create test driver
  const driverUser = await prisma.user.upsert({
    where: { email: "driver@vehire.com" },
    update: {},
    create: {
      email: "driver@vehire.com",
      fullName: "Driver Test",
      phone: "+59899977777",
      roles: [UserRole.USER, UserRole.DRIVER],
      kycStatus: KYCStatus.VERIFIED,
    },
  });

  console.log("Created driver user:", driverUser.email);

  // Create sample vehicles
  const vehicles = [
    {
      hostId: hostUser.id,
      make: "Toyota",
      model: "Corolla",
      year: 2022,
      color: "Blanco",
      plateNumber: "ABC1234",
      locationLat: -34.9011,
      locationLng: -56.1645,
      city: "Montevideo",
      country: "Uruguay",
      basePriceDay: 250000, // $2,500
      status: VehicleStatus.ACTIVE,
      features: ["ac", "bluetooth", "gps"],
      seats: 5,
      transmission: "automatic",
      fuelType: "gasoline",
    },
    {
      hostId: hostUser.id,
      make: "Volkswagen",
      model: "Polo",
      year: 2021,
      color: "Gris",
      plateNumber: "XYZ5678",
      locationLat: -34.9655,
      locationLng: -54.9468,
      city: "Punta del Este",
      country: "Uruguay",
      basePriceDay: 180000, // $1,800
      status: VehicleStatus.ACTIVE,
      features: ["ac", "bluetooth"],
      seats: 5,
      transmission: "manual",
      fuelType: "gasoline",
    },
    {
      hostId: hostUser.id,
      make: "Chevrolet",
      model: "Cruze",
      year: 2023,
      color: "Negro",
      plateNumber: "DEF9012",
      locationLat: -34.9011,
      locationLng: -56.1645,
      city: "Montevideo",
      country: "Uruguay",
      basePriceDay: 300000, // $3,000
      status: VehicleStatus.ACTIVE,
      features: ["ac", "bluetooth", "gps", "backup_camera"],
      seats: 5,
      transmission: "automatic",
      fuelType: "gasoline",
    },
  ];

  for (const vehicle of vehicles) {
    const created = await prisma.vehicle.upsert({
      where: { plateNumber: vehicle.plateNumber },
      update: {},
      create: vehicle,
    });
    console.log("Created vehicle:", created.make, created.model);
  }

  // Create system config
  await prisma.systemConfig.upsert({
    where: { key: "platform_fee_percent" },
    update: {},
    create: {
      key: "platform_fee_percent",
      value: 15,
      description: "Platform fee percentage",
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: "deposit_percent" },
    update: {},
    create: {
      key: "deposit_percent",
      value: 10,
      description: "Security deposit percentage",
    },
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
