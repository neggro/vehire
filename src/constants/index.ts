// App configuration constants
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Vehire";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Currency
export const DEFAULT_CURRENCY = "UYU";
export const CURRENCY_SYMBOL = "$";

// Platform fees
export const PLATFORM_FEE_PERCENT = 15; // 15%
export const MIN_PLATFORM_FEE = 500; // $5 in cents
export const MAX_PLATFORM_FEE = 10000; // $100 in cents
export const DEPOSIT_PERCENT = 10; // 10% of vehicle value
export const WEEKEND_MARKUP_PERCENT = 20; // 20% markup on weekends

// Booking
export const MIN_BOOKING_DAYS = 1;
export const MAX_BOOKING_DAYS = 90;
export const CANCELLATION_FREE_HOURS = 24; // Free cancellation within 24h of booking

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

// Upload limits
export const MAX_VEHICLE_IMAGES = 10;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// KYC Document types
export const KYC_DOCUMENT_TYPES = {
  ID_DOCUMENT: "id_document",
  LICENSE: "license",
  SELFIE: "selfie",
} as const;

export const KYC_DOCUMENT_LABELS: Record<string, string> = {
  [KYC_DOCUMENT_TYPES.ID_DOCUMENT]: "Documento de identidad",
  [KYC_DOCUMENT_TYPES.LICENSE]: "Licencia de conducir",
  [KYC_DOCUMENT_TYPES.SELFIE]: "Selfie con documento",
};

// Vehicle features
export const VEHICLE_FEATURES = [
  { id: "ac", label: "Aire acondicionado", icon: "Wind" },
  { id: "bluetooth", label: "Bluetooth", icon: "Bluetooth" },
  { id: "gps", label: "GPS/Navigation", icon: "MapPin" },
  { id: "usb", label: "Puerto USB", icon: "Usb" },
  { id: "aux", label: "Entrada auxiliar", icon: "Headphones" },
  { id: "backup_camera", label: "Cámara de reversa", icon: "Video" },
  { id: "cruise_control", label: "Control de crucero", icon: "Gauge" },
  { id: "sunroof", label: "Techo solar", icon: "Sun" },
  { id: "leather_seats", label: "Asientos de cuero", icon: "Armchair" },
  { id: "heated_seats", label: "Asientos calefaccionados", icon: "Flame" },
  { id: "child_seat", label: "Silla para niños", icon: "Baby" },
  { id: "pet_friendly", label: "Acepta mascotas", icon: "Dog" },
  { id: "smoke_free", label: "Libre de humo", icon: "CigaretteOff" },
  { id: "bike_rack", label: "Portabicicletas", icon: "Bike" },
  { id: "ski_rack", label: "Portaesquíes", icon: "Snowflake" },
] as const;

// Transmission types
export const TRANSMISSION_TYPES = {
  MANUAL: "manual",
  AUTOMATIC: "automatic",
} as const;

export const TRANSMISSION_LABELS: Record<string, string> = {
  [TRANSMISSION_TYPES.MANUAL]: "Manual",
  [TRANSMISSION_TYPES.AUTOMATIC]: "Automático",
};

// Fuel types
export const FUEL_TYPES = {
  GASOLINE: "gasoline",
  DIESEL: "diesel",
  ELECTRIC: "electric",
  HYBRID: "hybrid",
} as const;

export const FUEL_TYPE_LABELS: Record<string, string> = {
  [FUEL_TYPES.GASOLINE]: "Nafta",
  [FUEL_TYPES.DIESEL]: "Diésel",
  [FUEL_TYPES.ELECTRIC]: "Eléctrico",
  [FUEL_TYPES.HYBRID]: "Híbrido",
};

// Vehicle status
export const VEHICLE_STATUS = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  REJECTED: "REJECTED",
} as const;

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  [VEHICLE_STATUS.DRAFT]: "Borrador",
  [VEHICLE_STATUS.PENDING_APPROVAL]: "Pendiente de aprobación",
  [VEHICLE_STATUS.ACTIVE]: "Activo",
  [VEHICLE_STATUS.PAUSED]: "Pausado",
  [VEHICLE_STATUS.REJECTED]: "Rechazado",
};

// Booking status
export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  [BOOKING_STATUS.PENDING]: "Pendiente de pago",
  [BOOKING_STATUS.CONFIRMED]: "Confirmada",
  [BOOKING_STATUS.ACTIVE]: "En curso",
  [BOOKING_STATUS.COMPLETED]: "Completada",
  [BOOKING_STATUS.CANCELLED]: "Cancelada",
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  HELD: "HELD",
  RELEASED: "RELEASED",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;

// User roles
export const USER_ROLES = {
  USER: "USER",
  HOST: "HOST",
  DRIVER: "DRIVER",
  ADMIN: "ADMIN",
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.USER]: "Usuario",
  [USER_ROLES.HOST]: "Anfitrión",
  [USER_ROLES.DRIVER]: "Conductor",
  [USER_ROLES.ADMIN]: "Administrador",
};

// Map defaults (Montevideo, Uruguay)
export const DEFAULT_LOCATION = {
  lat: -34.9011,
  lng: -56.1645,
  zoom: 12,
};

// Popular cities in Uruguay
export const POPULAR_CITIES = [
  { name: "Montevideo", lat: -34.9011, lng: -56.1645 },
  { name: "Punta del Este", lat: -34.9655, lng: -54.9468 },
  { name: "Colonia del Sacramento", lat: -34.4744, lng: -57.841 },
  { name: "Piriápolis", lat: -34.8649, lng: -55.2779 },
  { name: "Salto", lat: -31.3833, lng: -57.9667 },
];
