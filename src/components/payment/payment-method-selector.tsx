"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Wallet, Loader2, DollarSign } from "lucide-react";
import { CardPaymentForm } from "./card-payment-form";
import { CurrencySelector } from "./currency-selector";
import { PayPalCardForm } from "./paypal-card-form";
import { convertUyuToUsd, type CurrencyCode } from "@/lib/currency";

interface PaymentMethodSelectorProps {
  amount: number; // in UYU cents
  email: string;
  onCardPayment: (data: {
    cardToken: string;
    paymentMethodId: string;
    installments: number;
    issuerId?: string;
    identificationType: string;
    identificationNumber: string;
  }) => Promise<void>;
  onCheckoutPro: () => void;
  onPayPalOrder: (orderId: string) => Promise<void>;
  createPayPalOrder: () => Promise<string>;
  isProcessing?: boolean;
  isRedirecting?: boolean;
}

export function PaymentMethodSelector({
  amount,
  email,
  onCardPayment,
  onCheckoutPro,
  onPayPalOrder,
  createPayPalOrder,
  isProcessing = false,
  isRedirecting = false,
}: PaymentMethodSelectorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("UYU");
  const [activeTab, setActiveTab] = useState<"card" | "wallet">("card");

  const isLoading = isProcessing || isRedirecting;

  // Convert amount to USD if needed
  const usdAmount = convertUyuToUsd(amount);

  // Handle currency change
  const handleCurrencyChange = (currency: CurrencyCode) => {
    setSelectedCurrency(currency);
    // Reset to default tab when switching currency
    setActiveTab("card");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Método de pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency Selector */}
        <CurrencySelector
          selectedCurrency={selectedCurrency}
          onCurrencyChange={handleCurrencyChange}
          uyuAmount={amount}
          usdAmount={usdAmount}
          disabled={isLoading}
        />

        {/* Payment Methods - UYU (Mercado Pago) */}
        {selectedCurrency === "UYU" && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "card" | "wallet")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="card" disabled={isLoading}>
                <CreditCard className="h-4 w-4 mr-2" />
                Tarjeta
              </TabsTrigger>
              <TabsTrigger value="wallet" disabled={isLoading}>
                <Wallet className="h-4 w-4 mr-2" />
                Mercado Pago
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card">
              <CardPaymentForm
                amount={amount}
                email={email}
                onPaymentSubmit={onCardPayment}
                isProcessing={isProcessing}
              />
            </TabsContent>

            <TabsContent value="wallet">
              <div className="space-y-6">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Serás redirigido a Mercado Pago para completar el pago de forma segura.
                    Puedes usar tu saldo de Mercado Pago o tarjetas guardadas.
                  </p>
                </div>

                <Button
                  onClick={onCheckoutPro}
                  className="w-full"
                  size="lg"
                  disabled={isRedirecting}
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirigiendo...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Pagar con Mercado Pago
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Payment Methods - USD (PayPal) */}
        {selectedCurrency === "USD" && (
          <div className="space-y-6">
            <PayPalCardForm
              amount={usdAmount}
              email={email}
              createOrder={createPayPalOrder}
              onApprove={onPayPalOrder}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
