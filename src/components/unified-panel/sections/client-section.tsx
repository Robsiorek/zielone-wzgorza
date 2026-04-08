"use client";

import React from "react";
import { User, Search, X, Building2, Loader2 } from "lucide-react";
import type { ClientOption } from "../use-unified-form";

interface Props {
  selectedClient: ClientOption | null;
  onSelectClient: (c: ClientOption | null) => void;
  search: string;
  onSearchChange: (v: string) => void;
  results: ClientOption[];
  loading: boolean;
}

function clientDisplayName(c: ClientOption): string {
  if (c.type === "COMPANY") return c.companyName || "Bez nazwy";
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez nazwy";
}

export function ClientSection({ selectedClient, onSelectClient, search, onSearchChange, results, loading }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold">
        <User className="h-4 w-4 text-primary" />
        Klient
      </h3>

      {selectedClient ? (
        <div className="flex items-center gap-3 p-4 border-2 border-primary rounded-2xl bg-primary/5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {selectedClient.type === "COMPANY"
              ? <Building2 className="h-4 w-4 text-primary" />
              : <User className="h-4 w-4 text-primary" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate">{clientDisplayName(selectedClient)}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {[selectedClient.email, selectedClient.phone].filter(Boolean).join(" • ")}
            </div>
          </div>
          <button
            onClick={() => onSelectClient(null)}
            className="btn-icon-bubble h-8 w-8 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Szukaj klienta..."
            className="input-bubble h-11 w-full text-[13px]"
            style={{ paddingLeft: 38 }}
          />
          {search && (
            <button onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {loading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}

          {results.length > 0 && (
            <div className="absolute z-20 top-full mt-1.5 w-full bg-card border-2 border-border rounded-2xl py-1.5 px-1.5 max-h-[240px] overflow-y-auto fade-in-scale"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              {results.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onSelectClient(c); onSearchChange(""); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors rounded-xl flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {c.type === "COMPANY"
                      ? <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      : <User className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{clientDisplayName(c)}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {[c.email, c.phone].filter(Boolean).join(" • ")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
