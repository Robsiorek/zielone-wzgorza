"use client";

import React from "react";
import { FileText } from "lucide-react";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { BubbleDatePicker } from "@/components/ui/bubble-date-picker";

// ── Booking Details ──

const BOOKING_SOURCES = [
  { value: "PHONE", label: "Telefon" },
  { value: "EMAIL", label: "E-mail" },
  { value: "WALK_IN", label: "Na miejscu" },
  { value: "WEBSITE", label: "Strona www" },
  { value: "BOOKING_COM", label: "Booking.com" },
  { value: "OTHER", label: "Inne" },
];

const BOOKING_STATUSES = [
  { value: "CONFIRMED", label: "Potwierdzona" },
  { value: "NEW", label: "Nowa" },
  { value: "PENDING", label: "Oczekująca" },
];

interface BookingDetailsProps {
  source: string; onSourceChange: (v: string) => void;
  status: string; onStatusChange: (v: string) => void;
  guestNotes: string; onGuestNotesChange: (v: string) => void;
  internalNotes: string; onInternalNotesChange: (v: string) => void;
}

export function BookingDetailsSection({ source, onSourceChange, status, onStatusChange, guestNotes, onGuestNotesChange, internalNotes, onInternalNotesChange }: BookingDetailsProps) {
  return (
    <div className="space-y-5">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold">
        <FileText className="h-4 w-4 text-emerald-500" />
        Szczegóły rezerwacji
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <BubbleSelect label="Źródło" options={BOOKING_SOURCES} value={source} onChange={onSourceChange} />
        <BubbleSelect label="Status" options={BOOKING_STATUSES} value={status} onChange={onStatusChange} />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Uwagi gościa</label>
        <textarea value={guestNotes} onChange={e => onGuestNotesChange(e.target.value)}
          className="input-bubble w-full text-[13px] min-h-[80px] resize-y py-2.5" placeholder="Np. alergie, specjalne potrzeby..." />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Notatka wewnętrzna</label>
        <textarea value={internalNotes} onChange={e => onInternalNotesChange(e.target.value)}
          className="input-bubble w-full text-[13px] min-h-[80px] resize-y py-2.5" placeholder="Widoczna tylko dla personelu..." />
      </div>
    </div>
  );
}

// ── Offer Details ──

const OFFER_SOURCES = [
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefon" },
  { value: "SOCIAL", label: "Social media" },
  { value: "WEBSITE", label: "Strona www" },
  { value: "OTHER", label: "Inne" },
];

const EXPIRY_ACTIONS = [
  { value: "CANCEL", label: "Automatycznie anuluj" },
  { value: "NEEDS_ATTENTION", label: "Oznacz do przeglądu" },
];

interface OfferDetailsProps {
  source: string; onSourceChange: (v: string) => void;
  note: string; onNoteChange: (v: string) => void;
  expiresAt: string; onExpiresAtChange: (v: string) => void;
  expiryAction: string; onExpiryActionChange: (v: string) => void;
}

export function OfferDetailsSection({ source, onSourceChange, note, onNoteChange, expiresAt, onExpiresAtChange, expiryAction, onExpiryActionChange }: OfferDetailsProps) {
  return (
    <div className="space-y-5">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold">
        <FileText className="h-4 w-4 text-blue-500" />
        Szczegóły oferty
      </h3>
      <BubbleSelect label="Źródło zapytania" options={OFFER_SOURCES} value={source} onChange={onSourceChange} />
      <div className="grid grid-cols-2 gap-4">
        <BubbleDatePicker label="Ważność oferty" value={expiresAt} onChange={onExpiresAtChange} />
        <BubbleSelect label="Po wygaśnięciu" options={EXPIRY_ACTIONS} value={expiryAction} onChange={onExpiryActionChange} />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Notatka wewnętrzna</label>
        <textarea value={note} onChange={e => onNoteChange(e.target.value)}
          className="input-bubble w-full text-[13px] min-h-[80px] resize-y py-2.5" placeholder="Widoczna tylko dla personelu..." />
      </div>
    </div>
  );
}

// ── Block Details ──

interface BlockDetailsProps {
  label: string; onLabelChange: (v: string) => void;
  note: string; onNoteChange: (v: string) => void;
}

export function BlockDetailsSection({ label, onLabelChange, note, onNoteChange }: BlockDetailsProps) {
  return (
    <div className="space-y-5">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold">
        <FileText className="h-4 w-4 text-slate-500" />
        Szczegóły blokady
      </h3>
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa</label>
        <input type="text" value={label} onChange={e => onLabelChange(e.target.value)}
          className="input-bubble h-11 w-full text-[13px]" placeholder="Np. Obozy letnie 2026" />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Notatka</label>
        <textarea value={note} onChange={e => onNoteChange(e.target.value)}
          className="input-bubble w-full text-[13px] min-h-[80px] resize-y py-2.5" placeholder="Opcjonalna notatka..." />
      </div>
    </div>
  );
}
