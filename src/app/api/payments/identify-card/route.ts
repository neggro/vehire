import { NextRequest, NextResponse } from "next/server";
import { identifyCardType } from "@/lib/mercadopago";

/**
 * GET /api/payments/identify-card?bin=423563
 * Returns card type identification from BIN (first 6-8 digits)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bin = searchParams.get("bin");

    if (!bin || bin.length < 6) {
      return NextResponse.json(
        { error: "Se requiere BIN de al menos 6 dígitos" },
        { status: 400 }
      );
    }

    const cardInfo = await identifyCardType(bin);

    if (!cardInfo) {
      return NextResponse.json({
        identified: false,
        message: "No se pudo identificar el tipo de tarjeta",
      });
    }

    return NextResponse.json({
      identified: true,
      paymentMethodId: cardInfo.paymentMethodId,
      thumbnail: cardInfo.thumbnail,
    });
  } catch (error) {
    console.error("Error identifying card:", error);
    return NextResponse.json(
      { error: "Error al identificar tarjeta" },
      { status: 500 }
    );
  }
}
