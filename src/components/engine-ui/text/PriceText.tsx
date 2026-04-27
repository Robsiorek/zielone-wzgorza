"use client";

import * as React from "react";

export interface PriceTextProps extends React.HTMLAttributes<HTMLElement> {
  amount: number;
  currency?: string;
  per?: "night" | "person" | "week" | string;
  variant?: "display" | "primary" | "compact";
  emphasizeAmount?: boolean;
  formatAmount?: (amount: number) => string;
  as?: "span" | "p" | "div";
}

const DEFAULT_FORMAT = (amount: number): string => {
  return amount.toLocaleString("pl-PL", { maximumFractionDigits: 0 });
};

const PER_LABELS: Record<string, string> = {
  night: "noc",
  person: "osoba",
  week: "tydzień",
};

const VARIANT_CLASS: Record<string, string> = {
  display: "eui-display-2",
  primary: "eui-title-2",
  compact: "eui-body",
};

export const PriceText = React.forwardRef<HTMLElement, PriceTextProps>(
  function PriceText(
    {
      amount, currency = "zł", per,
      variant = "compact", emphasizeAmount = true,
      formatAmount = DEFAULT_FORMAT, as = "span",
      className, ...rest
    },
    ref
  ) {
    const Element = as as React.ElementType;
    const perLabel = per ? (PER_LABELS[per] ?? per) : null;

    const classes = [
      "eui-price-text",
      VARIANT_CLASS[variant],
      `eui-price-text-${variant}`,
      className,
    ].filter(Boolean).join(" ");

    return (
      <Element ref={ref} className={classes} {...rest}>
        <span className={emphasizeAmount ? "eui-price-text-amount" : "eui-price-text-amount-plain"}>
          {formatAmount(amount)} {currency}
        </span>
        {perLabel && (
          <span className="eui-price-text-per">
            {" / "}{perLabel}
          </span>
        )}
      </Element>
    );
  }
);
