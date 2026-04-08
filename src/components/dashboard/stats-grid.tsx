"use client";

import React from "react";
import { BookOpen, Tag, Users, CreditCard, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { title: "Rezerwacje", value: "0", icon: BookOpen, color: "text-primary bg-primary/10" },
  { title: "Aktywne oferty", value: "0", icon: Tag, color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20" },
  { title: "Klienci", value: "0", icon: Users, color: "text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-900/20" },
  { title: "Przychód", value: "0 PLN", icon: CreditCard, color: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20" },
];

export function StatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.title} className="bubble p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[11px] text-muted-foreground">vs. ost. mies.</span>
                </div>
              </div>
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", stat.color)}>
                <Icon className="h-[18px] w-[18px]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
