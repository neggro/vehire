"use client";

import { Button } from "@/components/ui/button";
import { formatPriceFromCents, getExchangeRateDisplay, type CurrencyCode } from "@/lib/currency";

interface CurrencySelectorProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  uyuAmount: number; // in UYU cents
  usdAmount: number; // in USD cents
  disabled?: boolean;
}

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  uyuAmount,
  usdAmount,
  disabled = false,
}: CurrencySelectorProps) {
  return (
    <div className="space-y-3">
      {/* Currency toggle buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={selectedCurrency === "UYU" ? "default" : "outline"}
          className="flex-1 flex flex-col items-center py-3"
          onClick={() => onCurrencyChange("UYU")}
          disabled={disabled}
        >
          <span className="font-medium">UYU</span>
          <span className="text-xs opacity-80">Pesos Uruguayos</span>
        </Button>
        <Button
          type="button"
          variant={selectedCurrency === "USD" ? "default" : "outline"}
          className="flex-1 flex flex-col items-center py-3"
          onClick={() => onCurrencyChange("USD")}
          disabled={disabled}
        >
          <span className="font-medium">USD</span>
          <span className="text-xs opacity-80">Dólares</span>
        </Button>
      </div>

      {/* Price display */}
      <div className="flex items-center justify-between rounded-lg bg-muted p-3">
        <span className="text-sm text-muted-foreground">Total a pagar:</span>
        <div className="text-right">
          <span className="font-semibold text-lg">
            {formatPriceFromCents(selectedCurrency === "UYU" ? uyuAmount : usdAmount, selectedCurrency)}
          </span>
          {selectedCurrency === "USD" && (
            <p className="text-xs text-muted-foreground">
              Equivalente a {formatPriceFromCents(uyuAmount, "UYU")}
            </p>
          )}
        </div>
      </div>

      {/* Exchange rate info */}
      <p className="text-xs text-muted-foreground text-center">
        {getExchangeRateDisplay()}
      </p>
    </div>
  );
}
