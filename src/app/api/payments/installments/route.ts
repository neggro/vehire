import { NextRequest, NextResponse } from "next/server";
import { getInstallments } from "@/lib/mercadopago";

/**
 * GET /api/payments/installments?paymentMethodId=visa&amount=10000
 * Returns available installment options for a payment method and amount
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get("paymentMethodId");
    const amountParam = searchParams.get("amount");

    if (!paymentMethodId || !amountParam) {
      return NextResponse.json(
        { error: "Se requiere paymentMethodId y amount" },
        { status: 400 }
      );
    }

    const amount = parseInt(amountParam, 10);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount debe ser un número positivo" },
        { status: 400 }
      );
    }

    const installments = await getInstallments(paymentMethodId, amount);

    // Format the response for frontend consumption
    const formattedInstallments = installments.flatMap((item) =>
      item.payerCosts.map((cost) => ({
        installments: cost.installments,
        installmentRate: cost.installmentRate,
        installmentAmount: Math.round(cost.installmentAmount * 100), // Convert to cents
        totalAmount: Math.round(cost.totalAmount * 100), // Convert to cents
        recommendedMessage: cost.recommendedMessage,
        issuer: item.issuer,
      }))
    );

    return NextResponse.json({
      paymentMethodId,
      amount,
      installments: formattedInstallments,
    });
  } catch (error) {
    console.error("Error fetching installments:", error);
    return NextResponse.json(
      { error: "Error al obtener opciones de cuotas" },
      { status: 500 }
    );
  }
}
