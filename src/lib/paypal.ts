/**
 * PayPal Integration Service
 *
 * Handles PayPal Orders API for payments with card fields support
 * Similar pattern to Mercado Pago integration
 */

import { createHmac } from "crypto";

// PayPal API base URLs
const PAYPAL_API_BASE = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

// Get the appropriate base URL based on mode
function getBaseUrl(): string {
  const mode = process.env.PAYPAL_MODE || "sandbox";
  return mode === "live" ? PAYPAL_API_BASE.live : PAYPAL_API_BASE.sandbox;
}

// Access token cache
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get PayPal access token using OAuth2
 * Caches the token to minimize API calls
 */
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const response = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal auth error:", error);
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return data.access_token;
}

export interface CreateOrderParams {
  bookingId: string;
  amount: number; // in USD cents
  description: string;
  returnUrl: string;
  cancelUrl: string;
  intent?: "CAPTURE" | "AUTHORIZE"; // CAPTURE for instant booking, AUTHORIZE for approval-required
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  purchase_units?: {
    reference_id: string;
    payments?: {
      captures?: {
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }[];
      authorizations?: {
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }[];
    };
  }[];
  links: {
    href: string;
    rel: string;
    method: string;
  }[];
}

/**
 * Create a PayPal order
 * Used for both PayPal button payments
 * - CAPTURE intent: for instant bookings (capture immediately)
 * - AUTHORIZE intent: for approval-required bookings (authorize now, capture on approval)
 */
export async function createOrder(params: CreateOrderParams): Promise<PayPalOrderResponse> {
  const accessToken = await getAccessToken();

  // Convert cents to dollars for PayPal
  const amountInDollars = (params.amount / 100).toFixed(2);

  // Use AUTHORIZE for approval-required bookings, CAPTURE for instant bookings
  const intent = params.intent || "CAPTURE";

  const body = {
    intent,
    purchase_units: [
      {
        reference_id: params.bookingId,
        description: params.description,
        amount: {
          currency_code: "USD",
          value: amountInDollars,
        },
      },
    ],
    application_context: {
      brand_name: "Vehire",
      user_action: "PAY_NOW",
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      // Don't require billing address
      shipping_preference: "NO_SHIPPING",
    },
  };

  console.log("Creating PayPal order:", {
    bookingId: params.bookingId,
    amount: amountInDollars,
    intent,
  });

  const response = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "PayPal-Request-Id": `vehire-${params.bookingId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal order creation error:", error);
    throw new Error(`Failed to create PayPal order: ${error}`);
  }

  const data = await response.json();
  console.log("PayPal order created:", data.id, data.status, "intent:", intent);

  return data;
}

export interface CaptureOrderResponse {
  id: string;
  status: string;
  purchase_units: {
    reference_id: string;
    payments: {
      captures: {
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }[];
    };
  }[];
  payer: {
    payer_id: string;
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
  };
}

/**
 * Capture an approved PayPal order
 * Called after buyer approves payment
 */
export async function captureOrder(orderId: string): Promise<CaptureOrderResponse> {
  const accessToken = await getAccessToken();

  console.log("Capturing PayPal order:", orderId);

  const response = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal capture error:", error);
    throw new Error(`Failed to capture PayPal order: ${error}`);
  }

  const data = await response.json();
  console.log("PayPal order captured:", data.id, data.status);

  return data;
}

/**
 * Get order details
 */
export async function getOrder(orderId: string): Promise<PayPalOrderResponse> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal get order error:", error);
    throw new Error(`Failed to get PayPal order: ${error}`);
  }

  return response.json();
}

/**
 * Authorize an approved PayPal order
 * Called after buyer approves payment for approval-required bookings
 * This holds the funds but doesn't capture them yet
 */
export async function authorizeOrder(orderId: string): Promise<{
  id: string;
  status: string;
  purchase_units: {
    reference_id: string;
    payments: {
      authorizations: {
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
        expiration_time: string;
      }[];
    };
  }[];
}> {
  const accessToken = await getAccessToken();

  console.log("Authorizing PayPal order:", orderId);

  const response = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal authorize error:", error);
    throw new Error(`Failed to authorize PayPal order: ${error}`);
  }

  const data = await response.json();
  console.log("PayPal order authorized:", data.id, data.status);

  return data;
}

/**
 * Capture an authorized payment
 * Called when host approves a booking
 * This actually charges the authorized funds
 */
export async function captureAuthorization(authorizationId: string): Promise<{
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
}> {
  const accessToken = await getAccessToken();

  console.log("Capturing PayPal authorization:", authorizationId);

  const response = await fetch(
    `${getBaseUrl()}/v2/payments/authorizations/${authorizationId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal capture authorization error:", error);
    throw new Error(`Failed to capture PayPal authorization: ${error}`);
  }

  const data = await response.json();
  console.log("PayPal authorization captured:", data.id, data.status);

  return data;
}

/**
 * Void an authorized payment
 * Called when host rejects a booking or booking is cancelled
 * This releases the held funds without charging
 */
export async function voidAuthorization(authorizationId: string): Promise<{
  id: string;
  status: string;
}> {
  const accessToken = await getAccessToken();

  console.log("Voiding PayPal authorization:", authorizationId);

  const response = await fetch(
    `${getBaseUrl()}/v2/payments/authorizations/${authorizationId}/void`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal void authorization error:", error);
    throw new Error(`Failed to void PayPal authorization: ${error}`);
  }

  const data = await response.json();
  console.log("PayPal authorization voided:", data.id, data.status);

  return data;
}

/**
 * Verify PayPal webhook signature
 * Validates that the webhook came from PayPal
 */
/**
 * Verify PayPal webhook signature using the PayPal Verification API
 * This calls PayPal's API to verify the webhook event is authentic
 */
export async function verifyWebhookSignature(params: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookId: string;
  body: string;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    console.error("PAYPAL_WEBHOOK_ID not configured - rejecting webhook");
    return false;
  }

  if (!params.transmissionId || !params.transmissionSig || !params.transmissionTime) {
    console.warn("PayPal webhook missing signature headers");
    return false;
  }

  try {
    const accessToken = await getAccessToken();

    const verificationBody = {
      auth_algo: params.authAlgo,
      cert_url: params.certUrl,
      transmission_id: params.transmissionId,
      transmission_sig: params.transmissionSig,
      transmission_time: params.transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(params.body),
    };

    const response = await fetch(
      `${getBaseUrl()}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(verificationBody),
      }
    );

    if (!response.ok) {
      console.error("PayPal webhook verification API error:", await response.text());
      return false;
    }

    const result = await response.json();
    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Error verifying PayPal webhook signature:", error);
    return false;
  }
}

/**
 * Map PayPal order status to our payment status
 */
export function mapPayPalStatus(
  status: string
): "PENDING" | "PROCESSING" | "HELD" | "RELEASED" | "REFUNDED" | "FAILED" {
  switch (status) {
    case "COMPLETED":
      return "HELD";
    case "APPROVED":
    case "CREATED":
    case "SAVED":
      return "PROCESSING";
    case "VOIDED":
    case "CANCELLED":
    case "DENIED":
      return "FAILED";
    default:
      return "PENDING";
  }
}

/**
 * Get client token for hosted fields (card payments)
 * This is needed for the frontend to render card fields securely
 */
export async function getClientToken(): Promise<string> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${getBaseUrl()}/v1/identity/generate-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en_US",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal client token error:", error);
    throw new Error(`Failed to get PayPal client token: ${error}`);
  }

  const data = await response.json();
  return data.client_token;
}
