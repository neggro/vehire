import {
  differenceInDays,
  isWeekend,
  eachDayOfInterval,
  startOfDay,
} from "date-fns";

// Platform configuration
export const PLATFORM_CONFIG = {
  platformFeePercent: 15,
  minimumFee: 500, // $5 in cents
  maximumFee: 10000, // $100 in cents
  depositPercent: 10,
  weekendMarkupPercent: 20,
  cancellationFreeHours: 24,
};

export interface BookingCalculation {
  days: number;
  dailyRate: number;
  baseAmount: number;
  weekendDays: number;
  weekdayDays: number;
  deliveryFee: number;
  platformFee: number;
  hostPayout: number;
  depositAmount: number;
  totalAmount: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
}

export function calculateBookingAmount(params: {
  basePriceDay: number; // in cents
  weekendPriceDay?: number | null;
  startDate: Date;
  endDate: Date;
  deliveryAvailable?: boolean;
  deliveryPrice?: number | null;
  estimatedValue?: number | null;
}): BookingCalculation {
  const {
    basePriceDay,
    weekendPriceDay,
    startDate,
    endDate,
    deliveryAvailable = false,
    deliveryPrice,
    estimatedValue,
  } = params;

  // Calculate number of days
  const days = differenceInDays(endDate, startDate) + 1;

  // Calculate weekend vs weekday days
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekendDays = allDays.filter((day) => isWeekend(day)).length;
  const weekdayDays = days - weekendDays;

  // Calculate base amount with weekend pricing
  const weekdayRate = basePriceDay;
  const weekendRate = weekendPriceDay || Math.round(basePriceDay * (1 + PLATFORM_CONFIG.weekendMarkupPercent / 100));

  const weekdayAmount = weekdayDays * weekdayRate;
  const weekendAmount = weekendDays * weekendRate;
  const baseAmount = weekdayAmount + weekendAmount;

  // Average daily rate for display
  const dailyRate = Math.round(baseAmount / days);

  // Delivery fee
  const deliveryFeeAmount =
    deliveryAvailable && deliveryPrice ? deliveryPrice : 0;

  // Platform fee (with min/max)
  let platformFee = Math.round(baseAmount * (PLATFORM_CONFIG.platformFeePercent / 100));
  platformFee = Math.max(
    PLATFORM_CONFIG.minimumFee,
    Math.min(platformFee, PLATFORM_CONFIG.maximumFee)
  );

  // Host payout
  const hostPayout = baseAmount - platformFee;

  // Deposit (10% of vehicle value or fixed amount)
  const depositAmount = estimatedValue
    ? Math.round(estimatedValue * (PLATFORM_CONFIG.depositPercent / 100))
    : Math.round(baseAmount * 0.5); // Fallback to 50% of rental

  // Total amount for driver
  const totalAmount = baseAmount + deliveryFeeAmount + depositAmount;

  // Breakdown for display
  const breakdown = [
    {
      label: `${weekdayDays} día${weekdayDays !== 1 ? "s" : ""} de semana`,
      amount: weekdayAmount,
    },
    {
      label: `${weekendDays} día${weekendDays !== 1 ? "s" : ""} de fin de semana`,
      amount: weekendAmount,
    },
  ];

  if (deliveryFeeAmount > 0) {
    breakdown.push({
      label: "Entrega a domicilio",
      amount: deliveryFeeAmount,
    });
  }

  breakdown.push({
    label: "Depósito de garantía (reembolsable)",
    amount: depositAmount,
  });

  return {
    days,
    dailyRate,
    baseAmount,
    weekendDays,
    weekdayDays,
    deliveryFee: deliveryFeeAmount,
    platformFee,
    hostPayout,
    depositAmount,
    totalAmount,
    breakdown,
  };
}

export function formatPriceFromCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-UY")}`;
}

export function canCancelForFree(createdAt: Date): boolean {
  const hoursSinceCreation =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceCreation < PLATFORM_CONFIG.cancellationFreeHours;
}

export function calculateRefund(params: {
  totalAmount: number;
  daysBeforePickup: number;
  isFreeCancellation: boolean;
}): number {
  const { totalAmount, daysBeforePickup, isFreeCancellation } = params;

  if (isFreeCancellation) {
    return totalAmount;
  }

  if (daysBeforePickup >= 7) {
    return Math.round(totalAmount * 0.9); // 90% refund
  } else if (daysBeforePickup >= 3) {
    return Math.round(totalAmount * 0.7); // 70% refund
  } else if (daysBeforePickup >= 1) {
    return Math.round(totalAmount * 0.5); // 50% refund
  }

  return 0; // No refund for same-day cancellation
}
