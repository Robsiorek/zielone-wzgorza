/**
 * Email Service — SMTP transport with best-effort async delivery.
 *
 * E3: NOT a durable queue. Best-effort delivery:
 * - Request ends immediately (fire-and-forget via void)
 * - Retry max 3 attempts with 5s delay inside same process
 * - After PM2 restart pending emails are lost (acceptable on this stage)
 * - Durable queue (Bull/Redis) is future upgrade path
 *
 * Dry-run mode: EMAIL_DRY_RUN=true → logs to console, saves to EmailLog, does NOT send.
 * Same service, same renderer, same log — only provider execution differs.
 *
 * SMTP credentials from .env (secrets), business config from CompanySettings (DB).
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";
import { renderEmailTemplate, buildEmailVariables } from "@/lib/email-renderer";
import { DEFAULT_TEMPLATES, resolveLogoBlock } from "@/lib/email-templates-default";

// ── Types ──

type EmailType = "BOOKING_CONFIRMATION" | "PAYMENT_REMINDER" | "STATUS_CONFIRMED" | "STATUS_CANCELLED" | "TEST";
type TriggerSource = "SYSTEM" | "ADMIN_TEST" | "CRON";

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  type: EmailType;
  triggerSource?: TriggerSource;
  reservationId?: string;
}

// ── SMTP Transport (lazy init, singleton) ──

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("SMTP not configured: SMTP_HOST, SMTP_USER, SMTP_PASSWORD required in .env");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    // Timeouts
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
}

function isDryRun(): boolean {
  return process.env.EMAIL_DRY_RUN === "true";
}

// ── Core send function (with retry) ──

async function sendWithRetry(options: SendEmailOptions, maxAttempts: number = 3): Promise<void> {
  const { to, toName, subject, html, type, triggerSource = "SYSTEM", reservationId } = options;

  // Create EmailLog entry (PENDING)
  const log = await prisma.emailLog.create({
    data: {
      type,
      status: "PENDING",
      recipientEmail: to,
      recipientName: toName || null,
      subject,
      reservationId: reservationId || null,
      templateType: type,
      triggerSource,
      attempts: 0,
    },
  });

  // Load sender config from DB
  const settings = await prisma.companySettings.findFirst({
    select: { senderEmail: true, senderName: true },
  });
  const senderEmail = settings?.senderEmail || process.env.SMTP_USER || "noreply@zielonewzgorza.eu";
  const senderName = settings?.senderName || "Zielone Wzgórza";
  const from = `"${senderName}" <${senderEmail}>`;

  // Dry-run mode
  if (isDryRun()) {
    console.log(`[EMAIL DRY-RUN] To: ${to} | Subject: ${subject} | Type: ${type}`);
    console.log(`[EMAIL DRY-RUN] HTML length: ${html.length} chars`);
    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: "SENT",
        attempts: 1,
        sentAt: new Date(),
        lastAttemptAt: new Date(),
        errorMessage: "DRY_RUN: email logged but not sent",
      },
    });
    return;
  }

  // Real send with retry
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const transport = getTransporter();
      await transport.sendMail({
        from,
        to: toName ? `"${toName}" <${to}>` : to,
        replyTo: settings?.senderEmail || undefined,
        subject,
        html,
      });

      // Success
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "SENT",
          attempts: attempt,
          sentAt: new Date(),
          lastAttemptAt: new Date(),
          errorMessage: null,
        },
      });
      return;
    } catch (error: any) {
      const errMsg = error.message?.slice(0, 500) || "Unknown error";
      console.error(`[EMAIL] Attempt ${attempt}/${maxAttempts} failed for ${to}: ${errMsg}`);

      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: attempt >= maxAttempts ? "FAILED" : "PENDING",
          attempts: attempt,
          lastAttemptAt: new Date(),
          errorMessage: errMsg,
        },
      });

      // Wait before retry (not on last attempt)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

// ── Guard: validate email before sending ──

function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Load company + theme data for template rendering ──

async function loadCompanyData() {
  const settings = await prisma.companySettings.findFirst();
  return {
    companyName: settings?.companyName || "Zielone Wzgórza",
    senderName: settings?.senderName || "Zielone Wzgórza",
    phone: settings?.phone || null,
    email: settings?.email || null,
    bankAccountName: settings?.bankAccountName || "Zielone Wzgórza",
    bankAccountIban: settings?.bankAccountIban || "",
    bankName: settings?.bankName || "",
  };
}

async function loadThemeData() {
  try {
    const config = await prisma.widgetConfig.findUnique({ where: { id: "default" } });
    return {
      logoUrl: config?.logoUrl || null,
      primaryColor: config?.primaryColor || "#2563EB",
    };
  } catch {
    return { logoUrl: null, primaryColor: "#2563EB" };
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "https://dev.zielonewzgorza.eu";
}

// ── Render template with all data ──

async function renderEmail(
  type: EmailType,
  reservation: any,
  client: { firstName: string; lastName: string; email: string },
  extraVariables?: Record<string, string>,
): Promise<{ subject: string; html: string }> {
  const company = await loadCompanyData();
  const theme = await loadThemeData();
  const baseUrl = getBaseUrl();

  // Build standard variables
  const variables = buildEmailVariables(reservation, client, company, theme, baseUrl);

  // Add logo block (trusted HTML)
  variables.logo_block_html = renderEmailTemplate(
    resolveLogoBlock(theme.logoUrl),
    variables,
  );

  // Add extra variables if provided
  if (extraVariables) {
    Object.assign(variables, extraVariables);
  }

  // Get template: DB first → fallback to defaults
  let templateSubject: string;
  let templateBody: string;

  const dbTemplate = await prisma.emailTemplate.findUnique({
    where: { type: type as any },
  }).catch(() => null);

  if (dbTemplate) {
    templateSubject = dbTemplate.subject;
    templateBody = dbTemplate.bodyHtml;
  } else {
    const defaultTpl = DEFAULT_TEMPLATES[type];
    if (!defaultTpl) {
      throw new Error(`No template found for type: ${type}`);
    }
    templateSubject = defaultTpl.subject;
    templateBody = defaultTpl.bodyHtml;
  }

  return {
    subject: renderEmailTemplate(templateSubject, variables),
    html: renderEmailTemplate(templateBody, variables),
  };
}

// ═══════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════

export const emailService = {
  /**
   * Send booking confirmation email.
   * Called after successful POST /api/public/book (AFTER transaction).
   * Fire-and-forget: void return, does not block caller.
   */
  sendBookingConfirmation(
    reservation: any,
    client: { firstName: string; lastName: string; email: string },
  ): void {
    if (!isValidEmail(client.email)) {
      console.warn(`[EMAIL] Skipping BOOKING_CONFIRMATION: invalid email "${client.email}"`);
      return;
    }

    // Fire-and-forget — do not await
    void (async () => {
      try {
        const { subject, html } = await renderEmail("BOOKING_CONFIRMATION", reservation, client);
        await sendWithRetry({
          to: client.email,
          toName: `${client.firstName} ${client.lastName}`,
          subject,
          html,
          type: "BOOKING_CONFIRMATION",
          triggerSource: "SYSTEM",
          reservationId: reservation.id,
        });
      } catch (error) {
        console.error("[EMAIL] Failed to send BOOKING_CONFIRMATION:", error);
      }
    })();
  },

  /**
   * Send status change email (CONFIRMED or CANCELLED).
   * Called after admin confirms/cancels reservation.
   * Fire-and-forget.
   */
  sendStatusChange(
    reservation: any,
    client: { firstName: string; lastName: string; email: string },
    newStatus: "CONFIRMED" | "CANCELLED",
  ): void {
    if (!isValidEmail(client.email)) {
      console.warn(`[EMAIL] Skipping STATUS_${newStatus}: invalid email "${client.email}"`);
      return;
    }

    const type: EmailType = newStatus === "CONFIRMED" ? "STATUS_CONFIRMED" : "STATUS_CANCELLED";

    void (async () => {
      try {
        const { subject, html } = await renderEmail(type, reservation, client);
        await sendWithRetry({
          to: client.email,
          toName: `${client.firstName} ${client.lastName}`,
          subject,
          html,
          type,
          triggerSource: "SYSTEM",
          reservationId: reservation.id,
        });
      } catch (error) {
        console.error(`[EMAIL] Failed to send ${type}:`, error);
      }
    })();
  },

  /**
   * Send payment reminder email.
   * Called by cron job. NOT fire-and-forget (cron waits for result).
   */
  async sendPaymentReminder(
    reservation: any,
    client: { firstName: string; lastName: string; email: string },
  ): Promise<boolean> {
    if (!isValidEmail(client.email)) {
      console.warn(`[EMAIL] Skipping PAYMENT_REMINDER: invalid email "${client.email}"`);
      return false;
    }

    try {
      const { subject, html } = await renderEmail("PAYMENT_REMINDER", reservation, client);
      await sendWithRetry({
        to: client.email,
        toName: `${client.firstName} ${client.lastName}`,
        subject,
        html,
        type: "PAYMENT_REMINDER",
        triggerSource: "CRON",
        reservationId: reservation.id,
      });
      return true;
    } catch (error) {
      console.error("[EMAIL] Failed to send PAYMENT_REMINDER:", error);
      return false;
    }
  },

  /**
   * Send test email to verify SMTP configuration.
   * OWNER only. Synchronous (waits for result).
   */
  async sendTestEmail(toAddress: string): Promise<{ success: boolean; error?: string }> {
    if (!isValidEmail(toAddress)) {
      return { success: false, error: "Nieprawidłowy adres email" };
    }

    try {
      const company = await loadCompanyData();
      const theme = await loadThemeData();

      const variables: Record<string, string> = {
        company_name: company.companyName,
        company_email: company.email || "",
        company_phone: company.phone || "",
        primary_color: theme.primaryColor,
        logo_url: theme.logoUrl || "",
        current_year: String(new Date().getFullYear()),
      };

      // Add logo block
      variables.logo_block_html = renderEmailTemplate(
        resolveLogoBlock(theme.logoUrl),
        variables,
      );

      const template = DEFAULT_TEMPLATES.TEST;
      const subject = renderEmailTemplate(template.subject, variables);
      const html = renderEmailTemplate(template.bodyHtml, variables);

      await sendWithRetry({
        to: toAddress,
        subject,
        html,
        type: "TEST",
        triggerSource: "ADMIN_TEST",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message?.slice(0, 200) || "Nieznany błąd" };
    }
  },
};
