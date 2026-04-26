"use client";

/**
 * Pressable — canonical interactive surface (engine-ui).
 * See JSDoc in blueprint for full documentation.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useFocusVisible, usePress, useHover } from "../hooks";
import { mergeRefs } from "../a11y/mergeRefs";
import { CURSOR, type Cursor } from "../tokens/interaction";

export type PressableState = {
  isHovered: boolean;
  isPressed: boolean;
  isFocusVisible: boolean;
  isDisabled: boolean;
  isLoading: boolean;
};

export interface PressableProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "disabled"
  > {
  as?: "button" | "a" | "div" | "span";
  asChild?: boolean;
  children?:
    | React.ReactNode
    | ((state: PressableState) => React.ReactNode);
  disabled?: boolean;
  loading?: boolean;
  cursor?: Cursor;
  disablePressScale?: boolean;
  disableFocusRing?: boolean;
  "aria-pressed"?: boolean | "true" | "false" | "mixed";
  "aria-selected"?: boolean | "true" | "false";
  href?: string;
  target?: string;
  rel?: string;
  onPressStart?: () => void;
  onPressEnd?: () => void;
}

export const Pressable = React.forwardRef<HTMLElement, PressableProps>(
  function Pressable(
    {
      as = "button",
      asChild = false,
      children,
      disabled,
      loading,
      cursor = "pointer",
      disablePressScale = false,
      disableFocusRing = false,
      className: classNameProp,
      style: styleProp,
      onPressStart,
      onPressEnd,
      href,
      target,
      rel,
      type,
      ...rest
    },
    ref
  ) {
    const { isFocusVisible, focusProps } = useFocusVisible<HTMLElement>();
    const { isPressed, pressProps } = usePress({
      disabled: !!disabled || !!loading,
      onPressStart,
      onPressEnd,
    });
    const { isHovered, hoverProps } = useHover({
      disabled: !!disabled || !!loading,
    });

    const mergedRef = mergeRefs(ref, focusProps.ref);

    // Compose className
    const className = [
      "eui-pressable",
      isFocusVisible && !disableFocusRing && "eui-focus-ring",
      disabled && "eui-disabled",
      loading && "eui-loading",
      classNameProp,
    ]
      .filter(Boolean)
      .join(" ");

    // Compose style — cursor + press scale + GPU layer for jitter-free text
    const style: React.CSSProperties = {
      cursor: disabled
        ? CURSOR.notAllowed
        : loading
        ? CURSOR.wait
        : CURSOR[cursor] || CURSOR.pointer,
      transform:
        isPressed && !disablePressScale && !disabled
          ? "scale(0.97)"
          : "scale(1)",
      transition: `transform ${isPressed ? "100ms" : "180ms"} cubic-bezier(0.2, 0, 0, 1)`,
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
      willChange: isPressed ? "transform" : undefined,
      ...styleProp,
    };

    // State for function-as-child
    const state: PressableState = {
      isHovered,
      isPressed,
      isFocusVisible,
      isDisabled: !!disabled,
      isLoading: !!loading,
    };

    // Render children
    const renderedChildren =
      typeof children === "function" ? children(state) : children;

    // Merge event handlers
    const mergedProps = {
      ref: mergedRef,
      className,
      style,
      onFocus: focusProps.onFocus,
      onBlur: focusProps.onBlur,
      ...pressProps,
      ...hoverProps,
      ...rest,
    };

    // asChild mode — use Radix Slot
    if (asChild) {
      return <Slot {...mergedProps}>{renderedChildren}</Slot>;
    }

    // Polymorphic rendering
    if (as === "a") {
      const linkProps: Record<string, unknown> = {
        ...mergedProps,
        href: disabled ? undefined : href,
        target: disabled ? undefined : target,
        rel: disabled ? undefined : rel,
      };
      if (disabled) {
        linkProps.role = "link";
        linkProps["aria-disabled"] = true;
      }
      return React.createElement("a", linkProps, renderedChildren);
    }

    if (as === "div" || as === "span") {
      const containerProps: Record<string, unknown> = {
        ...mergedProps,
        role: "button",
        tabIndex: disabled ? -1 : 0,
      };
      if (disabled) {
        containerProps["aria-disabled"] = true;
      }
      return React.createElement(as, containerProps, renderedChildren);
    }

    // Default: button
    const buttonProps: Record<string, unknown> = {
      ...mergedProps,
      type: type || "button",
    };
    if (loading) {
      // Loading: keep interactive for a11y but block pointer events via CSS
      buttonProps["aria-disabled"] = true;
    } else if (disabled) {
      buttonProps.disabled = true;
      buttonProps["aria-disabled"] = true;
    }

    return React.createElement("button", buttonProps, renderedChildren);
  }
);
