"use client";

import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useFloating, offset, flip, shift, size,
  useClick, useDismiss, useInteractions,
  autoUpdate, FloatingPortal,
} from "@floating-ui/react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface BubbleSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function BubbleSelect({ options, value, onChange, placeholder = "Wybierz...", label, className }: BubbleSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    middleware: [
      offset(6),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, { width: `${rects.reference.width}px` });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
  ]);

  return (
    <div className={className}>
      {label && <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">{label}</label>}
      <button
        type="button"
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl border bg-card px-4 text-[13px] transition-all duration-200 outline-none",
          open ? "border-primary ring-2 ring-primary/10" : "hover:border-muted-foreground/25",
          !selected && "text-muted-foreground/60"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selected?.icon}
          <span className={selected ? "text-foreground" : "text-muted-foreground/60"}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 99999 }}
            {...getFloatingProps()}
          >
            <div
              className="rounded-2xl bg-card p-1.5"
              style={{
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 8px 32px hsl(220 15% 12% / 0.1), 0 4px 8px hsl(220 15% 12% / 0.04)",
                animation: "scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) both",
                transformOrigin: "top",
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-150 text-left",
                    opt.value === value
                      ? "bg-primary/8 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{opt.label}</span>
                    {opt.sublabel && <span className="block text-[11px] text-muted-foreground/60 truncate">{opt.sublabel}</span>}
                  </div>
                  {opt.value === value && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
