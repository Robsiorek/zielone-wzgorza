"use client";

/**
 * Select — single-select dropdown (engine-ui Part 10b)
 *
 * Single-value select with desktop Popover + mobile BottomSheet (Stage 2).
 * Mirrors TextField's tri-mode API: compound (inside Field) | standalone
 * (label/helperText/error props) | bare (no chrome).
 *
 * A11y pattern (greenfield — first listbox/option in engine-ui):
 *   - Trigger: <button aria-haspopup="listbox" aria-expanded aria-controls>
 *   - List:    <ul role="listbox" aria-activedescendant tabindex=-1>
 *   - Option:  <li role="option" aria-selected>
 *   - Highlight: aria-activedescendant (NIE roving tabindex)
 *   - Focus on listbox itself when open; options NOT focusable directly.
 *
 * Keyboard:
 *   On trigger: ArrowUp/Down/Enter/Space/Home/End → open + initial highlight
 *   On listbox: ArrowUp/Down/Home/End → move highlight
 *               Enter/Space → commit, close, return focus to trigger
 *               Escape     → close without commit (Radix returns focus)
 *               Tab        → close (focus naturally moves past)
 *
 * Controlled/uncontrolled mirror TextField (value > defaultValue; cannot mix).
 *
 * Sizes / states / error styling parity with TextField input frame.
 */

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../primitives/Popover";
import { Chevron } from "../nav/Chevron";
import { BottomSheet } from "../overlay/BottomSheet";
import { useIsMobile } from "../hooks/useIsMobile";
import { Field, FieldLabel, FieldControl, FieldMessage } from "./Field";
import { useFieldContext } from "./useFieldContext";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional leading icon — rendered in a PopoverItem-style envelope.
   *  When absent, no empty envelope is shown (title aligns flush left). */
  icon?: React.ReactNode;
  /** Optional secondary line under the label (PopoverItem subtitle). */
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: ReadonlyArray<SelectOption>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;

  // Self-contained convenience (used in standalone mode only)
  label?: string;
  helperText?: string;
  error?: string;

  // States / identity
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  size?: SelectSize;

  // Aria forwards (FieldControl injects these in compound mode)
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-label"?: string;

  // Class hooks
  className?: string;
  triggerClassName?: string;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

/** Find next non-disabled option index. dir=1 forward, dir=-1 backward. Wraps. */
function findNextEnabled(
  options: ReadonlyArray<SelectOption>,
  start: number,
  dir: 1 | -1
): number {
  const len = options.length;
  if (len === 0) return -1;
  let idx = start;
  for (let i = 0; i < len; i++) {
    idx = (idx + dir + len) % len;
    if (!options[idx].disabled) return idx;
  }
  return -1; // all disabled
}

/** First non-disabled option, scanning from start in dir direction (no wrap). */
function findFirstEnabled(
  options: ReadonlyArray<SelectOption>,
  start: number,
  dir: 1 | -1
): number {
  const len = options.length;
  for (let idx = start; idx >= 0 && idx < len; idx += dir) {
    if (!options[idx].disabled) return idx;
  }
  return -1;
}

// ═══════════════════════════════════════════
// SelectInner — trigger + popover content.
// Receives all aria/id/disabled props (FieldControl injects in compound mode).
// ═══════════════════════════════════════════

type SelectInnerProps = Omit<SelectProps, "label" | "helperText" | "error">;

const SelectInner = React.forwardRef<HTMLButtonElement, SelectInnerProps>(
  function SelectInner(props, ref) {
    const {
      options,
      value: valueProp,
      defaultValue,
      onChange,
      placeholder = "Wybierz...",
      disabled,
      // `required` is injected by FieldControl for parity with TextField/Textarea
      // contract, but has no semantic effect on a <button> trigger. We discard
      // it; `aria-required` carries the actual semantic.
      required: _required,
      name,
      id,
      size = "md",
      "aria-describedby": ariaDescribedBy,
      "aria-required": ariaRequired,
      "aria-invalid": ariaInvalid,
      "aria-label": ariaLabel,
      className,
      triggerClassName,
    } = props;

    // ── Controlled vs uncontrolled value ──
    const isControlled = valueProp !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState<
      string | undefined
    >(defaultValue);
    const value = isControlled ? valueProp : uncontrolledValue;

    // ── Open state ──
    const [open, setOpen] = React.useState(false);

    // ── Highlighted index for keyboard navigation ──
    const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

    // ── ID set (trigger + listbox) ──
    const generatedId = React.useId();
    const triggerId = id ?? `select-${generatedId}`;
    const listboxId = `${triggerId}-listbox`;

    const selectedIdx = React.useMemo(
      () => (value === undefined ? -1 : options.findIndex((o) => o.value === value)),
      [options, value]
    );

    const listboxRef = React.useRef<HTMLUListElement>(null);

    // ── On open: focus listbox + set initial highlight ──
    React.useEffect(() => {
      if (!open) return;
      const initial =
        selectedIdx >= 0 && !options[selectedIdx].disabled
          ? selectedIdx
          : findFirstEnabled(options, 0, 1);
      setHighlightedIndex(initial);
      // Focus listbox so keyboard events route to it; aria-activedescendant
      // tracks the virtual cursor without moving DOM focus per-option.
      const raf = requestAnimationFrame(() => {
        listboxRef.current?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }, [open, selectedIdx, options]);

    const commitValue = (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onChange?.(next);
      setOpen(false);
    };

    // ── Trigger keyboard: open + initial highlight by key ──
    const handleTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowDown":
        case "Enter":
        case " ": // Space
          e.preventDefault();
          setOpen(true);
          break;
        case "ArrowUp":
          e.preventDefault();
          setOpen(true);
          break;
        case "Home":
          e.preventDefault();
          setOpen(true);
          break;
        case "End":
          e.preventDefault();
          setOpen(true);
          break;
      }
    };

    // ── Listbox keyboard navigation ──
    const handleListboxKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = findNextEnabled(options, highlightedIndex, 1);
          if (next >= 0) setHighlightedIndex(next);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = findNextEnabled(options, highlightedIndex, -1);
          if (prev >= 0) setHighlightedIndex(prev);
          break;
        }
        case "Home": {
          e.preventDefault();
          const first = findFirstEnabled(options, 0, 1);
          if (first >= 0) setHighlightedIndex(first);
          break;
        }
        case "End": {
          e.preventDefault();
          const last = findFirstEnabled(options, options.length - 1, -1);
          if (last >= 0) setHighlightedIndex(last);
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          const opt = options[highlightedIndex];
          if (opt && !opt.disabled) commitValue(opt.value);
          break;
        }
        case "Escape":
          // Radix handles close on Escape too — both run, idempotent.
          e.preventDefault();
          setOpen(false);
          break;
        case "Tab":
          // Close on Tab; Radix returns focus to trigger, native Tab proceeds.
          setOpen(false);
          break;
      }
    };

    const selectedOption =
      value === undefined ? undefined : options.find((o) => o.value === value);

    const wrapperClasses = [
      "eui-select-wrap",
      `eui-select-wrap-${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const triggerClasses = [
      "eui-select-trigger",
      `eui-select-trigger-${size}`,
      selectedOption === undefined && "eui-select-trigger-placeholder",
      triggerClassName,
    ]
      .filter(Boolean)
      .join(" ");

    // Mobile / desktop branching per architect D4.
    // Halt-safety note: Radix Dialog (BottomSheet underlying) installs a focus
    // trap. With our listbox tabindex=-1 + non-focusable <li>, there are NO
    // tabbable elements inside the dialog — Tab inside the open sheet does
    // nothing (focus stays on dialog body). Users dismiss via tap-outside,
    // Escape, or swipe — adequate mobile UX. If this proves problematic in
    // production usage, defer mobile to 10c per architect D6.
    const isMobile = useIsMobile();

    // Trigger button — onClick differs per path:
    //   - Mobile: explicit toggle (no Radix wrapping the button)
    //   - Desktop: no onClick — Radix PopoverTrigger asChild composes its own
    //     click handler. Adding ours would double-toggle (both run via Slot
    //     composeEventHandlers; the functional updates cancel out).
    const triggerInner = (
      <>
        <span className="eui-select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          className="eui-select-chevron"
          data-open={open ? "true" : undefined}
          aria-hidden="true"
        >
          <Chevron direction="down" size={18} />
        </span>
      </>
    );

    const commonTriggerProps = {
      ref,
      type: "button" as const,
      id: triggerId,
      name,
      disabled,
      className: triggerClasses,
      "aria-haspopup": "listbox" as const,
      "aria-expanded": open,
      "aria-controls": open ? listboxId : undefined,
      "aria-describedby": ariaDescribedBy,
      "aria-required": ariaRequired,
      "aria-invalid": ariaInvalid,
      "aria-label": ariaLabel,
      onKeyDown: handleTriggerKey,
    };

    const listboxNode = (
      <ul
        ref={listboxRef}
        id={listboxId}
        role="listbox"
        tabIndex={-1}
        className="eui-select-listbox"
        aria-activedescendant={
          highlightedIndex >= 0
            ? `${listboxId}-opt-${highlightedIndex}`
            : undefined
        }
        aria-labelledby={ariaLabel ? undefined : triggerId}
        aria-label={ariaLabel}
        onKeyDown={handleListboxKey}
      >
        {options.map((opt, idx) => {
          const isHighlighted = idx === highlightedIndex;
          // Reuse PopoverItem visual system. selected/disabled drive off
          // aria-* attributes (CSS [aria-selected]/[aria-disabled]); only
          // keyboard highlight needs an explicit class.
          const optClasses = [
            "eui-popover-item",
            isHighlighted && "eui-highlighted",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li
              key={opt.value}
              id={`${listboxId}-opt-${idx}`}
              role="option"
              aria-selected={opt.value === value}
              aria-disabled={opt.disabled || undefined}
              className={optClasses}
              onClick={() => {
                if (!opt.disabled) commitValue(opt.value);
              }}
              onMouseEnter={() => {
                if (!opt.disabled) setHighlightedIndex(idx);
              }}
            >
              {opt.icon !== undefined && (
                <span className="eui-popover-item-icon" aria-hidden="true">
                  {opt.icon}
                </span>
              )}
              <span className="eui-popover-item-body">
                <span className="eui-popover-item-title">{opt.label}</span>
                {opt.description && (
                  <span className="eui-popover-item-subtitle">
                    {opt.description}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );

    if (isMobile) {
      return (
        <div className={wrapperClasses}>
          <button
            {...commonTriggerProps}
            onClick={() => setOpen((prev) => !prev)}
          >
            {triggerInner}
          </button>
          <BottomSheet
            open={open}
            onOpenChange={setOpen}
            height="auto"
            labelledBy={triggerId}
            showDragHandle
            swipeToDismiss
            closeOnEscape
            closeOnOutsideClick
            className="eui-select-bottomsheet"
          >
            {listboxNode}
          </BottomSheet>
        </div>
      );
    }

    return (
      <div className={wrapperClasses}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button {...commonTriggerProps}>{triggerInner}</button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={4}
            className="eui-select-content"
          >
            {listboxNode}
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

SelectInner.displayName = "SelectInner";

// ═══════════════════════════════════════════════════════════════════════════
// Select — public orchestrator.
// Mode detection mirrors TextField:
//   1. inside Field (consumer-wrapped) → render inner directly,
//      consumer's FieldControl injects id/aria-* on inner button
//   2. standalone (label/helperText/error set, no outer Field) →
//      wrap in internal Field+FieldLabel+FieldControl+FieldMessage
//   3. bare (no Field, no chrome props) → render inner directly
// ═══════════════════════════════════════════════════════════════════════════

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  function Select(props, ref) {
    const { label, helperText, error, ...innerProps } = props;

    const ctx = useFieldContext();
    const insideField = ctx !== null;
    const wantsSelfChrome =
      !insideField &&
      (label !== undefined ||
        helperText !== undefined ||
        error !== undefined);

    if (wantsSelfChrome) {
      const messageContent = error ?? helperText;
      const messageVariant: "error" | "default" =
        error !== undefined ? "error" : "default";

      return (
        <Field
          id={innerProps.id}
          required={innerProps.required}
          disabled={innerProps.disabled}
          invalid={error !== undefined}
        >
          {label !== undefined && <FieldLabel>{label}</FieldLabel>}
          <FieldControl>
            <SelectInner {...innerProps} ref={ref} />
          </FieldControl>
          {messageContent !== undefined && (
            <FieldMessage variant={messageVariant}>
              {messageContent}
            </FieldMessage>
          )}
        </Field>
      );
    }

    return <SelectInner {...innerProps} ref={ref} />;
  }
);
