"use client";

/**
 * useReservationPayments — shared hook for payment data + actions.
 *
 * C2: Single source of truth. Used by PaymentPanel, calendar-detail-panel,
 *     reservation-detail. Handles fetch, cache, create, confirm, reject.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-fetch";
import type { PaymentRow, PaymentSummaryData, PaymentMethodOption } from "./payment-types";

interface UseReservationPaymentsResult {
  payments: PaymentRow[];
  summary: PaymentSummaryData | null;
  methodOptions: PaymentMethodOption[];
  userRole: string;
  loading: boolean;
  error: string | null;
  /** Re-fetch payments + summary */
  refresh: () => Promise<void>;
  /** Create a new payment. Returns payment ID or throws. */
  create: (body: Record<string, any>) => Promise<string>;
  /** Confirm PENDING → CONFIRMED. Returns true if auto-confirmed reservation. */
  confirm: (paymentId: string) => Promise<{ autoConfirmed: boolean }>;
  /** Reject PENDING → REJECTED */
  reject: (paymentId: string, reason?: string) => Promise<void>;
  /** Action in progress (paymentId or "create") */
  actionLoading: string | null;
}

export function useReservationPayments(reservationId: string | null): UseReservationPaymentsResult {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<PaymentSummaryData | null>(null);
  const [methodOptions, setMethodOptions] = useState<PaymentMethodOption[]>([]);
  const [userRole, setUserRole] = useState<string>("RECEPTION");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  // ── Fetch ──
  const refresh = useCallback(async () => {
    if (!reservationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/reservations/${reservationId}/payments`);
      setPayments(data.payments || []);
      setSummary(data.summary || null);
      fetchedRef.current = reservationId;
    } catch (err: any) {
      setError(err?.message || "Błąd ładowania płatności");
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  // ── Load method options (from CompanySettings) ──
  const loadMethods = useCallback(async () => {
    try {
      const data = await apiFetch("/api/settings/payment-methods");
      setMethodOptions(data.methods || []);
    } catch {
      setMethodOptions([
        { method: "CASH", isActive: true, availableForAdmin: true, requiresConfirmation: false, displayName: "Gotówka", sortOrder: 0 },
        { method: "TRANSFER", isActive: true, availableForAdmin: true, requiresConfirmation: true, displayName: "Przelew bankowy", sortOrder: 1 },
        { method: "TERMINAL", isActive: true, availableForAdmin: true, requiresConfirmation: false, displayName: "Terminal płatniczy", sortOrder: 2 },
        { method: "CARD", isActive: true, availableForAdmin: true, requiresConfirmation: false, displayName: "Karta", sortOrder: 3 },
        { method: "OTHER", isActive: true, availableForAdmin: true, requiresConfirmation: true, displayName: "Inna", sortOrder: 6 },
      ]);
    }
  }, []);

  // ── Load current user role (D0) ──
  const loadUserRole = useCallback(async () => {
    try {
      const data = await apiFetch("/api/auth/me");
      setUserRole(data.user?.role || "RECEPTION");
    } catch {
      setUserRole("RECEPTION");
    }
  }, []);

  // Auto-fetch on mount / reservationId change
  useEffect(() => {
    if (reservationId && fetchedRef.current !== reservationId) {
      refresh();
      loadMethods();
      loadUserRole();
    }
  }, [reservationId, refresh, loadMethods, loadUserRole]);

  // ── Create payment ──
  const create = useCallback(async (body: Record<string, any>): Promise<string> => {
    if (!reservationId) throw new Error("Brak ID rezerwacji");
    setActionLoading("create");
    try {
      const data = await apiFetch(`/api/reservations/${reservationId}/payments`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      await refresh();
      return data.payment.id;
    } finally {
      setActionLoading(null);
    }
  }, [reservationId, refresh]);

  // ── Confirm ──
  const confirm = useCallback(async (paymentId: string): Promise<{ autoConfirmed: boolean }> => {
    setActionLoading(paymentId);
    try {
      const data = await apiFetch(`/api/payments/${paymentId}/confirm`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await refresh();
      return { autoConfirmed: data.autoConfirmed || false };
    } finally {
      setActionLoading(null);
    }
  }, [refresh]);

  // ── Reject ──
  const reject = useCallback(async (paymentId: string, reason?: string): Promise<void> => {
    setActionLoading(paymentId);
    try {
      await apiFetch(`/api/payments/${paymentId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason || null }),
      });
      await refresh();
    } finally {
      setActionLoading(null);
    }
  }, [refresh]);

  return {
    payments, summary, methodOptions, userRole,
    loading, error,
    refresh, create, confirm, reject,
    actionLoading,
  };
}
