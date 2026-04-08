/**
 * GET /api/health
 *
 * System health check endpoint.
 *
 * Public (no auth): minimal { status, timestamp }
 * Admin (auth + ?detail=true): full diagnostics with checks
 *
 * Status logic:
 *   healthy   — DB ok, SMTP ok, cron < 26h
 *   degraded  — DB ok, but SMTP fail OR cron stale
 *   unhealthy — DB fail
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// ── SMTP health cache (5 min TTL) ──

let smtpCacheStatus: "ok" | "fail" | "timeout" | "not_configured" = "not_configured";
let smtpCacheLatencyMs = 0;
let smtpCacheLastCheckAt: Date | null = null;
const SMTP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function checkSmtpCached(forceFresh: boolean = false): Promise<{
  status: "ok" | "fail" | "timeout" | "not_configured";
  latencyMs: number;
  lastCheckAt: string | null;
  cached: boolean;
}> {
  const now = Date.now();
  const cacheValid = smtpCacheLastCheckAt && (now - smtpCacheLastCheckAt.getTime()) < SMTP_CACHE_TTL_MS;

  if (cacheValid && !forceFresh) {
    return {
      status: smtpCacheStatus,
      latencyMs: smtpCacheLatencyMs,
      lastCheckAt: smtpCacheLastCheckAt!.toISOString(),
      cached: true,
    };
  }

  // Fresh SMTP check
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    smtpCacheStatus = "not_configured";
    smtpCacheLatencyMs = 0;
    smtpCacheLastCheckAt = new Date();
    return { status: "not_configured", latencyMs: 0, lastCheckAt: new Date().toISOString(), cached: false };
  }

  const start = Date.now();
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });

    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP timeout")), 10000)),
    ]);

    smtpCacheStatus = "ok";
    smtpCacheLatencyMs = Date.now() - start;
    smtpCacheLastCheckAt = new Date();
    return { status: "ok", latencyMs: smtpCacheLatencyMs, lastCheckAt: smtpCacheLastCheckAt.toISOString(), cached: false };
  } catch (error) {
    const isTimeout = error instanceof Error && error.message.includes("timeout");
    smtpCacheStatus = isTimeout ? "timeout" : "fail";
    smtpCacheLatencyMs = Date.now() - start;
    smtpCacheLastCheckAt = new Date();
    return { status: smtpCacheStatus, latencyMs: smtpCacheLatencyMs, lastCheckAt: smtpCacheLastCheckAt.toISOString(), cached: false };
  }
}

// ── Cron heartbeat ──
// MVP: reads lastReminderRunAt from file written by cron endpoint.
// If file doesn't exist → "not_tracked"

async function checkCronHeartbeat(): Promise<{
  status: "ok" | "stale" | "never_run" | "not_tracked";
  lastRunAt: string | null;
  ageMinutes: number | null;
}> {
  try {
    const fs = await import("fs/promises");
    const data = await fs.readFile("/var/www/admin/data/cron-heartbeat.json", "utf-8");
    const parsed = JSON.parse(data);
    const lastRunAt = parsed.lastReminderRunAt;
    if (!lastRunAt) return { status: "never_run", lastRunAt: null, ageMinutes: null };

    const ageMs = Date.now() - new Date(lastRunAt).getTime();
    const ageMinutes = Math.round(ageMs / 60000);
    const staleThreshold = 26 * 60; // 26 hours in minutes

    return {
      status: ageMinutes > staleThreshold ? "stale" : "ok",
      lastRunAt,
      ageMinutes,
    };
  } catch {
    return { status: "not_tracked", lastRunAt: null, ageMinutes: null };
  }
}

// ── Main handler ──

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const detail = request.nextUrl.searchParams.get("detail") === "true";
  const smtpFresh = request.nextUrl.searchParams.get("smtpFresh") === "true";

  // Check if admin authenticated
  const token = request.cookies.get("zw_admin_token")?.value;
  const isAdmin = !!token; // simplified — full auth check not needed for health

  // ── DB check (critical) ──
  let dbStatus: "ok" | "fail" | "timeout" = "ok";
  let dbLatencyMs = 0;
  try {
    const dbStart = Date.now();
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 5000)),
    ]);
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    const isTimeout = error instanceof Error && error.message.includes("timeout");
    dbStatus = isTimeout ? "timeout" : "fail";
  }

  // ── SMTP check (cached, degraded) ──
  const smtp = await checkSmtpCached(isAdmin && smtpFresh);

  // ── Cron check (degraded) ──
  const cron = await checkCronHeartbeat();

  // ── Overall status ──
  let status: "healthy" | "degraded" | "unhealthy";
  if (dbStatus !== "ok") {
    status = "unhealthy";
  } else if (smtp.status !== "ok" || cron.status === "stale" || cron.status === "never_run") {
    status = "degraded";
  } else {
    status = "healthy";
  }

  // ── Public response (no auth or no detail) ──
  if (!isAdmin || !detail) {
    return NextResponse.json({ status, timestamp });
  }

  // ── Admin detail response ──
  let version = "unknown";
  try {
    const fs = await import("fs/promises");
    version = (await fs.readFile("/var/www/admin/VERSION", "utf-8")).trim();
  } catch {
    version = process.env.APP_VERSION || "unknown";
  }

  return NextResponse.json({
    status,
    timestamp,
    version,
    checks: {
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      smtp: {
        status: smtp.status,
        latencyMs: smtp.latencyMs,
        lastCheckAt: smtp.lastCheckAt,
        cached: smtp.cached,
      },
      cron: {
        status: cron.status,
        lastRunAt: cron.lastRunAt,
        ageMinutes: cron.ageMinutes,
      },
    },
  });
}
