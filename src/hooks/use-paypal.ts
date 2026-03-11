"use client";

import { useEffect, useState, useCallback } from "react";

// Type declarations for PayPal SDK
declare global {
  interface Window {
    paypal?: PayPalSDK;
    __paypalScriptIntent?: string;
  }
}

interface PayPalSDK {
  Buttons: (config: PayPalButtonsConfig) => PayPalButtonInstance;
}

interface PayPalButtonsConfig {
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError?: (err: Error) => void;
  onCancel?: () => void;
  style?: {
    layout?: string;
    color?: string;
    shape?: string;
    label?: string;
    height?: number;
  };
}

interface PayPalButtonInstance {
  isEligible: () => boolean;
  render: (container: string) => Promise<void>;
}

interface UsePayPalOptions {
  currency?: string;
}

export function usePayPal(options: UsePayPalOptions = {}) {
  const { currency = "USD" } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize PayPal SDK with authorize intent (supports both capture and authorize)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    // Always use "authorize" intent - this allows both CAPTURE and AUTHORIZE order types
    const intent = "authorize";

    if (!clientId) {
      console.warn("PayPal client ID not configured");
      setError("PayPal no está configurado");
      setIsLoading(false);
      return;
    }

    // Check if SDK is already loaded with correct intent
    if (window.paypal && window.__paypalScriptIntent === intent) {
      setIsLoading(false);
      return;
    }

    // Remove existing PayPal script if it exists with different intent
    const existingScript = document.querySelector(
      'script[src*="paypal.com/sdk/js"]'
    );
    if (existingScript) {
      existingScript.remove();
      // Clear paypal from window to force reload
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).paypal) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).paypal;
      }
    }

    // Load PayPal SDK script with authorize intent
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent}&components=buttons`;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      console.log("PayPal SDK loaded successfully with intent:", intent);
      window.__paypalScriptIntent = intent;
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error("Failed to load PayPal SDK");
      setError("Error al cargar PayPal");
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts before load
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [currency]);

  /**
   * Render PayPal button
   */
  const renderButton = useCallback(
    async (
      containerId: string,
      config: {
        createOrder: () => Promise<string>;
        onApprove: (orderId: string) => Promise<void>;
        onError?: (err: Error) => void;
        onCancel?: () => void;
      }
    ): Promise<boolean> => {
      if (!window.paypal) {
        console.error("PayPal SDK not loaded");
        return false;
      }

      try {
        // Clear the container first
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = "";
        }

        const buttons = window.paypal.Buttons({
          createOrder: config.createOrder,
          onApprove: async (data) => {
            await config.onApprove(data.orderID);
          },
          onError: (err) => {
            console.error("PayPal button error:", err);
            config.onError?.(err);
          },
          onCancel: () => {
            console.log("PayPal payment cancelled");
            config.onCancel?.();
          },
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
            height: 48,
          },
        });

        if (buttons.isEligible()) {
          await buttons.render(`#${containerId}`);
          return true;
        }

        return false;
      } catch (err) {
        console.error("Error rendering PayPal button:", err);
        return false;
      }
    },
    []
  );

  return {
    isLoading,
    error,
    renderButton,
  };
}
