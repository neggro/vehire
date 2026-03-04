"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMercadoPago } from "@/hooks/use-mercadopago";
import { formatPriceFromCents } from "@/lib/bookings";

interface CardPaymentFormProps {
  amount: number; // in cents
  email: string;
  onPaymentSubmit: (data: {
    cardToken: string;
    paymentMethodId: string;
    installments: number;
    issuerId?: string;
    identificationType: string;
    identificationNumber: string;
  }) => Promise<void>;
  isProcessing?: boolean;
}

interface InstallmentOption {
  installments: number;
  installmentRate: number;
  installmentAmount: number;
  totalAmount: number;
  recommendedMessage: string;
}

export function CardPaymentForm({
  amount,
  email,
  onPaymentSubmit,
  isProcessing = false,
}: CardPaymentFormProps) {
  const {
    isLoading: sdkLoading,
    error: sdkError,
    identificationTypes,
    getPaymentMethod,
    getInstallments,
    createCardToken,
  } = useMercadoPago();

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [identificationType, setIdentificationType] = useState("");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [selectedInstallments, setSelectedInstallments] = useState("1");

  // Card info state
  const [cardBrand, setCardBrand] = useState<{
    id: string;
    name: string;
    thumbnail: string;
  } | null>(null);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [cardValidation, setCardValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  // UI state
  const [formError, setFormError] = useState<string | null>(null);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    return parts.length ? parts.join(" ") : v;
  };

  // Format expiry date (MM/YY)
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  // Handle card number change
  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);

    // Clear brand when number is cleared
    if (formatted.length < 6) {
      setCardBrand(null);
      setInstallmentOptions([]);
      setCardValidation(null);
    }
  };

  // Detect card brand when BIN is complete
  useEffect(() => {
    const bin = cardNumber.replace(/\s/g, "").substring(0, 8);
    if (bin.length >= 6 && !cardBrand) {
      detectCardBrand(bin);
    }
  }, [cardNumber, cardBrand]);

  const detectCardBrand = async (bin: string) => {
    const brand = await getPaymentMethod(bin);
    if (brand) {
      setCardBrand(brand);
      // Fetch installment options
      const installments = await getInstallments(bin, amount);
      setInstallmentOptions(installments);
    }
  };

  // Validate expiry date
  const validateExpiry = (value: string): boolean => {
    const [month, year] = value.split("/");
    if (!month || !year) return false;

    const m = parseInt(month, 10);
    const y = parseInt("20" + year, 10);

    if (m < 1 || m > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (y < currentYear || (y === currentYear && m < currentMonth)) {
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate form
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 15) {
      setFormError("Ingresa un número de tarjeta válido");
      return;
    }

    if (!validateExpiry(expiry)) {
      setFormError("Ingresa una fecha de vencimiento válida");
      return;
    }

    if (!cvv || cvv.length < 3) {
      setFormError("Ingresa un CVV válido");
      return;
    }

    if (!cardholderName.trim()) {
      setFormError("Ingresa el nombre del titular");
      return;
    }

    if (!identificationType) {
      setFormError("Selecciona el tipo de documento");
      return;
    }

    if (!identificationNumber.trim()) {
      setFormError("Ingresa el número de documento");
      return;
    }

    if (!cardBrand) {
      setFormError("No se pudo identificar la tarjeta");
      return;
    }

    // Create card token
    const cardToken = await createCardToken({
      cardholderName: cardholderName.trim(),
      identificationType,
      identificationNumber: identificationNumber.trim(),
    });

    if (!cardToken) {
      setFormError("Error al procesar los datos de la tarjeta. Intenta nuevamente.");
      return;
    }

    // Submit payment
    try {
      await onPaymentSubmit({
        cardToken,
        paymentMethodId: cardBrand.id,
        installments: parseInt(selectedInstallments, 10),
        identificationType,
        identificationNumber: identificationNumber.trim(),
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Error al procesar el pago"
      );
    }
  };

  if (sdkLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-muted-foreground">Cargando formulario de pago...</span>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Number */}
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Número de tarjeta</Label>
        <div className="relative">
          <Input
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => handleCardNumberChange(e.target.value)}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="pr-12"
            disabled={isProcessing}
          />
          {cardBrand && (
            <img
              src={cardBrand.thumbnail}
              alt={cardBrand.name}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6"
            />
          )}
        </div>
      </div>

      {/* Expiry and CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry">Vencimiento</Label>
          <Input
            id="expiry"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            maxLength={5}
            disabled={isProcessing}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
            placeholder="123"
            maxLength={4}
            type="password"
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Cardholder Name */}
      <div className="space-y-2">
        <Label htmlFor="cardholderName">Nombre del titular</Label>
        <Input
          id="cardholderName"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
          placeholder="JUAN PÉREZ"
          disabled={isProcessing}
        />
      </div>

      {/* Identification */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="idType">Documento</Label>
          <Select
            value={identificationType}
            onValueChange={setIdentificationType}
            disabled={isProcessing}
          >
            <SelectTrigger id="idType">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {identificationTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="idNumber">Número</Label>
          <Input
            id="idNumber"
            value={identificationNumber}
            onChange={(e) =>
              setIdentificationNumber(e.target.value.replace(/\D/g, ""))
            }
            placeholder="12345678"
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Installments */}
      {installmentOptions.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="installments">Cuotas</Label>
          <Select
            value={selectedInstallments}
            onValueChange={setSelectedInstallments}
            disabled={isProcessing}
          >
            <SelectTrigger id="installments">
              <SelectValue placeholder="Selecciona cuotas" />
            </SelectTrigger>
            <SelectContent>
              {installmentOptions.map((option) => (
                <SelectItem
                  key={option.installments}
                  value={option.installments.toString()}
                >
                  {option.recommendedMessage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Selected installment summary */}
      {selectedInstallments !== "1" && installmentOptions.length > 0 && (
        <div className="rounded-lg bg-muted p-3 text-sm">
          {(() => {
            const selected = installmentOptions.find(
              (o) => o.installments.toString() === selectedInstallments
            );
            if (selected) {
              return (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor de cuota:</span>
                    <span>{formatPriceFromCents(selected.installmentAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatPriceFromCents(selected.totalAmount)}</span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Error message */}
      {formError && (
        <div className="rounded-lg bg-destructive/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{formError}</p>
        </div>
      )}

      {/* Submit button */}
      <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pagar {formatPriceFromCents(amount)}
          </>
        )}
      </Button>

      {/* Security note */}
      <p className="text-center text-xs text-muted-foreground">
        <CheckCircle2 className="inline h-3 w-3 mr-1" />
        Pago seguro procesado por Mercado Pago
      </p>
    </form>
  );
}
