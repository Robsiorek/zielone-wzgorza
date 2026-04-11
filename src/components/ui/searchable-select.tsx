"use client";

import React, { useState, useRef } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useFloating, offset, flip, shift, size,
  useClick, useDismiss, useInteractions,
  autoUpdate, FloatingPortal,
} from "@floating-ui/react";

interface Option { value: string; label: string; }

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder = "Wybierz...", label, searchable = true }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search input without scrolling page
  React.useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus({ preventScroll: true });
    }
  }, [open, searchable]);

  const selected = options.find((o) => o.value === value);
  const filtered = search ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options;

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (v) => { setOpen(v); if (!v) setSearch(""); },
    placement: "bottom-start",
    strategy: "fixed",
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
    <div>
      {label && <div className="text-[12px] font-semibold text-muted-foreground mb-1.5">{label}</div>}
      <button
        type="button"
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl border bg-card px-4 text-[13px] transition-all duration-200",
          open ? "border-primary ring-2 ring-primary/10" : "hover:border-muted-foreground/25"
        )}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground/60"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ease-out-expo", open && "rotate-180")} />
      </button>
      {open && (
        <FloatingPortal>
          {/* Outer: Floating UI positioning */}
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 99999 }}
            {...getFloatingProps()}
          >
            {/* Inner: visual styling (no position: absolute — Floating UI handles it) */}
            <div
              className="bg-card rounded-2xl p-1.5"
              style={{
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                animation: "scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
                transformOrigin: "top",
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {searchable && (
                <div className="flex items-center gap-2 px-3 pb-2 mb-1.5 border-b">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text" placeholder="Szukaj..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-muted-foreground">Brak wyników</div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                    className={cn(
                      "dropdown-item",
                      opt.value === value && "bg-primary/8 text-primary font-medium"
                    )}
                  >
                    {opt.label}
                    {opt.value === value && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
