"use client";

/**
 * PopoverItem — system component (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Generic row: [icon in colored envelope] + [title + optional subtitle].
 * Used wherever a popover/dropdown/menu needs a tappable list item —
 * menus, search suggestions, recent queries, filter pickers.
 *
 * Design rationale (handoff §5.7):
 *   - A dedicated system component (not a private detail of the Popover
 *     section), because the pattern repeats across unrelated surfaces.
 *   - States: default, hover (`--eui-grey-100`), active (`--eui-grey-200`),
 *     selected (brand-softer tint). All handled in engine-ui.css.
 *
 * Rendered element:
 *   - `<button type="button">` by default — correct semantics for clickable
 *     menu items inside a popover; screen readers announce it as a button.
 *   - Polymorphic via `as` / `href`: pass `as="a"` + `href` to render an
 *     anchor (e.g. for "Recent searches" that deep-link).
 *
 * Keyboard:
 *   - Native <button>/<a> gives Enter/Space activation for free.
 *   - Arrow-key navigation between items is the *parent menu*'s concern,
 *     not this component's. When embedded in a Radix Menu the context
 *     handles it; when used ad-hoc, the caller adds it.
 *
 * Semantics (deliberate):
 *   - This is a VISUAL system pattern, not a semantic menu item. The
 *     component renders a plain <button> / <a> with no `role` override.
 *   - Callers attach `role` (and any matching `aria-*`) when the context
 *     actually is a menu, listbox, navigation, suggestion list, etc.
 *     Forcing `role="menuitem"` here would fake menu semantics wherever
 *     the item appears (filters, recent searches, navigation cards) and
 *     break real accessibility.
 *   - `selected` is ONLY a visual flag (applies `.eui-selected`). It does
 *     NOT map to `aria-pressed`, `aria-current`, or `aria-selected` — the
 *     correct ARIA depends entirely on the surrounding context, so the
 *     caller sets it explicitly via `...rest`.
 */

import * as React from "react";
import { cx } from "./tokens/cx";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

type CommonProps = {
  /** Icon content — usually a Lucide icon element, ~20px. */
  icon?: React.ReactNode;
  /** Primary label. Plain string to keep a11y clean. */
  title: string;
  /** Optional secondary line. Hidden when absent. */
  subtitle?: string;
  /**
   * Persistent visual "selected" state (a class only, not hover).
   * Applies `.eui-selected`. Does NOT set any ARIA attribute — the caller
   * passes the correct one (`aria-current`, `aria-pressed`, `aria-selected`)
   * via the spread props based on the surrounding semantic context.
   */
  selected?: boolean;
  /** Additional className merged after the `eui-popover-item` base. */
  className?: string;
};

type ButtonProps = CommonProps & {
  as?: "button";
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title" | "children">;

type AnchorProps = CommonProps & {
  as: "a";
  href: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "title" | "children">;

export type PopoverItemProps = ButtonProps | AnchorProps;

// ═══════════════════════════════════════════
// Implementation
// ═══════════════════════════════════════════

// className joiner: wspólny cx() z ./tokens/cx (Stage 2 governance)

/**
 * Type guard — narrows the discriminated union on `as`.
 */
function isAnchor(props: PopoverItemProps): props is AnchorProps {
  return props.as === "a";
}

export const PopoverItem = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  PopoverItemProps
>(function PopoverItem(props, ref) {
  const classes = cx(
    "eui-popover-item",
    props.selected && "eui-selected",
    props.className
  );

  const body = (
    <>
      {props.icon !== undefined && (
        <span className="eui-popover-item-icon" aria-hidden="true">
          {props.icon}
        </span>
      )}
      <span className="eui-popover-item-body">
        <span className="eui-popover-item-title">{props.title}</span>
        {props.subtitle && (
          <span className="eui-popover-item-subtitle">{props.subtitle}</span>
        )}
      </span>
    </>
  );

  if (isAnchor(props)) {
    const {
      as: _as,
      icon: _i,
      title: _t,
      subtitle: _s,
      selected: _sel,
      className: _c,
      ...anchorRest
    } = props;
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classes}
        {...anchorRest}
      >
        {body}
      </a>
    );
  }

  const {
    as: _as,
    icon: _i,
    title: _t,
    subtitle: _s,
    selected: _sel,
    className: _c,
    ...buttonRest
  } = props;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      className={classes}
      {...buttonRest}
    >
      {body}
    </button>
  );
});
