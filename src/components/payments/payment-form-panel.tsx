"use client";

/**
 * PaymentFormPanel — 3rd-level slide panel for adding payment/refund.
 *
 * C2: Opened from PaymentPanel. Back arrow returns to PaymentPanel.
 * Stack: Detail panel → PaymentPanel (history) → PaymentFormPanel (form)
 *
 * Back button: btn-icon-bubble h-10 w-10, placed BELOW title bar.
 */

import React from "react";
import { ArrowLeft } from "lucide-react";
import { SlidePanel } from "@/components/ui/slide-panel";
import { PaymentForm } from "./payment-form";
import type { PaymentMethodOption } from "./payment-types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Go back to PaymentPanel (not close all) */
  onBack: () => void;
  methodOptions: PaymentMethodOption[];
  onCreate: (body: Record<string, any>) => Promise<string>;
  loading?: boolean;
  userRole?: string;
}

export function PaymentFormPanel({ open, onClose, onBack, methodOptions, onCreate, loading, userRole }: Props) {
  return (
    <SlidePanel open={open} onClose={onClose} title="Nowa operacja" width={480}>
      {/* Back button — below title bar, DS: btn-icon-bubble h-10 w-10 */}
      <div className="mb-5">
        <button onClick={onBack} className="btn-icon-bubble h-10 w-10">
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <PaymentForm
        methodOptions={methodOptions}
        onCreate={onCreate}
        loading={loading}
        onSuccess={onBack}
        userRole={userRole}
      />
    </SlidePanel>
  );
}
