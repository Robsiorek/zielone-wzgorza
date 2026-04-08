"use client";

import React from "react";
import { Zap, CalendarPlus, Plus, UserPlus, FileUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { icon: CalendarPlus, label: "Nowa rezerwacja", color: "text-primary bg-primary/10 hover:bg-primary/15" },
  { icon: Plus, label: "Nowa oferta", color: "text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:hover:bg-amber-900/30" },
  { icon: UserPlus, label: "Nowy klient", color: "text-sky-600 bg-sky-50 hover:bg-sky-100 dark:text-sky-400 dark:bg-sky-900/20 dark:hover:bg-sky-900/30" },
  { icon: FileUp, label: "Nowy dokument", color: "text-violet-600 bg-violet-50 hover:bg-violet-100 dark:text-violet-400 dark:bg-violet-900/20 dark:hover:bg-violet-900/30" },
];

export function QuickActions() {
  return (
    <div className="bubble">
      <div className="p-5 pb-3">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <Zap className="h-4 w-4 text-muted-foreground" />
          Szybkie akcje
        </h3>
      </div>
      <div className="px-5 pb-5 grid grid-cols-2 gap-2.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label} className={cn("group flex items-center gap-2.5 rounded-xl p-3 text-left transition-all duration-150", action.color)}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-medium">{action.label}</span>
              <ArrowRight className="ml-auto h-3 w-3 opacity-0 transition-all group-hover:opacity-60" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
