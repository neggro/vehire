import MercadoPagoConfig, { Preference, Payment } from "mercadopago";

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
  signature: string,
  payload: string
): boolean {
  // TODO: Implement webhook signature verification
  // For now, return true in development
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // In production, verify the signature using MERCADOPAGO_WEBHOOK_SECRET
  return true;
}

export { client, preference, payment };
