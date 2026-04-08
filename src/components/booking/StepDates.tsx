"use client";

import React, { useState } from "react";
import { Users, Minus, Plus, Search } from "lucide-react";
import { BubbleRangePicker } from "@/components/ui/bubble-range-picker";
import type { BookingDates } from "./BookingWidget";

interface Props {
  initial: BookingDates;
  onSubmit: (dates: BookingDates) => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getDefaultCheckout(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
}

export function StepDates({ initial, onSubmit }: Props) {
  const [checkIn, setCheckIn] = useState(initial.checkIn || getTomorrow());
  const [checkOut, setCheckOut] = useState(initial.checkOut || getDefaultCheckout());
  const [adults, setAdults] = useState(initial.adults || 2);
  const [children, setChildren] = useState(initial.children || 0);
  const [error, setError] = useState("");

  const nights = nightsBetween(checkIn, checkOut);
  const today = new Date().toISOString().split("T")[0];

  function handleRangeChange(ci: string, co: string) {
    setCheckIn(ci);
    setCheckOut(co);
    setError("");
  }

  function handleSubmit() {
    setError("");
    if (!checkIn || !checkOut) {
      setError("Wybierz daty przyjazdu i wyjazdu");
      return;
    }
    if (nights <= 0) {
      setError("Data wyjazdu musi być po dacie przyjazdu");
      return;
    }
    if (nights > 60) {
      setError("Maksymalnie 60 nocy");
      return;
    }
    if (adults < 1) {
      setError("Minimum 1 osoba dorosła");
      return;
    }
    onSubmit({ checkIn, checkOut, adults, children });
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Zarezerwuj pobyt
        </h1>
        <p className="text-[14px] text-muted-foreground max-w-md mx-auto">
          Wybierz termin i liczbę gości, aby sprawdzić dostępność naszych domków i pokoi
        </p>
      </div>

      {/* Date range — single calendar */}
      <div className="bg-card rounded-2xl border-2 border-border overflow-visible">
        <div className="p-5" style={{ overflow: "visible" }}>
          <BubbleRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={handleRangeChange}
            min={today}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Guests */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Users className="h-4 w-4 text-primary" />
            Goście
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium">Dorośli</p>
                <p className="text-[11px] text-muted-foreground">18 lat i więcej</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  disabled={adults <= 1}
                  className="h-9 w-9 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:hover:border-border disabled:hover:text-current"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-[16px] font-bold w-6 text-center">{adults}</span>
                <button
                  onClick={() => setAdults(Math.min(20, adults + 1))}
                  className="h-9 w-9 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium">Dzieci</p>
                <p className="text-[11px] text-muted-foreground">0–17 lat</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  disabled={children <= 0}
                  className="h-9 w-9 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:hover:border-border disabled:hover:text-current"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-[16px] font-bold w-6 text-center">{children}</span>
                <button
                  onClick={() => setChildren(Math.min(10, children + 1))}
                  className="h-9 w-9 rounded-xl border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-[13px] px-4 py-3 rounded-xl text-center font-medium">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        style={{ height: 52 }}
      >
        <Search className="h-5 w-5" />
        Szukaj dostępnych
      </button>
    </div>
  );
}
