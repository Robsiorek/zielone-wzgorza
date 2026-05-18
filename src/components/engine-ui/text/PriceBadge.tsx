"use client";

/**
 * PriceBadge — Engine UI Part 13 (Commerce + Utility).
 *
 * Mała promocyjna etykieta przy cenie ("Najlepsza cena", "Promocja"):
 * zielony semibold inline-text + opcjonalna ikona wiodąca. Token-kolor
 * (var(--eui-success) — spłaca dług hardcoded #16a34a z legacy), ZERO
 * zewnętrznego marginesu (odstęp własi rodzic — reguła VISUAL-DNA).
 *
 * Canonical następca legacy `.eui-price-badge` / `.eui-card-price-badge`.
 * PO D7=C: DODANY ADDYTYWNIE — własna niekolidująca klasa `.eui-price-flag`
 * (legacy selektory NIETKNIĘTE, PriceBlock/ResultCard bez zmian). Migracja
 * = osobny cleanup-later po visual review (świadoma decyzja parity).
 * size sm/md = parytet-capable z legacy (11px / font-size-sm) na przyszłą migrację.
 */

import * as React from "react";

export type PriceBadgeSize = "sm" | "md";

export interface PriceBadgeProps extends React.HTMLAttributes<HTMLElement> {
  as?: "span" | "div";
  /** Opcjonalna ikona wiodąca (auto-rozmiar 12px przez CSS — §10 icon sizing). */
  icon?: React.ReactNode;
  /** sm = 11px (parytet legacy PriceBlock) · md = font-size-sm 13px (parytet ResultCard). */
  size?: PriceBadgeSize;
  children: React.ReactNode;
}

export const PriceBadge = React.forwardRef<HTMLElement, PriceBadgeProps>(
  function PriceBadge(
    { as = "span", icon, size = "md", className, children, ...rest },
    ref
  ) {
    const Element = as as React.ElementType;
    const classes = [
      "eui-price-flag",
      `eui-price-flag-${size}`,
      className,
    ].filter(Boolean).join(" ");

    return (
      <Element ref={ref} className={classes} {...rest}>
        {icon && (
          <span className="eui-price-flag-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
      </Element>
    );
  }
);

PriceBadge.displayName = "PriceBadge";
