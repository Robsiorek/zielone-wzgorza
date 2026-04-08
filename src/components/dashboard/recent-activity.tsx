"use client";

import React from "react";
import { Activity, UserPlus, BookOpen, CreditCard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  { id: "1", icon: UserPlus, color: "text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-900/20", title: "System gotowy", desc: "Panel administracyjny został uruchomiony", time: "Teraz" },
  { id: "2", icon: BookOpen, color: "text-primary bg-primary/10", title: "Moduł rezerwacji", desc: "Przygotowany do implementacji", time: "Wkrótce" },
  { id: "3", icon: CreditCard, color: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20", title: "Moduł płatności", desc: "Przygotowany do implementacji", time: "Wkrótce" },
  { id: "4", icon: FileText, color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20", title: "Moduł dokumentów", desc: "Przygotowany do implementacji", time: "Wkrótce" },
];

export function RecentActivity() {
  return (
    <div className="bubble">
      <div className="p-5 pb-3">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Ostatnia aktywność
        </h3>
      </div>
      <div className="px-5 pb-5 space-y-3">
        {activities.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="flex items-start gap-3">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", a.color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{a.desc}</p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
