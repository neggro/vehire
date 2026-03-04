import { NextResponse } from "next/server";
import { getPaymentMethods } from "@/lib/mercadopago";

/**
 * GET /api/payments/methods
 * Returns available payment methods for cards (credit/debit)
 */
export async function GET() {
  try {
    const methods = await getPaymentMethods();

    // Filter only card payment methods (credit and debit)
    const cardMethods = methods.filter(
      (method) =>
        method.paymentTypeId === "credit_card" ||
        method.paymentTypeId === "debit_card"
    );

    return NextResponse.json({
      methods: cardMethods.map((method) => ({
        id: method.id,
        name: method.name,
        paymentType: method.paymentTypeId,
        thumbnail: method.secureThumbnail,
        minAmount: method.minAllowedAmount,
        maxAmount: method.maxAllowedAmount,
        settings: method.settings,
      })),
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Error al obtener medios de pago" },
      { status: 500 }
    );
  }
}
