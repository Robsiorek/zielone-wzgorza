"use client";

/**
 * ButtonGroup + ToggleButton — with sliding indicator (engine-ui).
 * ────────────────────────────────────────────────────────────────────────
 * Toggle variant uses a sliding pill indicator (like SegmentedControl)
 * measured via useLayoutEffect + offsetLeft/offsetWidth.
 */

import * as React from "react";
import { Pressable } from "../interaction/Pressable";

export type ButtonGroupVariant = "separated" | "joined" | "toggle";
export type ButtonGroupOrientation = "horizontal" | "vertical";
export type ButtonGroupSize = "sm" | "md" | "lg";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ButtonGroupVariant;
  orientation?: ButtonGroupOrientation;
  size?: ButtonGroupSize;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export interface ToggleButtonProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
}

// ── Context ──

interface ButtonGroupContextValue {
  variant: ButtonGroupVariant;
  size: ButtonGroupSize;
  value?: string;
  onValueChange?: (value: string) => void;
}

const ButtonGroupContext = React.createContext<ButtonGroupContextValue | null>(null);

function useButtonGroup() {
  return React.useContext(ButtonGroupContext);
}

// ── ButtonGroup ──

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup(
    {
      variant = "separated",
      orientation = "horizontal",
      size = "md",
      value,
      onValueChange,
      children,
      className: classNameProp,
      onKeyDown,
      ...rest
    },
    ref
  ) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({
      opacity: 0,
    });
    const [animated, setAnimated] = React.useState(false);

    // Measure active button and position indicator
    React.useLayoutEffect(() => {
      if (variant !== "toggle" || !containerRef.current || !value) return;

      const activeBtn = containerRef.current.querySelector<HTMLElement>(
        `[data-value="${value}"]`
      );
      if (!activeBtn) return;

      setIndicatorStyle({
        transform: `translateX(${activeBtn.offsetLeft}px)`,
        width: activeBtn.offsetWidth,
        opacity: 1,
      });
    }, [variant, value]);

    // Enable transitions after first paint to prevent slide from (0,0)
    React.useEffect(() => {
      if (variant !== "toggle") return;
      const timer = setTimeout(() => setAnimated(true), 16);
      return () => clearTimeout(timer);
    }, [variant]);

    const className = [
      "eui-button-group",
      `eui-button-group-${variant}`,
      `eui-button-group-orient-${orientation}`,
      `eui-button-group-size-${size}`,
      animated && "eui-button-group-animated",
      classNameProp,
    ]
      .filter(Boolean)
      .join(" ");

    // Keyboard nav for toggle: Left/Right move focus
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (variant !== "toggle") return;

      const isHorizontal = orientation === "horizontal";
      const prev = isHorizontal ? "ArrowLeft" : "ArrowUp";
      const next = isHorizontal ? "ArrowRight" : "ArrowDown";

      if (e.key !== prev && e.key !== next) return;

      const root = e.currentTarget;
      const buttons = Array.from(
        root.querySelectorAll<HTMLElement>("[data-value]")
      ).filter((el) => !el.hasAttribute("disabled"));

      if (buttons.length === 0) return;

      const current = buttons.findIndex((el) => el === document.activeElement);
      let nextIndex: number;

      if (e.key === next) {
        nextIndex = current < buttons.length - 1 ? current + 1 : 0;
      } else {
        nextIndex = current > 0 ? current - 1 : buttons.length - 1;
      }

      buttons[nextIndex]?.focus();
      e.preventDefault();
    };

    const contextValue: ButtonGroupContextValue = {
      variant,
      size,
      value,
      onValueChange,
    };

    // Merge refs
    const mergedRef = (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    return (
      <ButtonGroupContext.Provider value={contextValue}>
        <div
          ref={mergedRef}
          className={className}
          role={variant === "toggle" ? "group" : undefined}
          onKeyDown={handleKeyDown}
          {...rest}
        >
          {/* Sliding indicator for toggle */}
          {variant === "toggle" && (
            <span
              className="eui-toggle-indicator"
              style={indicatorStyle}
              aria-hidden="true"
            />
          )}
          {children}
        </div>
      </ButtonGroupContext.Provider>
    );
  }
);

// ── ToggleButton ──

export function ToggleButton({
  value,
  children,
  disabled = false,
  iconLeft,
  iconRight,
  className: classNameProp,
}: ToggleButtonProps): React.ReactElement {
  const group = useButtonGroup();
  const isActive = group?.value === value;
  const size = group?.size ?? "md";

  const className = [
    "eui-pressable",
    "eui-toggle-button",
    `eui-button-size-${size}`,
    isActive && "eui-toggle-button-active",
    classNameProp,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    if (!disabled) {
      group?.onValueChange?.(value);
    }
  };

  return (
    <Pressable
      as="button"
      type="button"
      disabled={disabled}
      aria-pressed={isActive}
      data-value={value}
      className={className}
      onClick={handleClick}
      disablePressScale
    >
      {iconLeft && <span className="eui-button-icon-left">{iconLeft}</span>}
      <span className="eui-button-label">{children}</span>
      {iconRight && <span className="eui-button-icon-right">{iconRight}</span>}
    </Pressable>
  );
}
