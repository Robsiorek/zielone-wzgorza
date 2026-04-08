/**
 * POST /api/settings/email/test-connection
 *
 * E3: OWNER only. Tests SMTP connection by performing a real handshake
 * (EHLO + AUTH) without sending any email.
 * Returns success/failure with detailed error message.
 */

import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587");
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      return apiSuccess({
        success: false,
        message: "Brak konfiguracji SMTP w pliku .env",
        details: {
          host: !host ? "Brak SMTP_HOST" : null,
          user: !user ? "Brak SMTP_USER" : null,
          password: !pass ? "Brak SMTP_PASSWORD" : null,
        },
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    // verify() performs EHLO + AUTH handshake without sending
    await transporter.verify();

    return apiSuccess({
      success: true,
      message: `Połączenie SMTP nawiązane pomyślnie (${host}:${port})`,
    });
  } catch (error: any) {
    const errMsg = error.message || "Nieznany błąd";

    // Parse common SMTP errors into Polish messages
    let userMessage = "Nie udało się połączyć z serwerem SMTP";
    if (errMsg.includes("ECONNREFUSED")) {
      userMessage = "Serwer SMTP odrzucił połączenie. Sprawdź host i port.";
    } else if (errMsg.includes("ETIMEDOUT") || errMsg.includes("timeout")) {
      userMessage = "Przekroczono czas połączenia. Sprawdź host, port i ustawienia firewall.";
    } else if (errMsg.includes("ENOTFOUND") || errMsg.includes("getaddrinfo")) {
      userMessage = "Nie znaleziono serwera SMTP. Sprawdź adres hosta.";
    } else if (errMsg.includes("Invalid login") || errMsg.includes("authentication") || errMsg.includes("535")) {
      userMessage = "Błąd logowania. Sprawdź login i hasło SMTP.";
    } else if (errMsg.includes("certificate") || errMsg.includes("TLS") || errMsg.includes("SSL")) {
      userMessage = "Problem z certyfikatem SSL/TLS. Sprawdź ustawienie SMTP_SECURE.";
    }

    return apiSuccess({
      success: false,
      message: userMessage,
      error: errMsg.slice(0, 300),
    });
  }
}
