"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { usePayPal } from "@/hooks/use-paypal";
import { formatPriceFromCents } from "@/lib/currency";

interface PayPalCardFormProps {
  amount: number; // in USD cents
  email: string;
  createOrder: () => Promise<string>;
  onApprove: (orderId: string) => Promise<void>;
  isProcessing?: boolean;
}

export function PayPalCardForm({
  amount,
  email,
  createOrder,
  onApprove,
  isProcessing = false,
}: PayPalCardFormProps) {
  const {
    isLoading: sdkLoading,
    error: sdkError,
    renderButton,
  } = usePayPal();

  const [renderError, setRenderError] = useState<string | null>(null);
  const buttonRenderedRef = useRef(false);

  // Render PayPal button when SDK is ready
  useEffect(() => {
    if (sdkLoading || sdkError) return;
    if (buttonRenderedRef.current) return;

    const renderPayPalButton = async () => {
      const success = await renderButton("paypal-button-container", {
        createOrder,
        onApprove,
        onError: (err) => {
          console.error("PayPal payment error:", err);
          setRenderError("Error al procesar el pago con PayPal.");
        },
        onCancel: () => {
          console.log("PayPal payment cancelled by user");
        },
      });

      if (!success) {
        setRenderError("No se pudo cargar el botón de PayPal");
      }
      buttonRenderedRef.current = true;
    };

    renderPayPalButton();
  }, [sdkLoading, sdkError, renderButton, createOrder, onApprove]);

  if (sdkLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-muted-foreground">Cargando PayPal...</span>
      </div>
    );
  }

  if (sdkError) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <p className="text-sm text-destructive">{sdkError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PayPal info */}
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground mb-3">
          Serás redirigido a PayPal para completar el pago de forma segura. Puedes usar:
        </p>
        <ul className="text-sm space-y-2">
          <li className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Saldo en tu cuenta PayPal
          </li>
          <li className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Tarjetas vinculadas a tu cuenta PayPal
          </li>
        </ul>
      </div>

      {/* Email display */}
      <div className="rounded-lg bg-muted p-3 text-sm">
        <span className="text-muted-foreground">El recibo se enviará a: </span>
        <span className="font-medium">{email}</span>
      </div>

      {/* Error message */}
      {renderError && (
        <div className="rounded-lg bg-destructive/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{renderError}</p>
        </div>
      )}

      {/* PayPal Button Container */}
      <div id="paypal-button-container" className="min-h-[48px]" />

      {/* Total display */}
      <div className="text-center">
        <span className="text-muted-foreground text-sm">Total a pagar: </span>
        <span className="font-semibold">{formatPriceFromCents(amount, "USD")}</span>
      </div>

      {/* Security note */}
      <p className="text-center text-xs text-muted-foreground">
        <CheckCircle2 className="inline h-3 w-3 mr-1" />
        Pago seguro procesado por PayPal
      </p>
    </div>
  );
}
