"use client";

/**
 * PaymentPanel — Slide panel Rozliczenia (2nd level).
 *
 * C2 (Master Plan 147): Summary kafle + pełna historia + CTA otwiera PaymentFormPanel.
 * Stack: Detail panel → PaymentPanel (history) → PaymentFormPanel (form)
 *
 * Back button: btn-icon-bubble h-10 w-10 (same as client details page),
 * placed BELOW title bar inside content area.
 *
 * IMPORTANT: Parent must always render this component (not conditional),
 * passing open={true/false} to allow closing animation.
 */

import React, { useState } from "react";
import { Loader2, Plus, ArrowLeft, BarChart3, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlidePanel } from "@/components/ui/slide-panel";
import { useReservationPayments } from "./use-reservation-payments";
import { PaymentSummary } from "./payment-summary";
import { PaymentList } from "./payment-list";
import { PaymentFormPanel } from "./payment-form-panel";

interface Props {
  reservationId: string | null;
  open: boolean;
  onClose: () => void;
  /** Called after any mutation (for parent to refresh) */
  onMutate?: () => void;
}

export function PaymentPanel({ reservationId, open, onClose, onMutate }: Props) {
  const {
    payments, summary, methodOptions, userRole,
    loading, actionLoading,
    refresh, create, confirm, reject,
  } = useReservationPayments(open ? reservationId : null);

  const [formPanelOpen, setFormPanelOpen] = useState(false);

  const handleConfirm = async (paymentId: string) => {
    const result = await confirm(paymentId);
    onMutate?.();
    return result;
  };

  const handleReject = async (paymentId: string, reason?: string) => {
    await reject(paymentId, reason);
    onMutate?.();
  };

  const handleCreate = async (body: Record<string, any>) => {
    const id = await create(body);
    onMutate?.();
    return id;
  };

  return (
    <>
      <SlidePanel open={open} onClose={onClose} title="Rozliczenia" width={520}>
        {/* Back button — below title bar, DS: btn-icon-bubble h-10 w-10 */}
        <div className="mb-5">
          <button onClick={onClose} className="btn-icon-bubble h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {loading && !summary ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : summary ? (
          <div className="space-y-6 pb-6">
            {/* Summary section */}
            <div>
              <PanelSH icon={BarChart3}>Podsumowanie</PanelSH>
              <PaymentSummary summary={summary} />
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Payment list (full, grouped) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <PanelSH icon={Clock} noPad>Historia płatności</PanelSH>
                <span className="text-[11px] text-muted-foreground">
                  {payments.length} {payments.length === 1 ? "operacja" : payments.length < 5 ? "operacje" : "operacji"}
                </span>
              </div>
              <PaymentList
                payments={payments}
                actionLoading={actionLoading}
                onConfirm={handleConfirm}
                onReject={handleReject}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* CTA: open form panel (primary blue) */}
            <button
              onClick={() => setFormPanelOpen(true)}
              className="btn-bubble btn-primary-bubble w-full h-11 text-[13px] font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Dodaj wpłatę / zwrot
            </button>
          </div>
        ) : (
          <div className="text-center text-[13px] text-muted-foreground py-8">
            Brak danych do wyświetlenia
          </div>
        )}
      </SlidePanel>

      {/* 3rd level: Payment form panel — always rendered for animation */}
      <PaymentFormPanel
        open={formPanelOpen}
        onClose={() => setFormPanelOpen(false)}
        onBack={() => setFormPanelOpen(false)}
        methodOptions={methodOptions}
        onCreate={handleCreate}
        loading={actionLoading === "create"}
        userRole={userRole}
      />
    </>
  );
}

/** Section header — matches UnifiedPanel pattern exactly */
function PanelSH({ children, icon: Icon, noPad }: { children: React.ReactNode; icon: React.ElementType; noPad?: boolean }) {
  return (
    <h3 className={cn("flex items-center gap-2 text-[14px] font-semibold", !noPad && "mb-3")}>
      <Icon className="h-4 w-4 text-primary" />
      {children}
    </h3>
  );
}
