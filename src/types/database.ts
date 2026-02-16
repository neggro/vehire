// Re-export database types
export * from "./index";

// App-specific types
export interface User {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  roles: string[];
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  hostId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  vin?: string | null;
  locationLat: number;
  locationLng: number;
  locationPublicLat?: number | null;
  locationPublicLng?: number | null;
  city: string;
  state?: string | null;
  country: string;
  address?: string | null;
  description?: string | null;
  basePriceDay: number;
  weekendPriceDay?: number | null;
  estimatedValue?: number | null;
  deliveryAvailable: boolean;
  deliveryPrice?: number | null;
  status: "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "PAUSED" | "REJECTED";
  features: string[];
  seats: number;
  transmission: "manual" | "automatic";
  fuelType: "gasoline" | "diesel" | "electric" | "hybrid";
  mileage?: number | null;
  mileageLimit?: number | null;
  images?: VehicleImage[];
  suggestedPrice?: number | null;
  pricingConfidence?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleImage {
  id: string;
  vehicleId: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

export interface Booking {
  id: string;
  driverId: string;
  hostId: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  baseAmount: number;
  deliveryFee?: number | null;
  platformFee: number;
  depositAmount: number;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  cancelledBy?: string | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
  pickupLocation?: string | null;
  returnLocation?: string | null;
  pickupOdometer?: number | null;
  returnOdometer?: number | null;
  pickupPhoto?: string | null;
  returnPhoto?: string | null;
  pickupNotes?: string | null;
  returnNotes?: string | null;
  pickupAt?: Date | null;
  returnAt?: Date | null;
  vehicle?: Vehicle;
  driver?: User;
  host?: User;
  payment?: Payment;
  review?: Review;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  platformFee: number;
  hostPayout: number;
  depositAmount: number;
  mpPreferenceId?: string | null;
  mpPaymentId?: string | null;
  mpStatus?: string | null;
  status: "PENDING" | "PROCESSING" | "HELD" | "RELEASED" | "REFUNDED" | "FAILED";
  escrowStatus?: string | null;
  paidAt?: Date | null;
  releasedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  bookingId: string;
  vehicleId?: string | null;
  rating: number;
  comment?: string | null;
  isPublic: boolean;
  createdAt: Date;
}

export interface SearchResult {
  vehicles: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  vin?: string;
  locationLat: number;
  locationLng: number;
  city: string;
  state?: string;
  address?: string;
  description?: string;
  basePriceDay: number;
  weekendPriceDay?: number;
  estimatedValue?: number;
  deliveryAvailable: boolean;
  deliveryPrice?: number;
  features: string[];
  seats: number;
  transmission: "manual" | "automatic";
  fuelType: "gasoline" | "diesel" | "electric" | "hybrid";
  mileage?: number;
  mileageLimit?: number;
}

export interface BookingFormData {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  pickupLocation?: string;
  returnLocation?: string;
}

// Search filters
export interface SearchFilters {
  location?: {
    lat: number;
    lng: number;
    radius?: number; // in km
  };
  startDate?: Date;
  endDate?: Date;
  priceRange?: {
    min: number;
    max: number;
  };
  features?: string[];
  transmission?: "manual" | "automatic";
  fuelType?: string[];
  seats?: number;
  make?: string;
  year?: {
    min: number;
    max: number;
  };
  sortBy?: "price" | "distance" | "rating" | "popularity";
  sortOrder?: "asc" | "desc";
}
