"use client";

/**
 * SegmentedControl — pill-shaped tab switcher (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Two or more options in a rounded container with a sliding highlight
 * indicator that animates between active options. Airbnb-style toggle.
 *
 * Used by: DatePickerTabs ("Dokładne" / "Elastyczne"), future filters.
 *
 * The indicator is a real DOM element (not a pseudo-element) so we can
 * drive its position via inline `transform: translateX(...)` and let CSS
 * handle the smooth transition. Width is calculated per-option.
 */

import * as React from "react";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  /** Extra className on the root. */
  className?: string;
}

// ═══════════════════════════════════════════
// Component
// ═══════════════════════════════════════════

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({});

  // Measure the active button and position the indicator over it.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const activeIdx = options.findIndex((o) => o.value === value);
    if (activeIdx < 0) return;

    const buttons = root.querySelectorAll<HTMLButtonElement>(
      ".eui-segmented-option"
    );
    const activeBtn = buttons[activeIdx];
    if (!activeBtn) return;

    const rootRect = root.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    setIndicatorStyle({
      width: btnRect.width,
      transform: `translateX(${btnRect.left - rootRect.left}px)`,
    });
  }, [value, options]);

  const rootClass = ["eui-segmented-control", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={rootClass} role="tablist">
      {/* Sliding indicator — sits behind the buttons */}
      <div className="eui-segmented-indicator" style={indicatorStyle} />

      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={[
            "eui-segmented-option",
            opt.value === value && "eui-segmented-active",
          ]
            .filter(Boolean)
            .join(" ")}
          role="tab"
          aria-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
