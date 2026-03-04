"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Wallet, Loader2, ArrowRight } from "lucide-react";
import { CardPaymentForm } from "./card-payment-form";

interface PaymentMethodSelectorProps {
  amount: number; // in cents
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
  isProcessing?: boolean;
  isRedirecting?: boolean;
}

export function PaymentMethodSelector({
  amount,
  email,
  onCardPayment,
  onCheckoutPro,
  isProcessing = false,
  isRedirecting = false,
}: PaymentMethodSelectorProps) {
  const [activeTab, setActiveTab] = useState<"card" | "wallet">("card");

  const isLoading = isProcessing || isRedirecting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Método de pago</CardTitle>
      </CardHeader>
      <CardContent>
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
                  Puedes usar:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Saldo en tu cuenta Mercado Pago
                  </li>
                  <li className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Tarjetas guardadas en Mercado Pago
                  </li>
                  <li className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Nuevas tarjetas de crédito/débito
                  </li>
                </ul>
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
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Pagar con Mercado Pago
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
