/**
 * Default Email Templates — built-in HTML templates for all email types.
 *
 * E3: Used as fallback when no custom EmailTemplate exists in DB.
 * All templates use {{placeholder}} syntax rendered by email-renderer.ts.
 *
 * Design: clean, responsive, inline CSS (email clients ignore <style>).
 * Structure: logo → content → bank details (if applicable) → CTA → footer.
 */

export interface DefaultTemplate {
  subject: string;
  bodyHtml: string;
}

// ── Shared wrapper ──

function wrapTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

<!-- Logo -->
<tr><td style="padding:28px 32px 16px 32px;text-align:center;">
{{logo_block_html}}
</td></tr>

<!-- Content -->
<tr><td style="padding:0 32px 28px 32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
<p style="margin:0 0 8px 0;font-size:13px;color:#334155;font-weight:600;">Masz pytania?</p>
<p style="margin:0;font-size:12px;color:#64748b;">
{{company_phone}}&nbsp;&nbsp;&middot;&nbsp;&nbsp;{{company_email}}
</p>
<p style="margin:12px 0 0 0;font-size:11px;color:#94a3b8;">&copy; {{current_year}} {{company_name}}</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Bank details block (reused in confirmation and reminder) ──

const BANK_DETAILS_BLOCK = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin:20px 0;">
<tr><td style="padding:20px;">
<p style="margin:0 0 4px 0;font-size:11px;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Wymagana zaliczka</p>
<p style="margin:0 0 16px 0;font-size:28px;font-weight:800;color:#1e293b;text-align:center;">{{deposit}}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:8px 0;font-size:11px;color:#64748b;border-bottom:1px solid #fde68a;">Odbiorca</td>
<td style="padding:8px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;border-bottom:1px solid #fde68a;">{{bank_account_name}}</td>
</tr>
<tr>
<td style="padding:8px 0;font-size:11px;color:#64748b;border-bottom:1px solid #fde68a;">Nr konta</td>
<td style="padding:8px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;border-bottom:1px solid #fde68a;">{{bank_account_iban}}</td>
</tr>
<tr>
<td style="padding:8px 0;font-size:11px;color:#64748b;border-bottom:1px solid #fde68a;">Bank</td>
<td style="padding:8px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;border-bottom:1px solid #fde68a;">{{bank_name}}</td>
</tr>
<tr>
<td style="padding:8px 0;font-size:11px;color:#64748b;">Tytuł przelewu</td>
<td style="padding:8px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{transfer_title}}</td>
</tr>
</table>
</td></tr>
</table>`;

// ── Logo block (dynamic — shows image or text) ──

const LOGO_BLOCK_WITH_IMAGE = `<img src="{{logo_url}}" alt="{{company_name}}" style="max-height:48px;max-width:200px;" />`;
const LOGO_BLOCK_TEXT = `<p style="margin:0;font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-0.5px;">{{company_name}}</p>`;

// ═══════════════════════════════════════════
// 1. BOOKING CONFIRMATION
// ═══════════════════════════════════════════

const BOOKING_CONFIRMATION: DefaultTemplate = {
  subject: "Potwierdzenie rezerwacji {{reservation_number}} — {{company_name}}",
  bodyHtml: wrapTemplate(`
<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">Rezerwacja przyjęta</h1>
<p style="margin:0 0 24px 0;font-size:14px;color:#64748b;text-align:center;">
Twoja rezerwacja <strong style="color:{{primary_color}};">{{reservation_number}}</strong> została złożona.
</p>

<!-- Details card -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;margin-bottom:16px;">
<tr><td style="padding:20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:4px 0;font-size:12px;color:#64748b;">Przyjazd</td>
<td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{check_in}}</td>
</tr>
<tr>
<td style="padding:4px 0;font-size:12px;color:#64748b;">Wyjazd</td>
<td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{check_out}}</td>
</tr>
<tr>
<td style="padding:4px 0;font-size:12px;color:#64748b;">Noce</td>
<td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{nights}}</td>
</tr>
<tr>
<td style="padding:4px 0;font-size:12px;color:#64748b;">Goście</td>
<td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{adults}} dor.{{children}}</td>
</tr>
</table>
</td></tr>
</table>

<!-- Resources -->
<p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Zakwaterowanie</p>
{{resources_list_html}}

<!-- Total -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:2px solid #e2e8f0;padding-top:12px;">
<tr>
<td style="padding:4px 0;font-size:14px;color:#1e293b;font-weight:800;">Łącznie</td>
<td style="padding:4px 0;font-size:14px;color:#1e293b;font-weight:800;text-align:right;">{{total}}</td>
</tr>
</table>

<!-- Bank details -->
${BANK_DETAILS_BLOCK}

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px 0;">
<tr><td align="center">
<a href="{{reservation_url}}" style="display:inline-block;padding:14px 32px;background-color:{{primary_color}};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;">
Zobacz swoją rezerwację
</a>
</td></tr>
</table>
`),
};

// ═══════════════════════════════════════════
// 2. PAYMENT REMINDER
// ═══════════════════════════════════════════

const PAYMENT_REMINDER: DefaultTemplate = {
  subject: "Przypomnienie o wpłacie — rezerwacja {{reservation_number}}",
  bodyHtml: wrapTemplate(`
<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">Przypomnienie o wpłacie</h1>
<p style="margin:0 0 24px 0;font-size:14px;color:#64748b;text-align:center;">
Twoja rezerwacja <strong style="color:{{primary_color}};">{{reservation_number}}</strong> oczekuje na wpłatę zaliczki.
</p>

<!-- Dates reminder -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;margin-bottom:16px;">
<tr><td style="padding:16px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="font-size:12px;color:#64748b;">Termin</td>
<td style="font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{check_in}} — {{check_out}}</td>
</tr>
</table>
</td></tr>
</table>

<!-- Bank details -->
${BANK_DETAILS_BLOCK}

<p style="margin:16px 0;font-size:13px;color:#64748b;text-align:center;">
Prosimy o wpłatę w najbliższym możliwym terminie, aby potwierdzić rezerwację.
</p>

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px 0;">
<tr><td align="center">
<a href="{{reservation_url}}" style="display:inline-block;padding:14px 32px;background-color:{{primary_color}};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;">
Szczegóły rezerwacji
</a>
</td></tr>
</table>
`),
};

// ═══════════════════════════════════════════
// 3. STATUS CONFIRMED
// ═══════════════════════════════════════════

const STATUS_CONFIRMED: DefaultTemplate = {
  subject: "Rezerwacja {{reservation_number}} potwierdzona — {{company_name}}",
  bodyHtml: wrapTemplate(`
<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#16a34a;text-align:center;">Rezerwacja potwierdzona</h1>
<p style="margin:0 0 24px 0;font-size:14px;color:#64748b;text-align:center;">
Twoja rezerwacja <strong style="color:#1e293b;">{{reservation_number}}</strong> została potwierdzona. Dziękujemy za wpłatę!
</p>

<!-- Details -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
<tr><td style="padding:20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:4px 0;font-size:12px;color:#64748b;">Przyjazd</td>
<td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{check_in}}</td>
</tr>
<tr>
<td style="padding:4px 0;font-size:12px;color:#64748b;">Wyjazd</td>
<td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{check_out}}</td>
</tr>
<tr>
<td style="padding:4px 0;font-size:12px;color:#64748b;">Zakwaterowanie</td>
<td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{resources_list_html}}</td>
</tr>
</table>
</td></tr>
</table>

<p style="margin:20px 0;font-size:14px;color:#1e293b;text-align:center;font-weight:600;">
Do zobaczenia!
</p>

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 8px 0;">
<tr><td align="center">
<a href="{{reservation_url}}" style="display:inline-block;padding:14px 32px;background-color:{{primary_color}};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;">
Szczegóły rezerwacji
</a>
</td></tr>
</table>
`),
};

// ═══════════════════════════════════════════
// 4. STATUS CANCELLED
// ═══════════════════════════════════════════

const STATUS_CANCELLED: DefaultTemplate = {
  subject: "Rezerwacja {{reservation_number}} anulowana — {{company_name}}",
  bodyHtml: wrapTemplate(`
<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:#dc2626;text-align:center;">Rezerwacja anulowana</h1>
<p style="margin:0 0 24px 0;font-size:14px;color:#64748b;text-align:center;">
Twoja rezerwacja <strong style="color:#1e293b;">{{reservation_number}}</strong> została anulowana.
</p>

<!-- Details -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;">
<tr><td style="padding:20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding:4px 0;font-size:12px;color:#64748b;">Planowany termin</td>
<td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:600;text-align:right;">{{check_in}} — {{check_out}}</td>
</tr>
</table>
</td></tr>
</table>

<p style="margin:20px 0;font-size:13px;color:#64748b;text-align:center;">
Jeśli masz pytania dotyczące anulowania lub chcesz dokonać nowej rezerwacji, skontaktuj się z nami.
</p>

<!-- CTA -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 8px 0;">
<tr><td align="center">
<a href="{{reservation_url}}" style="display:inline-block;padding:14px 32px;background-color:#64748b;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;">
Szczegóły rezerwacji
</a>
</td></tr>
</table>
`),
};

// ═══════════════════════════════════════════
// 5. TEST EMAIL
// ═══════════════════════════════════════════

const TEST_EMAIL: DefaultTemplate = {
  subject: "Email testowy — {{company_name}}",
  bodyHtml: wrapTemplate(`
<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:800;color:{{primary_color}};text-align:center;">Email testowy</h1>
<p style="margin:0 0 16px 0;font-size:14px;color:#64748b;text-align:center;">
Jeśli widzisz tę wiadomość, konfiguracja email działa prawidłowo.
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;">
<tr><td style="padding:16px 20px;font-size:13px;color:#1e293b;text-align:center;">
Nadawca: <strong>{{company_name}}</strong><br/>
Adres: <strong>{{company_email}}</strong>
</td></tr>
</table>
`),
};

// ═══════════════════════════════════════════
// Export
// ═══════════════════════════════════════════

export const DEFAULT_TEMPLATES: Record<string, DefaultTemplate> = {
  BOOKING_CONFIRMATION,
  PAYMENT_REMINDER,
  STATUS_CONFIRMED,
  STATUS_CANCELLED,
  TEST: TEST_EMAIL,
};

/**
 * Get template for email type — uses DB template if exists, otherwise default.
 * Logo block is injected based on whether logoUrl is available.
 */
export function resolveLogoBlock(logoUrl: string | null | undefined): string {
  if (logoUrl) {
    return LOGO_BLOCK_WITH_IMAGE;
  }
  return LOGO_BLOCK_TEXT;
}
