"use client";

import { useState, useEffect } from "react";
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
    mountCardFields,
    unmountCardFields,
  } = useMercadoPago();

  // Form state
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

  // Secure fields state
  const [fieldsReady, setFieldsReady] = useState(false);
  const [cardNumberError, setCardNumberError] = useState<string | null>(null);
  const [expirationError, setExpirationError] = useState<string | null>(null);
  const [securityCodeError, setSecurityCodeError] = useState<string | null>(null);

  // UI state
  const [formError, setFormError] = useState<string | null>(null);

  // Mount secure fields when SDK is ready
  useEffect(() => {
    if (!sdkLoading && !sdkError) {
      mountCardFields(
        "cardNumber-container",
        "expiration-container",
        "securityCode-container",
        {
          onCardNumberChange: (data) => {
            console.log("Card number change:", data);
            // SDK doesn't provide validation in change event, just clear errors
            setCardNumberError(null);
          },
          onBinChange: async (bin) => {
            console.log("BIN change:", bin);
            // When BIN is available, detect card brand
            if (bin && bin.length >= 6) {
              const brand = await getPaymentMethod(bin);
              if (brand) {
                setCardBrand(brand);
                // Fetch installment options
                const installments = await getInstallments(bin, amount);
                setInstallmentOptions(installments);
              }
            } else {
              setCardBrand(null);
              setInstallmentOptions([]);
            }
          },
          onExpirationChange: (data) => {
            console.log("Expiration change:", data);
            setExpirationError(null);
          },
          onSecurityCodeChange: (data) => {
            console.log("Security code change:", data);
            setSecurityCodeError(null);
          },
        }
      );
      setFieldsReady(true);

      return () => {
        unmountCardFields();
      };
    }
  }, [sdkLoading, sdkError, mountCardFields, unmountCardFields, getPaymentMethod, getInstallments, amount]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

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

    // Card brand detection indicates the card number was entered
    // If no cardBrand, the user hasn't entered a valid card number yet
    if (!cardBrand) {
      setFormError("Por favor completa los datos de la tarjeta");
      return;
    }

    // Create card token using secure fields - SDK will validate internally
    const cardToken = await createCardToken({
      cardholderName: cardholderName.trim(),
      identificationType,
      identificationNumber: identificationNumber.trim(),
    });

    if (!cardToken) {
      setFormError("Error al procesar los datos de la tarjeta. Verifica los datos e intenta nuevamente.");
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
      {/* Secure Card Number Field */}
      <div className="space-y-2">
        <Label>Número de tarjeta</Label>
        <div className="relative">
          <div
            id="cardNumber-container"
            className={`h-10 rounded-md border bg-background pr-12 ${cardNumberError ? "border-destructive" : "border-input"}`}
          />
          {cardBrand && (
            <img
              src={cardBrand.thumbnail}
              alt={cardBrand.name}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 pointer-events-none"
            />
          )}
        </div>
        {cardNumberError && (
          <p className="text-xs text-destructive">{cardNumberError}</p>
        )}
      </div>

      {/* Secure Expiry and CVV Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vencimiento</Label>
          <div
            id="expiration-container"
            className={`h-10 rounded-md border bg-background ${expirationError ? "border-destructive" : "border-input"}`}
          />
          {expirationError && (
            <p className="text-xs text-destructive">{expirationError}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>CVV</Label>
          <div
            id="securityCode-container"
            className={`h-10 rounded-md border bg-background ${securityCodeError ? "border-destructive" : "border-input"}`}
          />
          {securityCodeError && (
            <p className="text-xs text-destructive">{securityCodeError}</p>
          )}
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
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isProcessing || !fieldsReady || !cardBrand}
      >
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
