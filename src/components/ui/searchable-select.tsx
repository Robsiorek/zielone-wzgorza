"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = search ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(""); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {label && <div className="text-[12px] font-semibold text-muted-foreground mb-1.5">{label}</div>}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-2xl border bg-card px-4 text-[13px] transition-all duration-200",
          open ? "border-primary ring-2 ring-primary/10" : "hover:border-muted-foreground/25"
        )}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground/60"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ease-out-expo", open && "rotate-180")} />
      </button>
      {open && (
        <div className="dropdown-bubble" style={{ left: 0, top: "calc(100% + 6px)", width: "100%", maxHeight: 260, overflowY: "auto" }}>
          {searchable && (
            <div className="flex items-center gap-2 px-3 pb-2 mb-1.5 border-b">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text" placeholder="Szukaj..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/50"
                autoFocus
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
      )}
    </div>
  );
}
