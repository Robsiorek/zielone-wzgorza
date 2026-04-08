/**
 * Email Renderer — safe placeholder interpolation.
 *
 * E3: Two types of variables:
 * - Text variables: {{name}} → HTML-escaped (XSS-safe)
 * - HTML variables: {{name_html}} → trusted, server-generated HTML (not escaped)
 *
 * Naming convention: suffix "_html" = trusted HTML, everything else = escaped text.
 * Unknown placeholders are removed (replaced with empty string).
 */

// ── HTML escape for text variables ──

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Variable types ──

export interface EmailVariables {
  [key: string]: string | number | null | undefined;
}

// ── Render template ──

/**
 * Render an email template by replacing {{placeholders}} with values.
 *
 * Rules:
 * - Variables ending with "_html" are inserted as-is (trusted HTML from server)
 * - All other variables are HTML-escaped
 * - Unknown variables are removed (empty string)
 * - Null/undefined values become empty string
 *
 * @param template - HTML template string with {{placeholders}}
 * @param variables - Key-value map of variable values
 * @returns Rendered HTML string
 */
export function renderEmailTemplate(
  template: string,
  variables: EmailVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key];

    if (value === null || value === undefined) {
      return "";
    }

    const strValue = String(value);

    // HTML variables (trusted, server-generated) — NOT escaped
    if (key.endsWith("_html")) {
      return strValue;
    }

    // Text variables — HTML-escaped
    return escapeHtml(strValue);
  });
}

// ── Build variables from reservation data ──

import { formatMoneyMinor } from "@/lib/format";

interface ReservationEmailData {
  number: string;
  checkIn: Date | string;
  checkOut: Date | string;
  nights: number;
  adults: number;
  children: number;
  totalMinor: number;
  requiredDepositMinor: number;
  status: string;
  guestNotes?: string | null;
  items: { resource: { name: string } }[];
  bookingDetails?: { token?: string | null } | null;
}

interface ClientEmailData {
  firstName: string;
  lastName: string;
  email: string;
}

interface CompanyEmailData {
  companyName: string;
  senderName: string;
  phone?: string | null;
  email?: string | null;
  bankAccountName: string;
  bankAccountIban: string;
  bankName: string;
}

interface ThemeEmailData {
  logoUrl?: string | null;
  primaryColor?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekuje na wpłatę",
  CONFIRMED: "Potwierdzona",
  CANCELLED: "Anulowana",
  CHECKED_IN: "Zameldowana",
  CHECKED_OUT: "Wymeldowana",
  FINISHED: "Zrealizowana",
  NO_SHOW: "Niestawienie się",
};

function formatDatePL(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Build standard email variables from reservation + client + company data.
 * Used by all email types. Individual types may add extra variables.
 */
export function buildEmailVariables(
  reservation: ReservationEmailData,
  client: ClientEmailData,
  company: CompanyEmailData,
  theme?: ThemeEmailData,
  baseUrl?: string,
): EmailVariables {
  const token = reservation.bookingDetails?.token;
  const reservationUrl = token && baseUrl
    ? `${baseUrl}/reservation/${token}`
    : "";

  // Build resources list as trusted HTML
  const resourcesHtml = reservation.items
    .map(item => `<li style="padding:4px 0;">${escapeHtml(item.resource.name)}</li>`)
    .join("");

  const transferTitle = `Rezerwacja ${reservation.number}`;

  return {
    // Reservation
    reservation_number: reservation.number,
    check_in: formatDatePL(reservation.checkIn),
    check_out: formatDatePL(reservation.checkOut),
    nights: String(reservation.nights),
    adults: String(reservation.adults),
    children: String(reservation.children),
    total: formatMoneyMinor(reservation.totalMinor),
    deposit: formatMoneyMinor(reservation.requiredDepositMinor),
    status: STATUS_LABELS[reservation.status] || reservation.status,
    guest_notes: reservation.guestNotes || "",

    // Resources (trusted HTML)
    resources_list_html: resourcesHtml
      ? `<ul style="margin:0;padding:0 0 0 16px;">${resourcesHtml}</ul>`
      : "",

    // Client
    client_first_name: client.firstName,
    client_last_name: client.lastName,
    client_email: client.email,

    // Company
    company_name: company.companyName,
    company_phone: company.phone || "",
    company_email: company.email || "",

    // Bank
    bank_account_name: company.bankAccountName,
    bank_account_iban: company.bankAccountIban,
    bank_name: company.bankName,
    transfer_title: transferTitle,

    // Links
    reservation_url: reservationUrl,

    // Theme
    logo_url: theme?.logoUrl || "",
    primary_color: theme?.primaryColor || "#2563EB",

    // Meta
    current_year: String(new Date().getFullYear()),
  };
}
