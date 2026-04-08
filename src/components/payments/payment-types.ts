/**
 * Payment UI types, labels, and configuration.
 *
 * C2: Shared between PaymentSummary, PaymentList, PaymentForm, PaymentPanel,
 *     calendar-detail-panel, reservation-detail.
 */

// ── Types ──

export interface PaymentRow {
  id: string;
  kind: "CHARGE" | "REFUND" | "ADJUSTMENT" | null;
  direction: "IN" | "OUT" | null;
  paymentStatus: "PENDING" | "CONFIRMED" | "REJECTED" | "FAILED" | "CANCELLED" | null;
  method: string;
  amountMinor: number;
  currency: string;
  occurredAt: string | null;
  referenceNumber: string | null;
  note: string | null;
  createdAt: string;
  createdSource: string | null;
  confirmedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  linkedPaymentId: string | null;
  createdByUser: { id: string; firstName: string; lastName: string } | null;
  confirmedByUser: { id: string; firstName: string; lastName: string } | null;
  rejectedByUser: { id: string; firstName: string; lastName: string } | null;
}

export interface PaymentSummaryData {
  totalMinor: number;
  paidAmountMinor: number;
  balanceDueMinor: number;
  overpaidAmountMinor: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  pendingCount: number;
  confirmedCount: number;
  requiredDepositMinor: number;
  depositMet: boolean;
}

export interface PaymentMethodOption {
  method: string;
  isActive: boolean;
  availableForAdmin: boolean;
  requiresConfirmation: boolean;
  displayName: string;
  sortOrder: number;
}

// ── Kind labels & icons ──

export const KIND_LABELS: Record<string, string> = {
  CHARGE: "Wpłata",
  REFUND: "Zwrot",
  ADJUSTMENT: "Korekta",
};

export const KIND_COLORS: Record<string, string> = {
  CHARGE: "text-emerald-600 dark:text-emerald-400",
  REFUND: "text-red-600 dark:text-red-400",
  ADJUSTMENT: "text-blue-600 dark:text-blue-400",
};

// ── Direction labels ──

export const DIRECTION_LABELS: Record<string, string> = {
  IN: "Przychód",
  OUT: "Rozchód",
};

// ── Status config ──

export interface StatusConfig {
  label: string;
  cls: string;
  dotCls: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: {
    label: "Oczekująca",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    dotCls: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Potwierdzona",
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    dotCls: "bg-emerald-500",
  },
  REJECTED: {
    label: "Odrzucona",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dotCls: "bg-red-500",
  },
  FAILED: {
    label: "Nieudana",
    cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    dotCls: "bg-gray-500",
  },
  CANCELLED: {
    label: "Anulowana",
    cls: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
    dotCls: "bg-gray-400",
  },
};

// ── Method labels ──

export const METHOD_LABELS: Record<string, string> = {
  CASH: "Gotówka",
  TRANSFER: "Przelew",
  TERMINAL: "Terminal",
  CARD: "Karta",
  ONLINE: "Online",
  BLIK: "BLIK",
  OTHER: "Inna",
  // Legacy
  BANK_TRANSFER: "Przelew",
};

// ── Payment status on reservation ──

export const RES_PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  UNPAID: { label: "Nieopłacona", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  PARTIAL: { label: "Częściowo", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  PAID: { label: "Opłacona", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

// ── Helpers ──

export function formatPaymentDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatActorName(user: { firstName: string; lastName: string } | null): string {
  if (!user) return "System";
  return [user.firstName, user.lastName].filter(Boolean).join(" ");
}
