/**
 * POST /api/settings/email/preview
 *
 * E3b: Renders email template with example data for live preview.
 * Two modes:
 * - Draft mode: body contains { type, subject, bodyHtml } → renders provided HTML
 * - Saved mode: body contains { type } only → renders from DB or default
 *
 * Auth: OWNER+. No save. No send. No side effects.
 * Response: { subject, html }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { renderEmailTemplate, buildEmailVariables } from "@/lib/email-renderer";
import { DEFAULT_TEMPLATES, resolveLogoBlock } from "@/lib/email-templates-default";

const VALID_TYPES = ["BOOKING_CONFIRMATION", "PAYMENT_REMINDER", "STATUS_CONFIRMED", "STATUS_CANCELLED", "TEST"];

// Demo data for preview — consistent, realistic
const DEMO_RESERVATION = {
  number: "ZW-2026-DEMO",
  checkIn: new Date("2026-07-15"),
  checkOut: new Date("2026-07-18"),
  nights: 3,
  adults: 2,
  children: 1,
  totalMinor: 135000, // 1350 zł
  requiredDepositMinor: 40500, // 405 zł
  status: "PENDING",
  guestNotes: "Proszę o dodatkowe łóżko dla dziecka.",
  items: [
    { resource: { name: "Domek Hobbitów nr 3" } },
  ],
  bookingDetails: { token: "demo-preview-token-abc123" },
};

const DEMO_CLIENT = {
  firstName: "Jan",
  lastName: "Kowalski",
  email: "jan.kowalski@example.com",
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const body = await request.json();
    const type = body.type?.toUpperCase();

    if (!type || !VALID_TYPES.includes(type)) {
      return apiError("Nieprawidłowy typ szablonu", 400, "INVALID_TYPE");
    }

    // Determine subject + bodyHtml source
    let subjectTemplate: string;
    let bodyHtmlTemplate: string;

    if (body.subject && body.bodyHtml) {
      // Draft mode — use provided HTML (from editor, unsaved)
      if (body.bodyHtml.length > 100000) {
        return apiError("Treść HTML jest za długa (max 100KB)");
      }
      subjectTemplate = body.subject;
      bodyHtmlTemplate = body.bodyHtml;
    } else {
      // Saved mode — read from DB or default
      const custom = await prisma.emailTemplate.findUnique({
        where: { type: type as any },
      });
      const defaultTpl = DEFAULT_TEMPLATES[type];

      subjectTemplate = custom?.subject || defaultTpl?.subject || type;
      bodyHtmlTemplate = custom?.bodyHtml || defaultTpl?.bodyHtml || "<p>Brak szablonu</p>";
    }

    // Load company + theme for rendering
    const settings = await prisma.companySettings.findFirst();
    const company = {
      companyName: settings?.companyName || "Zielone Wzgórza",
      senderName: settings?.senderName || "Zielone Wzgórza",
      phone: settings?.phone || "+48 733 078 601",
      email: settings?.email || "kontakt@zielonewzgorza.eu",
      bankAccountName: settings?.bankAccountName || "Zielone Wzgórza",
      bankAccountIban: settings?.bankAccountIban || "89 1090 1102 0000 0001 5948 7356",
      bankName: settings?.bankName || "Santander Bank Polska",
    };

    let theme = { logoUrl: null as string | null, primaryColor: "#2563EB" };
    try {
      const config = await prisma.widgetConfig.findUnique({ where: { id: "default" } });
      if (config) {
        theme = { logoUrl: config.logoUrl, primaryColor: config.primaryColor };
      }
    } catch {}

    const baseUrl = process.env.BASE_URL || "https://dev.zielonewzgorza.eu";

    // Build variables with demo data
    const demoRes = type === "STATUS_CONFIRMED"
      ? { ...DEMO_RESERVATION, status: "CONFIRMED" }
      : type === "STATUS_CANCELLED"
        ? { ...DEMO_RESERVATION, status: "CANCELLED" }
        : DEMO_RESERVATION;

    const variables = buildEmailVariables(demoRes, DEMO_CLIENT, company, theme, baseUrl);

    // Add logo block
    variables.logo_block_html = renderEmailTemplate(
      resolveLogoBlock(theme.logoUrl),
      variables,
    );

    // Render
    const renderedSubject = renderEmailTemplate(subjectTemplate, variables);
    const renderedHtml = renderEmailTemplate(bodyHtmlTemplate, variables);

    return apiSuccess({ subject: renderedSubject, html: renderedHtml });
  } catch (error) {
    return apiServerError(error);
  }
}
