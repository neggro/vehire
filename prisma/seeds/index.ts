import {
  PrismaClient,
  UserRole,
  KYCStatus,
  VehicleStatus,
  BookingStatus,
  PaymentStatus,
  PaymentProvider,
} from "@prisma/client";

const prisma = new PrismaClient();

// ─── Coordenadas reales de ciudades uruguayas ────────────────────
const CITIES = {
  Montevideo: { lat: -34.9011, lng: -56.1645 },
  "Punta del Este": { lat: -34.9667, lng: -54.9500 },
  Colonia: { lat: -34.4626, lng: -57.8400 },
  Salto: { lat: -31.3833, lng: -57.9667 },
  Paysandú: { lat: -32.3214, lng: -58.0756 },
  Maldonado: { lat: -34.9000, lng: -54.9500 },
  "Ciudad de la Costa": { lat: -34.8167, lng: -55.9500 },
  Canelones: { lat: -34.5228, lng: -56.2783 },
  "Piriápolis": { lat: -34.8667, lng: -55.2833 },
  "José Ignacio": { lat: -34.7833, lng: -54.6333 },
} as const;

// Variación leve para que los markers no se superpongan
function jitter(base: number, range = 0.015): number {
  return base + (Math.random() - 0.5) * range * 2;
}

// Imágenes de autos reales de Unsplash (libres de uso)
const CAR_IMAGES: Record<string, string[]> = {
  "Toyota Corolla": [
    "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800&q=80",
    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80",
  ],
  "Toyota Hilux": [
    "https://images.unsplash.com/photo-1625231334168-32fb1a2004db?w=800&q=80",
    "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&q=80",
  ],
  "Toyota Etios": [
    "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80",
  ],
  "Toyota RAV4": [
    "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=800&q=80",
    "https://images.unsplash.com/photo-1568844293986-8d0400f4e909?w=800&q=80",
  ],
  "Volkswagen Polo": [
    "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&q=80",
  ],
  "Volkswagen T-Cross": [
    "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&q=80",
  ],
  "Volkswagen Amarok": [
    "https://images.unsplash.com/photo-1612825173281-9a193378527e?w=800&q=80",
  ],
  "Chevrolet Cruze": [
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  ],
  "Chevrolet Onix": [
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
  ],
  "Chevrolet Tracker": [
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
  ],
  "Renault Kwid": [
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
  ],
  "Renault Duster": [
    "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80",
  ],
  "Fiat Cronos": [
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
  ],
  "Fiat Mobi": [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80",
  ],
  "Nissan Kicks": [
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80",
  ],
  "Nissan Versa": [
    "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80",
  ],
  "Ford EcoSport": [
    "https://images.unsplash.com/photo-1551830820-330a71b99659?w=800&q=80",
  ],
  "Jeep Renegade": [
    "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=800&q=80",
    "https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9?w=800&q=80",
  ],
  "Peugeot 208": [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
  ],
  "BMW 320i": [
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=800&q=80",
  ],
  "Mercedes-Benz Clase A": [
    "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
  ],
};

// ─── DATOS DE SEED ───────────────────────────────────────────────

const USERS_DATA = [
  {
    email: "admin@vehire.uy",
    fullName: "Administrador Vehire",
    phone: "+59899000001",
    roles: [UserRole.ADMIN, UserRole.HOST, UserRole.DRIVER],
    kycStatus: KYCStatus.VERIFIED,
  },
  {
    email: "martin.silva@gmail.com",
    fullName: "Martín Silva",
    phone: "+59899100201",
    roles: [UserRole.HOST, UserRole.DRIVER],
    kycStatus: KYCStatus.VERIFIED,
  },
  {
    email: "lucia.fernandez@gmail.com",
    fullName: "Lucía Fernández",
    phone: "+59899200302",
    roles: [UserRole.HOST],
    kycStatus: KYCStatus.VERIFIED,
  },
  {
    email: "santiago.rodriguez@gmail.com",
    fullName: "Santiago Rodríguez",
    phone: "+59899300403",
    roles: [UserRole.HOST, UserRole.DRIVER],
    kycStatus: KYCStatus.VERIFIED,
  },
  {
    email: "valentina.gomez@gmail.com",
    fullName: "Valentina Gómez",
    phone: "+59899400504",
    roles: [UserRole.HOST],
    kycStatus: KYCStatus.VERIFIED,
  },
  {
    email: "nicolas.martinez@gmail.com",
    fullName: "Nicolás Martínez",
    phone: "+59899500605",
    roles: [UserRole.HOST, UserRole.DRIVER],
    kycStatus: KYCStatus.VERIFIED,
  },
  {
    email: "camila.lopez@gmail.com",
    fullName: "Camila López",
    phone: "+59899600706",
    roles: [UserRole.DRIVER],
    kycStatus: KYCStatus.VERIFIED,
  },
  {
    email: "mateo.perez@gmail.com",
    fullName: "Mateo Pérez",
    phone: "+59899700807",
    roles: [UserRole.DRIVER],
    kycStatus: KYCStatus.VERIFIED,
  },
  {
    email: "florencia.diaz@gmail.com",
    fullName: "Florencia Díaz",
    phone: "+59899800908",
    roles: [UserRole.DRIVER],
    kycStatus: KYCStatus.PENDING,
  },
  {
    email: "joaquin.acosta@gmail.com",
    fullName: "Joaquín Acosta",
    phone: "+59899901009",
    roles: [UserRole.HOST, UserRole.DRIVER],
    kycStatus: KYCStatus.VERIFIED,
  },
];

interface VehicleSeed {
  hostIndex: number; // index into created users array
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  city: keyof typeof CITIES;
  state: string;
  description: string;
  basePriceDay: number;
  weekendPriceDay: number | null;
  features: string[];
  seats: number;
  transmission: "automatic" | "manual";
  fuelType: "gasoline" | "diesel" | "electric" | "hybrid";
  mileage: number;
  instantBooking: boolean;
  deliveryAvailable: boolean;
  deliveryPrice: number | null;
}

const VEHICLES_DATA: VehicleSeed[] = [
  // ── Martín Silva (index 1) ──
  {
    hostIndex: 1,
    make: "Toyota",
    model: "Corolla",
    year: 2023,
    color: "Blanco",
    plateNumber: "SVH 1001",
    city: "Montevideo",
    state: "Montevideo",
    description:
      "Toyota Corolla 2023 impecable, full equipo. Ideal para viajes largos o uso diario. Muy cómodo y económico.",
    basePriceDay: 280000,
    weekendPriceDay: 320000,
    features: ["ac", "bluetooth", "gps", "backup_camera", "usb", "cruise_control"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 15000,
    instantBooking: true,
    deliveryAvailable: true,
    deliveryPrice: 50000,
  },
  {
    hostIndex: 1,
    make: "Toyota",
    model: "Hilux",
    year: 2022,
    color: "Negro",
    plateNumber: "SVH 1002",
    city: "Montevideo",
    state: "Montevideo",
    description:
      "Toyota Hilux SRV 4x4. Perfecta para aventuras, campo o viajes al interior. Cabina doble, muy equipada.",
    basePriceDay: 450000,
    weekendPriceDay: 500000,
    features: ["ac", "bluetooth", "gps", "4wd", "backup_camera", "cruise_control"],
    seats: 5,
    transmission: "automatic",
    fuelType: "diesel",
    mileage: 35000,
    instantBooking: false,
    deliveryAvailable: true,
    deliveryPrice: 80000,
  },

  // ── Lucía Fernández (index 2) ──
  {
    hostIndex: 2,
    make: "Volkswagen",
    model: "T-Cross",
    year: 2024,
    color: "Rojo",
    plateNumber: "SVH 2001",
    city: "Punta del Este",
    state: "Maldonado",
    description:
      "VW T-Cross Highline 2024, 0 km prácticamente. Perfecta para recorrer la costa. Cámara 360° y pantalla táctil.",
    basePriceDay: 350000,
    weekendPriceDay: 420000,
    features: ["ac", "bluetooth", "gps", "backup_camera", "usb", "sunroof", "android_auto", "apple_carplay"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 3000,
    instantBooking: true,
    deliveryAvailable: true,
    deliveryPrice: 60000,
  },
  {
    hostIndex: 2,
    make: "Fiat",
    model: "Mobi",
    year: 2022,
    color: "Celeste",
    plateNumber: "SVH 2002",
    city: "Punta del Este",
    state: "Maldonado",
    description:
      "Fiat Mobi económico y ágil. Ideal para moverte por la ciudad, fácil de estacionar. Bajo consumo de combustible.",
    basePriceDay: 130000,
    weekendPriceDay: 160000,
    features: ["ac", "bluetooth", "usb"],
    seats: 5,
    transmission: "manual",
    fuelType: "gasoline",
    mileage: 28000,
    instantBooking: true,
    deliveryAvailable: false,
    deliveryPrice: null,
  },

  // ── Santiago Rodríguez (index 3) ──
  {
    hostIndex: 3,
    make: "Chevrolet",
    model: "Cruze",
    year: 2023,
    color: "Gris Oscuro",
    plateNumber: "SVH 3001",
    city: "Montevideo",
    state: "Montevideo",
    description:
      "Chevrolet Cruze Premier. Sedan ejecutivo con todas las comodidades. Asientos de cuero, excelente para negocios.",
    basePriceDay: 320000,
    weekendPriceDay: 350000,
    features: ["ac", "bluetooth", "gps", "backup_camera", "leather_seats", "cruise_control", "apple_carplay"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 12000,
    instantBooking: true,
    deliveryAvailable: true,
    deliveryPrice: 45000,
  },
  {
    hostIndex: 3,
    make: "Renault",
    model: "Kwid",
    year: 2023,
    color: "Blanco",
    plateNumber: "SVH 3002",
    city: "Ciudad de la Costa",
    state: "Canelones",
    description:
      "Renault Kwid Outsider. Compacto con look aventurero. Económico, práctico y divertido de manejar.",
    basePriceDay: 120000,
    weekendPriceDay: 150000,
    features: ["ac", "bluetooth", "usb"],
    seats: 5,
    transmission: "manual",
    fuelType: "gasoline",
    mileage: 18000,
    instantBooking: true,
    deliveryAvailable: false,
    deliveryPrice: null,
  },
  {
    hostIndex: 3,
    make: "Jeep",
    model: "Renegade",
    year: 2022,
    color: "Verde Militar",
    plateNumber: "SVH 3003",
    city: "Colonia",
    state: "Colonia",
    description:
      "Jeep Renegade Sport 4x4. Para los que buscan aventura y estilo. Ideal para rutas y caminos rurales.",
    basePriceDay: 380000,
    weekendPriceDay: 430000,
    features: ["ac", "bluetooth", "gps", "4wd", "backup_camera", "android_auto"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 40000,
    instantBooking: false,
    deliveryAvailable: true,
    deliveryPrice: 70000,
  },

  // ── Valentina Gómez (index 4) ──
  {
    hostIndex: 4,
    make: "BMW",
    model: "320i",
    year: 2022,
    color: "Negro",
    plateNumber: "SVH 4001",
    city: "Punta del Este",
    state: "Maldonado",
    description:
      "BMW 320i M Sport. Lujo y deportividad. Experiencia premium para ocasiones especiales o simplemente disfrutar.",
    basePriceDay: 650000,
    weekendPriceDay: 750000,
    features: ["ac", "bluetooth", "gps", "backup_camera", "leather_seats", "sunroof", "cruise_control", "apple_carplay", "android_auto"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 22000,
    instantBooking: false,
    deliveryAvailable: true,
    deliveryPrice: 100000,
  },
  {
    hostIndex: 4,
    make: "Mercedes-Benz",
    model: "Clase A",
    year: 2023,
    color: "Blanco",
    plateNumber: "SVH 4002",
    city: "Punta del Este",
    state: "Maldonado",
    description:
      "Mercedes-Benz Clase A 200. Elegancia y tecnología de punta. MBUX, pantalla dual y ambientación interior.",
    basePriceDay: 600000,
    weekendPriceDay: 700000,
    features: ["ac", "bluetooth", "gps", "backup_camera", "leather_seats", "cruise_control", "apple_carplay", "android_auto"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 8000,
    instantBooking: false,
    deliveryAvailable: true,
    deliveryPrice: 120000,
  },
  {
    hostIndex: 4,
    make: "Nissan",
    model: "Kicks",
    year: 2024,
    color: "Naranja",
    plateNumber: "SVH 4003",
    city: "Maldonado",
    state: "Maldonado",
    description:
      "Nissan Kicks Exclusive. SUV compacta con tecnología e-POWER. Excelente rendimiento y confort.",
    basePriceDay: 300000,
    weekendPriceDay: 360000,
    features: ["ac", "bluetooth", "gps", "backup_camera", "usb", "cruise_control", "android_auto"],
    seats: 5,
    transmission: "automatic",
    fuelType: "hybrid",
    mileage: 5000,
    instantBooking: true,
    deliveryAvailable: false,
    deliveryPrice: null,
  },

  // ── Nicolás Martínez (index 5) ──
  {
    hostIndex: 5,
    make: "Toyota",
    model: "RAV4",
    year: 2023,
    color: "Plata",
    plateNumber: "SVH 5001",
    city: "Montevideo",
    state: "Montevideo",
    description:
      "Toyota RAV4 Hybrid. SUV familiar con excelente consumo. Amplio baúl, cómoda para toda la familia.",
    basePriceDay: 420000,
    weekendPriceDay: 480000,
    features: ["ac", "bluetooth", "gps", "backup_camera", "cruise_control", "apple_carplay", "android_auto"],
    seats: 5,
    transmission: "automatic",
    fuelType: "hybrid",
    mileage: 18000,
    instantBooking: true,
    deliveryAvailable: true,
    deliveryPrice: 60000,
  },
  {
    hostIndex: 5,
    make: "Chevrolet",
    model: "Onix",
    year: 2024,
    color: "Rojo",
    plateNumber: "SVH 5002",
    city: "Montevideo",
    state: "Montevideo",
    description:
      "Chevrolet Onix Premier 2024. Sedan compacto turbo, muy equipado. WiFi integrado y OnStar.",
    basePriceDay: 200000,
    weekendPriceDay: 240000,
    features: ["ac", "bluetooth", "gps", "usb", "android_auto", "apple_carplay"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 2000,
    instantBooking: true,
    deliveryAvailable: false,
    deliveryPrice: null,
  },
  {
    hostIndex: 5,
    make: "Volkswagen",
    model: "Amarok",
    year: 2021,
    color: "Gris",
    plateNumber: "SVH 5003",
    city: "Salto",
    state: "Salto",
    description:
      "VW Amarok V6 Highline. Pickup premium con motor V6. Ideal para el litoral y el campo.",
    basePriceDay: 500000,
    weekendPriceDay: 550000,
    features: ["ac", "bluetooth", "gps", "4wd", "backup_camera", "leather_seats", "cruise_control"],
    seats: 5,
    transmission: "automatic",
    fuelType: "diesel",
    mileage: 55000,
    instantBooking: false,
    deliveryAvailable: false,
    deliveryPrice: null,
  },

  // ── Joaquín Acosta (index 9) ──
  {
    hostIndex: 9,
    make: "Renault",
    model: "Duster",
    year: 2023,
    color: "Marrón",
    plateNumber: "SVH 9001",
    city: "Paysandú",
    state: "Paysandú",
    description:
      "Renault Duster 4x4. SUV versátil para ciudad y campo. Amplia, cómoda y con buen despeje del suelo.",
    basePriceDay: 250000,
    weekendPriceDay: 290000,
    features: ["ac", "bluetooth", "gps", "4wd", "usb"],
    seats: 5,
    transmission: "manual",
    fuelType: "gasoline",
    mileage: 30000,
    instantBooking: true,
    deliveryAvailable: false,
    deliveryPrice: null,
  },
  {
    hostIndex: 9,
    make: "Ford",
    model: "EcoSport",
    year: 2022,
    color: "Azul",
    plateNumber: "SVH 9002",
    city: "Canelones",
    state: "Canelones",
    description:
      "Ford EcoSport SE. SUV compacta, práctica y funcional. Buen espacio interior y consumo moderado.",
    basePriceDay: 220000,
    weekendPriceDay: 260000,
    features: ["ac", "bluetooth", "usb", "backup_camera"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 42000,
    instantBooking: true,
    deliveryAvailable: true,
    deliveryPrice: 55000,
  },
  {
    hostIndex: 9,
    make: "Toyota",
    model: "Etios",
    year: 2021,
    color: "Gris Plata",
    plateNumber: "SVH 9003",
    city: "Montevideo",
    state: "Montevideo",
    description:
      "Toyota Etios XLS. Económico y confiable. Bajo consumo, ideal para uso urbano y viajes cortos.",
    basePriceDay: 150000,
    weekendPriceDay: 180000,
    features: ["ac", "bluetooth", "usb"],
    seats: 5,
    transmission: "manual",
    fuelType: "gasoline",
    mileage: 52000,
    instantBooking: true,
    deliveryAvailable: false,
    deliveryPrice: null,
  },
  {
    hostIndex: 9,
    make: "Peugeot",
    model: "208",
    year: 2024,
    color: "Blanco Nacarado",
    plateNumber: "SVH 9004",
    city: "Piriápolis",
    state: "Maldonado",
    description:
      "Peugeot 208 Allure. Diseño vanguardista con i-Cockpit 3D. Compacto pero con mucha personalidad.",
    basePriceDay: 260000,
    weekendPriceDay: 310000,
    features: ["ac", "bluetooth", "gps", "backup_camera", "apple_carplay", "android_auto"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 1500,
    instantBooking: true,
    deliveryAvailable: false,
    deliveryPrice: null,
  },
  {
    hostIndex: 1,
    make: "Nissan",
    model: "Versa",
    year: 2023,
    color: "Gris",
    plateNumber: "SVH 1003",
    city: "Ciudad de la Costa",
    state: "Canelones",
    description:
      "Nissan Versa Advance. Sedán espacioso con excelente relación calidad-precio. Ideal para familias.",
    basePriceDay: 190000,
    weekendPriceDay: 220000,
    features: ["ac", "bluetooth", "backup_camera", "usb", "cruise_control"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 25000,
    instantBooking: true,
    deliveryAvailable: true,
    deliveryPrice: 40000,
  },
  {
    hostIndex: 2,
    make: "Chevrolet",
    model: "Tracker",
    year: 2024,
    color: "Blanco",
    plateNumber: "SVH 2003",
    city: "José Ignacio",
    state: "Maldonado",
    description:
      "Chevrolet Tracker Premier. SUV turbo con techo panorámico. La mejor opción para recorrer la costa este.",
    basePriceDay: 340000,
    weekendPriceDay: 400000,
    features: ["ac", "bluetooth", "gps", "backup_camera", "sunroof", "apple_carplay", "android_auto", "cruise_control"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 6000,
    instantBooking: false,
    deliveryAvailable: true,
    deliveryPrice: 90000,
  },
  {
    hostIndex: 3,
    make: "Volkswagen",
    model: "Polo",
    year: 2023,
    color: "Azul",
    plateNumber: "SVH 3004",
    city: "Montevideo",
    state: "Montevideo",
    description:
      "VW Polo Highline. Hatchback deportivo y refinado. Turbo, rápido y eficiente. Ideal para la ciudad.",
    basePriceDay: 210000,
    weekendPriceDay: 250000,
    features: ["ac", "bluetooth", "gps", "usb", "cruise_control", "apple_carplay"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 14000,
    instantBooking: true,
    deliveryAvailable: false,
    deliveryPrice: null,
  },
  {
    hostIndex: 5,
    make: "Fiat",
    model: "Cronos",
    year: 2023,
    color: "Gris",
    plateNumber: "SVH 5004",
    city: "Montevideo",
    state: "Montevideo",
    description:
      "Fiat Cronos Precision. Sedan con gran baúl, pantalla Uconnect y excelente confort de marcha.",
    basePriceDay: 170000,
    weekendPriceDay: 200000,
    features: ["ac", "bluetooth", "usb", "backup_camera", "android_auto"],
    seats: 5,
    transmission: "automatic",
    fuelType: "gasoline",
    mileage: 20000,
    instantBooking: true,
    deliveryAvailable: false,
    deliveryPrice: null,
  },
];

// Review comments pool
const REVIEW_COMMENTS = [
  "Excelente experiencia! El auto estaba impecable y el anfitrión muy amable. Lo recomiendo 100%.",
  "Muy buen vehículo, justo como en las fotos. Entrega y devolución sin problemas.",
  "El auto andaba perfecto, muy limpio y con tanque lleno. Volvería a alquilar sin duda.",
  "Buena experiencia en general. El auto cumplió con lo esperado. Comunicación fluida.",
  "Increíble! El auto estaba como nuevo. El anfitrión super atento y flexible con los horarios.",
  "Auto en excelentes condiciones. Hicimos un viaje largo y fue muy cómodo. Gracias!",
  "Muy recomendable. El anfitrión nos recibió con mucha buena onda y el auto era justo lo que necesitábamos.",
  "Primera vez usando Vehire y la experiencia fue genial. Auto limpio, bien mantenido y muy fácil el proceso.",
  "El vehículo estaba en perfectas condiciones. Muy económico el consumo. Repetiría sin pensarlo.",
  "Perfecto para nuestras vacaciones en Punta del Este. Auto cómodo y espacioso. El anfitrión un crack.",
  "Auto muy lindo y bien cuidado. La entrega fue puntual y el anfitrión muy profesional.",
  "Genial experiencia! Todo muy fácil y rápido. El auto funcionó perfecto durante todo el viaje.",
];

async function main() {
  console.log("🚗 Seeding Vehire database...\n");

  // ─── 1. Users ────────────────────────────────────────────────
  console.log("👤 Creating users...");
  const users = [];
  for (const userData of USERS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    users.push(user);
    console.log(`   ✓ ${user.fullName} (${user.email})`);
  }

  // ─── 2. Vehicles + Images ────────────────────────────────────
  console.log("\n🚙 Creating vehicles...");
  const createdVehicles = [];
  for (const v of VEHICLES_DATA) {
    const host = users[v.hostIndex];
    const cityCoords = CITIES[v.city];
    const carKey = `${v.make} ${v.model}`;
    const images = CAR_IMAGES[carKey] || [];

    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: {},
      create: {
        hostId: host.id,
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        plateNumber: v.plateNumber,
        locationLat: jitter(cityCoords.lat),
        locationLng: jitter(cityCoords.lng),
        locationPublicLat: jitter(cityCoords.lat, 0.008),
        locationPublicLng: jitter(cityCoords.lng, 0.008),
        city: v.city,
        state: v.state,
        country: "Uruguay",
        description: v.description,
        basePriceDay: v.basePriceDay,
        weekendPriceDay: v.weekendPriceDay,
        features: v.features,
        seats: v.seats,
        transmission: v.transmission,
        fuelType: v.fuelType,
        mileage: v.mileage,
        instantBooking: v.instantBooking,
        deliveryAvailable: v.deliveryAvailable,
        deliveryPrice: v.deliveryPrice,
        status: VehicleStatus.ACTIVE,
      },
    });
    createdVehicles.push(vehicle);

    // Create images
    for (let i = 0; i < images.length; i++) {
      await prisma.vehicleImage.upsert({
        where: {
          id: `img-${v.plateNumber.replace(/\s/g, "")}-${i}`,
        },
        update: {},
        create: {
          id: `img-${v.plateNumber.replace(/\s/g, "")}-${i}`,
          vehicleId: vehicle.id,
          url: images[i],
          order: i,
          isPrimary: i === 0,
        },
      });
    }

    console.log(
      `   ✓ ${v.make} ${v.model} ${v.year} — ${v.city} — $${(v.basePriceDay / 100).toLocaleString()}/día`
    );
  }

  // ─── 3. Bookings (completed, for review data) ────────────────
  console.log("\n📋 Creating sample bookings & reviews...");

  // Driver users that can have bookings
  const driverUsers = users.filter((u) =>
    (USERS_DATA.find((d) => d.email === u.email)?.roles || []).includes(UserRole.DRIVER)
  );

  let bookingCount = 0;
  let reviewCount = 0;

  for (const vehicle of createdVehicles) {
    // 1-3 completed bookings per vehicle
    const numBookings = 1 + Math.floor(Math.random() * 3);

    for (let b = 0; b < numBookings; b++) {
      // Pick a random driver that is not the host
      const eligibleDrivers = driverUsers.filter((d) => d.id !== vehicle.hostId);
      if (eligibleDrivers.length === 0) continue;
      const driver = eligibleDrivers[Math.floor(Math.random() * eligibleDrivers.length)];

      const daysAgo = 10 + Math.floor(Math.random() * 80);
      const duration = 2 + Math.floor(Math.random() * 5);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      const baseAmount = vehicle.basePriceDay * duration;
      const platformFee = Math.round(baseAmount * 0.15);
      const depositAmount = Math.round(baseAmount * 0.1);
      const totalAmount = baseAmount + platformFee + depositAmount;

      const booking = await prisma.booking.create({
        data: {
          driverId: driver.id,
          hostId: vehicle.hostId,
          vehicleId: vehicle.id,
          startDate,
          endDate,
          pickupTime: "10:00",
          returnTime: "10:00",
          timezone: "America/Montevideo",
          baseAmount,
          platformFee,
          depositAmount,
          totalAmount,
          status: BookingStatus.COMPLETED,
        },
      });
      bookingCount++;

      // Create payment
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          platformFee,
          hostPayout: baseAmount - platformFee,
          depositAmount,
          provider: PaymentProvider.MERCADOPAGO,
          currency: "UYU",
          status: PaymentStatus.RELEASED,
          paidAt: startDate,
          releasedAt: endDate,
        },
      });

      // Create review (80% chance)
      if (Math.random() < 0.8) {
        const rating = 4 + Math.floor(Math.random() * 2); // 4 or 5
        const comment =
          REVIEW_COMMENTS[Math.floor(Math.random() * REVIEW_COMMENTS.length)];

        await prisma.review.create({
          data: {
            reviewerId: driver.id,
            revieweeId: vehicle.hostId,
            bookingId: booking.id,
            vehicleId: vehicle.id,
            rating,
            comment,
            isPublic: true,
          },
        });
        reviewCount++;
      }
    }
  }
  console.log(`   ✓ ${bookingCount} bookings created`);
  console.log(`   ✓ ${reviewCount} reviews created`);

  // ─── 4. Availabilities (next 60 days) ────────────────────────
  console.log("\n📅 Creating availability windows...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const vehicle of createdVehicles) {
    const availDays = [];
    for (let d = 0; d < 60; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      // ~85% of days are available
      if (Math.random() < 0.85) {
        availDays.push({
          vehicleId: vehicle.id,
          date,
          isAvailable: true,
        });
      }
    }

    await prisma.availability.createMany({
      data: availDays,
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ Availability set for ${createdVehicles.length} vehicles (next 60 days)`);

  // ─── 5. System Config ────────────────────────────────────────
  console.log("\n⚙️  Setting system config...");
  const configs = [
    { key: "platform_fee_percent", value: 15, description: "Platform fee percentage" },
    { key: "deposit_percent", value: 10, description: "Security deposit percentage" },
    { key: "max_booking_days", value: 30, description: "Maximum booking duration in days" },
    { key: "min_booking_hours", value: 24, description: "Minimum booking duration in hours" },
  ];
  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: cfg,
    });
    console.log(`   ✓ ${cfg.key} = ${cfg.value}`);
  }

  // ─── Summary ─────────────────────────────────────────────────
  console.log("\n" + "═".repeat(50));
  console.log("✅ Seed completed!");
  console.log(`   ${users.length} users`);
  console.log(`   ${createdVehicles.length} vehicles`);
  console.log(`   ${bookingCount} bookings`);
  console.log(`   ${reviewCount} reviews`);
  console.log(`   ${configs.length} config entries`);
  console.log("═".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
