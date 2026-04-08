"use client";

import React from "react";
import { Calendar, Moon } from "lucide-react";
import { BubbleDatePicker } from "@/components/ui/bubble-date-picker";
import { todayStr } from "@/lib/dates";

interface Props {
  startDate: string;
  endDate: string;
  nights: number;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
}

export function DatesSection({ startDate, endDate, nights, onStartDateChange, onEndDateChange }: Props) {
  const today = todayStr();

  return (
    <div className="space-y-5">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold">
        <Calendar className="h-4 w-4 text-primary" />
        Termin pobytu
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <BubbleDatePicker
          label="Przyjazd"
          value={startDate}
          onChange={onStartDateChange}
          min={today}
        />
        <BubbleDatePicker
          label="Wyjazd"
          value={endDate}
          onChange={onEndDateChange}
          min={startDate || today}
        />
      </div>
      {nights > 0 && (
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Moon className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">{nights}</span>
          {nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"}
        </div>
      )}
    </div>
  );
}
