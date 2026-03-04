import MercadoPagoConfig, { Preference, Payment } from "mercadopago";
import { createHmac } from "crypto";

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
  options: {
    timeout: 5000,
    idempotencyKey: "abc123",
  },
});

const preference = new Preference(client);
const payment = new Payment(client);

export interface CreatePreferenceParams {
  bookingId: string;
  title: string;
  description: string;
  amount: number; // in cents
  payerEmail: string;
  externalReference: string;
  notificationUrl: string;
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
}

export interface PreferenceResponse {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export async function createPaymentPreference(
  params: CreatePreferenceParams
): Promise<PreferenceResponse> {
  const response = await preference.create({
    body: {
      items: [
        {
          id: params.bookingId,
          title: params.title,
          description: params.description,
          quantity: 1,
          unit_price: params.amount / 100, // Convert cents to dollars
          currency_id: "UYU",
        },
      ],
      payer: {
        email: params.payerEmail,
      },
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
      back_urls: {
        success: params.backUrls.success,
        failure: params.backUrls.failure,
        pending: params.backUrls.pending,
      },
      auto_return: "approved",
      statement_descriptor: "VEHIRE",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(
        Date.now() + 30 * 60 * 1000 // 30 minutes
      ).toISOString(),
    },
  });

  return {
    id: response.id!,
    initPoint: response.init_point!,
    sandboxInitPoint: response.sandbox_init_point!,
  };
}

export async function getPayment(paymentId: string) {
  return await payment.get({
    id: paymentId,
  });
}

export function verifyWebhookSignature(
  signature: string | null,
  payload: string
): boolean {
  // In development, skip verification
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // If no signature provided, reject in production
  if (!signature) {
    console.warn("Webhook received without signature");
    return false;
  }

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // If no secret configured, log warning but allow (for initial setup)
  if (!secret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET not configured - skipping signature verification");
    return true;
  }

  try {
    // Mercado Pago uses HMAC-SHA256 for webhook signatures
    // The signature format is: v1=hash
    const [version, hash] = signature.split("=");

    if (version !== "v1" || !hash) {
      console.warn("Invalid webhook signature format");
      return false;
    }

    // Calculate expected hash
    const expectedHash = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const hashBuffer = Buffer.from(hash, "hex");
    const expectedBuffer = Buffer.from(expectedHash, "hex");

    if (hashBuffer.length !== expectedBuffer.length) {
      return false;
    }

    // Timing-safe comparison
    return hashBuffer.equals(expectedBuffer);
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

// ============================================
// Checkout API (Payments API) Functions
// ============================================

export interface CreateCardPaymentParams {
  transactionAmount: number; // in cents, will be converted to currency units
  token: string; // card token from frontend SDK
  description: string;
  installments: number;
  paymentMethodId: string; // e.g., "visa", "master", "amex"
  issuerId?: number; // bank issuer ID for installments (numeric)
  payer: {
    email: string;
    firstName?: string;
    lastName?: string;
    identification?: {
      type: string; // "CI" for Uruguay
      number: string;
    };
  };
  externalReference: string; // booking ID
  notificationUrl: string;
}

export interface CardPaymentResponse {
  id: number;
  status: "approved" | "pending" | "rejected" | "cancelled" | "in_process";
  statusDetail: string;
  paymentMethodId: string;
  paymentTypeId: string;
  transactionAmount: number;
  installments: number;
  externalReference: string;
  dateCreated: string;
  dateApproved?: string;
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  paymentTypeId: string;
  status: string;
  secureThumbnail: string;
  thumbnail: string;
  deferredCapture: string;
  settings: {
    bin: {
      pattern: string;
      exclusionPattern?: string;
      installmentsPattern: string;
    };
    cardNumber: {
      length: number[];
      validation: string;
    };
    securityCode: {
      length: number;
      cardLocation: string;
      mode: string;
    };
  }[];
  additionalInfoNeeded: string[];
  minAllowedAmount: number;
  maxAllowedAmount: number;
  accreditationTime: number;
  financialInstitutions?: {
    id: string;
    name: string;
  }[];
}

export interface InstallmentOption {
  paymentMethodId: string;
  paymentTypeId: string;
  issuer: {
    id: string;
    name: string;
  };
  processingMode: string;
  merchantAccountId?: string;
  payerCosts: {
    installments: number;
    installmentRate: number;
    discountRate: number;
    reimbursementRate?: number;
    labels: string[];
    installmentRateCollector: string[];
    minAllowedAmount: number;
    maxAllowedAmount: number;
    recommendedMessage: string;
    installmentAmount: number;
    totalAmount: number;
    paymentMethodOptionId?: string;
  }[];
  agreements?: unknown;
}

/**
 * Create a payment with card token (Checkout API)
 */
export async function createCardPayment(
  params: CreateCardPaymentParams
): Promise<CardPaymentResponse> {
  const response = await payment.create({
    body: {
      transaction_amount: params.transactionAmount / 100, // Convert cents to currency units
      token: params.token,
      description: params.description,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      issuer_id: params.issuerId,
      payer: {
        email: params.payer.email,
        first_name: params.payer.firstName,
        last_name: params.payer.lastName,
        identification: params.payer.identification,
      },
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
      statement_descriptor: "VEHIRE",
    },
  });

  return {
    id: response.id!,
    status: response.status as CardPaymentResponse["status"],
    statusDetail: response.status_detail || "",
    paymentMethodId: response.payment_method_id || "",
    paymentTypeId: response.payment_type_id || "",
    transactionAmount: response.transaction_amount || 0,
    installments: response.installments || 1,
    externalReference: response.external_reference || "",
    dateCreated: response.date_created || "",
    dateApproved: response.date_approved || undefined,
  };
}

/**
 * Get available payment methods for a country
 */
export async function getPaymentMethods(): Promise<PaymentMethodOption[]> {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payment_methods?access_token=${process.env.MERCADOPAGO_ACCESS_TOKEN}`
  );
  const data = await response.json();

  return data.map((method: any) => ({
    id: method.id,
    name: method.name,
    paymentTypeId: method.payment_type_id,
    status: method.status,
    secureThumbnail: method.secure_thumbnail,
    thumbnail: method.thumbnail,
    deferredCapture: method.deferred_capture,
    settings: method.settings,
    additionalInfoNeeded: method.additional_info_needed,
    minAllowedAmount: method.min_allowed_amount,
    maxAllowedAmount: method.max_allowed_amount,
    accreditationTime: method.accreditation_time,
    financialInstitutions: method.financial_institutions,
  }));
}

/**
 * Get installment options for a payment method and amount
 */
export async function getInstallments(
  paymentMethodId: string,
  amount: number // in cents
): Promise<InstallmentOption[]> {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payment_methods/installments?access_token=${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // For installments, we need to use the REST API directly
  const installmentsUrl = new URL("https://api.mercadopago.com/v1/payment_methods/installments");
  installmentsUrl.searchParams.append("access_token", process.env.MERCADOPAGO_ACCESS_TOKEN || "");
  installmentsUrl.searchParams.append("payment_method_id", paymentMethodId);
  installmentsUrl.searchParams.append("amount", (amount / 100).toString()); // Convert to currency units

  const installmentsResponse = await fetch(installmentsUrl.toString());
  const data = await installmentsResponse.json();

  return data.map((item: any) => ({
    paymentMethodId: item.payment_method_id,
    paymentTypeId: item.payment_type_id,
    issuer: item.issuer,
    processingMode: item.processing_mode,
    merchantAccountId: item.merchant_account_id,
    payerCosts: item.payer_costs,
    agreements: item.agreements,
  }));
}

/**
 * Identify card type (visa, master, amex) from BIN (first 6-8 digits)
 */
export async function identifyCardType(bin: string): Promise<{
  paymentMethodId: string;
  thumbnail: string;
} | null> {
  if (bin.length < 6) return null;

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payment_methods/search?access_token=${process.env.MERCADOPAGO_ACCESS_TOKEN}&bins=${bin}`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        paymentMethodId: data[0].id,
        thumbnail: data[0].secure_thumbnail,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export { client, preference, payment };
