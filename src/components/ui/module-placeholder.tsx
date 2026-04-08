"use client";

import React from "react";
import { Construction } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  features?: string[];
}

export function ModulePlaceholder({ title, description, features = [] }: ModulePlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] fade-in-up">
      <div className="w-full max-w-lg text-center bubble p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
          <Construction className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-3 text-xl font-bold tracking-tight">{title}</h2>
        <p className="mb-6 text-[13px] text-muted-foreground leading-relaxed">{description}</p>
        {features.length > 0 && (
          <div className="mb-6 space-y-2.5 text-left">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        )}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
          Moduł w przygotowaniu
        </div>
      </div>
    </div>
  );
}
