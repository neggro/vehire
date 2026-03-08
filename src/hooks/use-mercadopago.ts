"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// Type declarations for Mercado Pago SDK
declare global {
  interface Window {
    MercadoPago: MercadoPagoConstructor;
  }
}

interface MercadoPagoConstructor {
  new (publicKey: string, options?: { locale?: string }): MercadoPagoInstance;
}

interface MercadoPagoField {
  mount: (containerId: string) => MercadoPagoField;
  on(event: "ready" | "change" | "error" | "focus" | "blur", callback: (data?: FieldEventData) => void): void;
  on(event: "binChange", callback: (data?: BinChangeEventData) => void): void;
  update: (settings: { settings?: unknown }) => void;
  unmount: () => void;
}

interface FieldEventData {
  isEmpty?: boolean;
  isFocused?: boolean;
  error?: string;
  isValid?: boolean;
}

interface BinChangeEventData {
  bin?: string;
}

interface MercadoPagoFields {
  create: (type: string, options?: { placeholder?: string; style?: Record<string, unknown> }) => MercadoPagoField;
  createCardToken: (data: {
    cardholderName: string;
    identificationType: string;
    identificationNumber: string;
  }) => Promise<{ id: string }>;
}

interface MercadoPagoInstance {
  fields: MercadoPagoFields;
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

  // Secure fields refs
  const cardNumberFieldRef = useRef<MercadoPagoField | null>(null);
  const expirationFieldRef = useRef<MercadoPagoField | null>(null);
  const securityCodeFieldRef = useRef<MercadoPagoField | null>(null);

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
      console.log("Initializing Mercado Pago with public key:", publicKey.substring(0, 10) + "...");
      const mpInstance = new window.MercadoPago(publicKey, {
        locale: "es-UY",
      });
      setMp(mpInstance);
      console.log("Mercado Pago instance created successfully");

      // Fetch identification types for Uruguay
      const idTypes = await mpInstance.getIdentificationTypes();
      console.log("Identification types loaded:", idTypes.length);
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

  // Create card token - requires secure fields to be mounted first
  const createCardToken = useCallback(
    async (data: {
      cardholderName: string;
      identificationType: string;
      identificationNumber: string;
    }): Promise<string | null> => {
      if (!mp) {
        console.error("Mercado Pago not initialized");
        return null;
      }

      try {
        console.log("Creating card token with data:", {
          cardholderName: data.cardholderName,
          identificationType: data.identificationType,
          identificationNumber: data.identificationNumber,
        });
        const token = await mp.fields.createCardToken(data);
        console.log("Card token created:", token);
        return token.id;
      } catch (err) {
        console.error("Error creating card token:", err);
        return null;
      }
    },
    [mp]
  );

  // Mount secure card fields
  const mountCardFields = useCallback(
    (
      cardNumberContainerId: string,
      expirationContainerId: string,
      securityCodeContainerId: string,
      callbacks?: {
        onCardNumberChange?: (data?: FieldEventData) => void;
        onBinChange?: (bin: string) => void;
        onExpirationChange?: (data?: FieldEventData) => void;
        onSecurityCodeChange?: (data?: FieldEventData) => void;
      }
    ) => {
      if (!mp) {
        console.error("Cannot mount fields: Mercado Pago not initialized");
        return;
      }

      console.log("Mounting secure fields...");

      // Clean up existing fields
      if (cardNumberFieldRef.current) {
        cardNumberFieldRef.current.unmount();
      }
      if (expirationFieldRef.current) {
        expirationFieldRef.current.unmount();
      }
      if (securityCodeFieldRef.current) {
        securityCodeFieldRef.current.unmount();
      }

      // Create and mount card number field
      cardNumberFieldRef.current = mp.fields.create("cardNumber", {
        placeholder: "1234 5678 9012 3456",
      });
      cardNumberFieldRef.current.mount(cardNumberContainerId);
      cardNumberFieldRef.current.on("ready", () => console.log("Card number field ready"));

      // Listen to change event for validation
      if (callbacks?.onCardNumberChange) {
        cardNumberFieldRef.current.on("change", callbacks.onCardNumberChange);
      }

      // Listen to binChange event for card brand detection
      if (callbacks?.onBinChange) {
        cardNumberFieldRef.current.on("binChange", (data) => {
          console.log("binChange event data:", data);
          if (data?.bin) {
            callbacks.onBinChange!(data.bin);
          }
        });
      }

      // Create and mount expiration field
      expirationFieldRef.current = mp.fields.create("expirationDate", {
        placeholder: "MM/YY",
      });
      expirationFieldRef.current.mount(expirationContainerId);
      expirationFieldRef.current.on("ready", () => console.log("Expiration field ready"));
      if (callbacks?.onExpirationChange) {
        expirationFieldRef.current.on("change", callbacks.onExpirationChange);
      }

      // Create and mount security code field
      securityCodeFieldRef.current = mp.fields.create("securityCode", {
        placeholder: "123",
      });
      securityCodeFieldRef.current.mount(securityCodeContainerId);
      securityCodeFieldRef.current.on("ready", () => console.log("Security code field ready"));
      if (callbacks?.onSecurityCodeChange) {
        securityCodeFieldRef.current.on("change", callbacks.onSecurityCodeChange);
      }

      console.log("Secure fields mounted successfully");
    },
    [mp]
  );

  // Unmount card fields
  const unmountCardFields = useCallback(() => {
    if (cardNumberFieldRef.current) {
      cardNumberFieldRef.current.unmount();
      cardNumberFieldRef.current = null;
    }
    if (expirationFieldRef.current) {
      expirationFieldRef.current.unmount();
      expirationFieldRef.current = null;
    }
    if (securityCodeFieldRef.current) {
      securityCodeFieldRef.current.unmount();
      securityCodeFieldRef.current = null;
    }
  }, []);

  return {
    mp,
    isLoading,
    error,
    identificationTypes,
    getPaymentMethod,
    getIssuers,
    getInstallments,
    createCardToken,
    mountCardFields,
    unmountCardFields,
  };
}
