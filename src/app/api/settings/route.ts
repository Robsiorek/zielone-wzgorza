/**
 * GET  /api/settings — Get all CompanySettings (= GlobalSettings from Master Plan)
 * PATCH /api/settings — Update CompanySettings (OWNER only)
 *
 * D0: Master Plan 156, 158
 * Validates paymentMethodsConfig schema before save.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

// ── Validation helpers ──

const VALID_METHODS = ["CASH", "TRANSFER", "TERMINAL", "CARD", "ONLINE", "BLIK", "OTHER"];

interface PaymentMethodEntry {
  method: string;
  isActive: boolean;
  availableForAdmin: boolean;
  availableForWidget: boolean;
  availableForOnline: boolean;
  requiresConfirmation: boolean;
  displayName: string;
  sortOrder: number;
}

function validatePaymentMethodsConfig(config: any): string | null {
  if (!Array.isArray(config)) return "paymentMethodsConfig musi być tablicą";
  if (config.length === 0) return "Lista metod płatności nie może być pusta";

  for (let i = 0; i < config.length; i++) {
    const m = config[i];
    if (!m || typeof m !== "object") return `Metoda [${i}]: nieprawidłowy obiekt`;
    if (!m.method || !VALID_METHODS.includes(m.method)) return `Metoda [${i}]: nieprawidłowa metoda "${m.method}"`;
    if (typeof m.isActive !== "boolean") return `Metoda [${i}]: isActive musi być boolean`;
    if (typeof m.availableForAdmin !== "boolean") return `Metoda [${i}]: availableForAdmin musi być boolean`;
    if (!m.displayName || typeof m.displayName !== "string") return `Metoda [${i}]: displayName jest wymagana`;
    if (typeof m.sortOrder !== "number") return `Metoda [${i}]: sortOrder musi być liczbą`;
  }

  // Check at least one active method for admin
  const hasActiveAdmin = config.some((m: PaymentMethodEntry) => m.isActive && m.availableForAdmin);
  if (!hasActiveAdmin) return "Przynajmniej jedna metoda płatności musi być aktywna dla admina";

  return null; // valid
}

// ══════════════════════════════════════════════════════════════════════
// GET — All settings
// ══════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();

    const settings = await prisma.companySettings.findFirst();
    return apiSuccess({ settings });
  } catch (error) {
    return apiServerError(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
// PATCH — Update settings (OWNER only)
// ══════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden("Tylko właściciel może edytować ustawienia");

    const body = await request.json();
    const updateData: any = {};

    // ── Payment methods config ──
    if (body.paymentMethodsConfig !== undefined) {
      const validationError = validatePaymentMethodsConfig(body.paymentMethodsConfig);
      if (validationError) return apiError(validationError);
      updateData.paymentMethodsConfig = body.paymentMethodsConfig;
    }

    // ── Deposit rule ──
    if (body.requiredDepositPercent !== undefined) {
      const pct = Number(body.requiredDepositPercent);
      if (isNaN(pct) || pct < 0 || pct > 100) return apiError("Procent depozytu musi być między 0 a 100");
      updateData.requiredDepositPercent = pct;
    }

    // ── Check-in / Check-out times ──
    if (body.checkInTime !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(body.checkInTime)) return apiError("Godzina zameldowania musi być w formacie HH:MM");
      updateData.checkInTime = body.checkInTime;
    }
    if (body.checkOutTime !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(body.checkOutTime)) return apiError("Godzina wymeldowania musi być w formacie HH:MM");
      updateData.checkOutTime = body.checkOutTime;
    }

    // ── Payment deadline ──
    if (body.paymentDeadlineHours !== undefined) {
      const h = Number(body.paymentDeadlineHours);
      if (isNaN(h) || h < 1 || h > 720) return apiError("Termin płatności musi być między 1 a 720 godzin");
      updateData.paymentDeadlineHours = h;
    }

    // ── Overdue notification ──
    if (body.overdueNotificationHours !== undefined) {
      const h = Number(body.overdueNotificationHours);
      if (isNaN(h) || h < 1 || h > 168) return apiError("Powiadomienie o zaległości: 1–168 godzin");
      updateData.overdueNotificationHours = h;
    }

    // ── Company info ──
    const stringFields = ["companyName", "legalName", "nip", "regon", "address", "city", "postalCode", "phone", "email", "website"];
    for (const f of stringFields) {
      if (body[f] !== undefined) updateData[f] = body[f]?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) return apiError("Brak pól do aktualizacji");

    const settings = await prisma.companySettings.update({
      where: { id: "default" },
      data: updateData,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: "SETTINGS_UPDATED",
        entity: "CompanySettings",
        entityId: "default",
        changes: { fields: Object.keys(updateData), updatedBy: auth.user.email },
      },
    });

    return apiSuccess({ settings });
  } catch (error) {
    return apiServerError(error);
  }
}
