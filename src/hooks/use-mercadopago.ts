"use client";

import { useEffect, useState, useCallback } from "react";

// Type declarations for Mercado Pago SDK
declare global {
  interface Window {
    MercadoPago: MercadoPagoConstructor;
  }
}

interface MercadoPagoConstructor {
  new (publicKey: string, options?: { locale?: string }): MercadoPagoInstance;
}

interface MercadoPagoInstance {
  fields: {
    createCardToken: (data: {
      cardholderName: string;
      identificationType: string;
      identificationNumber: string;
    }) => Promise<{ id: string }>;
  };
  getIdentificationTypes: () => Promise<
    { id: string; name: string; type: string; min_length: number; max_length: number }[]
  >;
  getPaymentMethods: (data: { bin: string }) => Promise<{
    results: { id: string; name: string; thumbnail: string }[];
  }>;
  getIssuers: (data: {
    paymentMethodId: string;
    bin?: string;
  }) => Promise<{ id: string; name: string }[]>;
  getInstallments: (data: {
    amount: string;
    locale?: string;
    bin: string;
    processingMode?: string;
  }) => Promise<{
    payer_costs: {
      installments: number;
      installment_rate: number;
      installment_amount: number;
      total_amount: number;
      recommended_message: string;
    }[];
  }[]>;
}

interface IdentificationType {
  id: string;
  name: string;
  type: string;
  minLength: number;
  maxLength: number;
}

interface InstallmentOption {
  installments: number;
  installmentRate: number;
  installmentAmount: number;
  totalAmount: number;
  recommendedMessage: string;
}

export function useMercadoPago() {
  const [mp, setMp] = useState<MercadoPagoInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [identificationTypes, setIdentificationTypes] = useState<IdentificationType[]>([]);

  // Initialize Mercado Pago SDK
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

    if (!publicKey) {
      setError("Mercado Pago public key not configured");
      setIsLoading(false);
      return;
    }

    // Check if SDK is already loaded
    if (window.MercadoPago) {
      initMP(publicKey);
      return;
    }

    // Load SDK script
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => initMP(publicKey);
    script.onerror = () => {
      setError("Failed to load Mercado Pago SDK");
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before load
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize MP instance and fetch identification types
  const initMP = async (publicKey: string) => {
    try {
      const mpInstance = new window.MercadoPago(publicKey, {
        locale: "es-UY",
      });
      setMp(mpInstance);

      // Fetch identification types for Uruguay
      const idTypes = await mpInstance.getIdentificationTypes();
      setIdentificationTypes(
        idTypes.map((t) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          minLength: t.min_length,
          maxLength: t.max_length,
        }))
      );
    } catch (err) {
      console.error("Error initializing Mercado Pago:", err);
      setError("Error al inicializar Mercado Pago");
    } finally {
      setIsLoading(false);
    }
  };

  // Get payment method from card BIN
  const getPaymentMethod = useCallback(
    async (bin: string): Promise<{ id: string; name: string; thumbnail: string } | null> => {
      if (!mp || bin.length < 6) return null;

      try {
        const result = await mp.getPaymentMethods({ bin });
        if (result.results && result.results.length > 0) {
          return result.results[0];
        }
        return null;
      } catch (err) {
        console.error("Error getting payment method:", err);
        return null;
      }
    },
    [mp]
  );

  // Get issuers (banks) for a payment method
  const getIssuers = useCallback(
    async (
      paymentMethodId: string,
      bin?: string
    ): Promise<{ id: string; name: string }[]> => {
      if (!mp) return [];

      try {
        const issuers = await mp.getIssuers({
          paymentMethodId,
          bin,
        });
        return issuers;
      } catch (err) {
        console.error("Error getting issuers:", err);
        return [];
      }
    },
    [mp]
  );

  // Get installment options
  const getInstallments = useCallback(
    async (
      bin: string,
      amount: number
    ): Promise<InstallmentOption[]> => {
      if (!mp || bin.length < 6) return [];

      try {
        const result = await mp.getInstallments({
          amount: (amount / 100).toString(), // Convert cents to currency units
          bin,
          locale: "es-UY",
        });

        if (result && result.length > 0 && result[0].payer_costs) {
          return result[0].payer_costs.map((cost) => ({
            installments: cost.installments,
            installmentRate: cost.installment_rate,
            installmentAmount: Math.round(cost.installment_amount * 100),
            totalAmount: Math.round(cost.total_amount * 100),
            recommendedMessage: cost.recommended_message,
          }));
        }
        return [];
      } catch (err) {
        console.error("Error getting installments:", err);
        return [];
      }
    },
    [mp]
  );

  // Create card token
  const createCardToken = useCallback(
    async (data: {
      cardholderName: string;
      identificationType: string;
      identificationNumber: string;
    }): Promise<string | null> => {
      if (!mp) return null;

      try {
        const token = await mp.fields.createCardToken(data);
        return token.id;
      } catch (err) {
        console.error("Error creating card token:", err);
        return null;
      }
    },
    [mp]
  );

  return {
    mp,
    isLoading,
    error,
    identificationTypes,
    getPaymentMethod,
    getIssuers,
    getInstallments,
    createCardToken,
  };
}
