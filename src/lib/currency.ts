/**
 * Currency Conversion Utilities
 *
 * Handles conversion between UYU (Uruguayan Pesos) and USD (US Dollars)
 * for the dual-currency payment system (Mercado Pago in UYU, PayPal in USD)
 */

// Exchange rate: UYU to USD (can be updated via env var or API)
const DEFAULT_UYU_TO_USD_RATE = 0.025; // Approximately 40 UYU = 1 USD

/**
 * Convert amount from UYU cents to USD cents
 * @param amountInUyuCents - Amount in UYU cents (e.g., 10000 = $100.00 UYU)
 * @returns Amount in USD cents (e.g., 25 = $0.25 USD)
 */
export function convertUyuToUsd(amountInUyuCents: number): number {
  const rate = parseFloat(process.env.UYU_TO_USD_RATE || "") || DEFAULT_UYU_TO_USD_RATE;
  // Convert from UYU cents to UYU dollars, then to USD dollars, then to USD cents
  const usdCents = Math.round((amountInUyuCents / 100) * rate * 100);
  return usdCents;
}

/**
 * Convert amount from USD cents to UYU cents
 * @param amountInUsdCents - Amount in USD cents
 * @returns Amount in UYU cents
 */
export function convertUsdToUyu(amountInUsdCents: number): number {
  const rate = parseFloat(process.env.UYU_TO_USD_RATE || "") || DEFAULT_UYU_TO_USD_RATE;
  if (rate === 0) return 0;
  const uyuCents = Math.round((amountInUsdCents / 100) / rate * 100);
  return uyuCents;
}

/**
 * Format price from cents to display string
 * @param amountInCents - Amount in cents
 * @param currency - Currency code (UYU or USD)
 * @returns Formatted price string
 */
export function formatPriceFromCents(
  amountInCents: number,
  currency: "UYU" | "USD" = "UYU"
): string {
  const amount = amountInCents / 100;

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: "UYU",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get the current exchange rate
 * @returns The UYU to USD exchange rate
 */
export function getExchangeRate(): number {
  return parseFloat(process.env.UYU_TO_USD_RATE || "") || DEFAULT_UYU_TO_USD_RATE;
}

/**
 * Calculate the exchange rate display string
 * @returns Formatted exchange rate string
 */
export function getExchangeRateDisplay(): string {
  const rate = getExchangeRate();
  const inverseRate = 1 / rate;
  return `1 USD = ${inverseRate.toFixed(0)} UYU`;
}

/**
 * Currency configuration for the payment system
 */
export const CURRENCY_CONFIG = {
  UYU: {
    code: "UYU",
    symbol: "$U",
    name: "Pesos Uruguayos",
    provider: "MERCADOPAGO",
    locale: "es-UY",
  },
  USD: {
    code: "USD",
    symbol: "US$",
    name: "Dólares Estadounidenses",
    provider: "PAYPAL",
    locale: "en-US",
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;
