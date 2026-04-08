"use client";

import React, { useState } from "react";
import {
  BookOpen, Tag, Users, CreditCard, TrendingUp, TrendingDown,
  CalendarDays, ChevronLeft, ChevronRight,
  ArrowRight, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Stats cards
const stats = [
  { title: "Rezerwacje", value: "0", trend: "+0%", up: true, icon: BookOpen, color: "text-primary bg-primary/10" },
  { title: "Aktywne oferty", value: "0", trend: "+0%", up: true, icon: Tag, color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30" },
  { title: "Klienci", value: "0", trend: "+0%", up: true, icon: Users, color: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30" },
  { title: "Przychód", value: "0 PLN", trend: "+0%", up: true, icon: CreditCard, color: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30" },
];

// Chart bars (placeholder)
const chartBars = [35, 55, 40, 70, 65, 80, 45, 60, 75, 50, 85, 70];
const months = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

// Occupancy
const occupancy = [
  { name: "Domki", total: 10, occupied: 0, color: "bg-primary" },
  { name: "Pokoje", total: 4, occupied: 0, color: "bg-emerald-500" },
  { name: "Sala eventowa", total: 1, occupied: 0, color: "bg-amber-500" },
  { name: "Restauracja", total: 1, occupied: 0, color: "bg-violet-500" },
];

export function DashboardContent({ firstName }: { firstName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Dzień dobry" : hour < 18 ? "Cześć" : "Dobry wieczór";
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  return (
    <div className="space-y-6 fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{greeting}, {firstName}</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {today.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]">
          <Plus className="h-4 w-4" /> Nowa rezerwacja
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bubble-interactive p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground">{s.title}</p>
                  <p className="text-[24px] font-bold tracking-tight mt-1.5">{s.value}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                      s.up ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                      {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {s.trend}
                    </div>
                    <span className="text-[11px] text-muted-foreground/60">vs ost. mies.</span>
                  </div>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", s.color)}>
                  <Icon className="h-[20px] w-[20px]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Middle row: Chart + Occupancy ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <div className="bubble p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[14px] font-semibold">Rezerwacje w tym roku</h3>
            <div className="flex gap-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" /> Rezerwacje
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2.5 h-[150px]">
            {chartBars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-xl bg-primary/10 relative overflow-hidden" style={{ height: `${h}%` }}>
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-xl bg-primary transition-all duration-700 ease-out-expo"
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-[9px] font-medium text-muted-foreground/60">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Occupancy */}
        <div className="bubble p-6">
          <h3 className="text-[14px] font-semibold mb-5">Obłożenie dziś</h3>
          <div className="space-y-5">
            {occupancy.map((o) => {
              const pct = o.total > 0 ? Math.round((o.occupied / o.total) * 100) : 0;
              return (
                <div key={o.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium">{o.name}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">{o.occupied}/{o.total}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700 ease-out-expo", o.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom row: Today's reservations + Mini calendar ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's reservations */}
        <div className="bubble p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[14px] font-semibold">Rezerwacje na dziś</h3>
            <button className="text-[12px] text-primary font-semibold hover:underline inline-flex items-center gap-1">
              Zobacz wszystkie <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="text-center py-10">
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-[13px] font-medium text-muted-foreground">Brak rezerwacji na dziś</p>
            <p className="text-[11px] text-muted-foreground/50 mt-1">Nowe rezerwacje pojawią się tutaj</p>
          </div>
        </div>

        {/* Mini calendar */}
        <div className="bubble p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold">
              {new Date(calYear, calMonth).toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}
                className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}
                className="h-8 w-8 inline-flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <MiniCalendar month={calMonth} year={calYear} />
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({ month, year }: { month: number; year: number }) {
  const days = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1.5">
        {days.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/40 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((d, i) => {
          const isToday = isCurrentMonth && d === today.getDate();
          return (
            <div key={i} className={cn(
              "h-8 flex items-center justify-center rounded-xl text-[11px] font-medium transition-all duration-200",
              d ? "cursor-pointer hover:bg-muted" : "",
              isToday ? "bg-primary text-primary-foreground font-bold shadow-bubble-blue" : d ? "text-foreground" : ""
            )}>
              {d || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
