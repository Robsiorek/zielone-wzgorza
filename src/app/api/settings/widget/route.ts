/**
 * GET/PATCH /api/settings/widget — Widget appearance config.
 * POST — Upload logo (FormData).
 *
 * Admin-only (OWNER role). Manages theme tokens, logo, font for public booking.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import * as fs from "fs";
import * as path from "path";
import { randomBytes } from "crypto";

const LOGO_DIR = path.join(process.cwd(), "data", "widget");
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_LOGO_TYPES = ["image/svg+xml", "image/png", "image/webp", "image/jpeg"];
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color);
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/svg+xml": "svg",
    "image/png": "png",
    "image/webp": "webp",
    "image/jpeg": "jpg",
  };
  return map[mime] || "png";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();

    let config = await prisma.widgetConfig.findUnique({ where: { id: "default" } });
    if (!config) {
      config = await prisma.widgetConfig.create({ data: { id: "default" } });
    }

    return apiSuccess({ config });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const body = await request.json();
    const data: any = {};

    // Theme color tokens
    const colorFields = [
      "primaryColor", "primaryForeground", "backgroundColor", "foregroundColor",
      "cardColor", "mutedColor", "borderColor", "successColor", "warningColor", "dangerColor",
    ];
    for (const field of colorFields) {
      if (body[field] !== undefined) {
        if (!isValidHexColor(body[field])) {
          return apiError(`Nieprawidłowy kolor ${field}: wymagany format #RRGGBB`);
        }
        data[field] = body[field];
      }
    }

    // Logo height
    if (body.logoHeight !== undefined) {
      const h = parseInt(body.logoHeight);
      if (isNaN(h) || h < 24 || h > 80) {
        return apiError("Wysokość logo: 24-80 px");
      }
      data.logoHeight = h;
    }

    // Font
    if (body.fontFamily !== undefined) {
      const font = body.fontFamily.trim();
      if (font.length > 100) return apiError("Nazwa fontu zbyt długa");
      data.fontFamily = font || "Plus Jakarta Sans";
    }

    // Widget settings
    if (body.showPrices !== undefined) data.showPrices = Boolean(body.showPrices);
    if (body.showAvailability !== undefined) data.showAvailability = Boolean(body.showAvailability);
    if (body.termsUrl !== undefined) data.termsUrl = body.termsUrl || null;
    if (body.privacyUrl !== undefined) data.privacyUrl = body.privacyUrl || null;

    const config = await prisma.widgetConfig.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    return apiSuccess({ config });
  } catch (error) {
    return apiServerError(error);
  }
}

// POST — Logo upload (FormData)
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    // DELETE logo (if no file and action=delete)
    const action = formData.get("action") as string | null;
    if (action === "delete") {
      const config = await prisma.widgetConfig.findUnique({ where: { id: "default" } });
      if (config?.logoUrl) {
        const oldPath = path.join(LOGO_DIR, path.basename(config.logoUrl));
        try { fs.unlinkSync(oldPath); } catch {}
      }
      await prisma.widgetConfig.upsert({
        where: { id: "default" },
        update: { logoUrl: null },
        create: { id: "default", logoUrl: null },
      });
      return apiSuccess({ logoUrl: null });
    }

    if (!file) return apiError("Brak pliku logo");
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      return apiError("Dozwolone formaty: SVG, PNG, WebP, JPG");
    }
    if (file.size > MAX_LOGO_SIZE) {
      return apiError("Maksymalny rozmiar: 5 MB");
    }

    // Ensure directory exists
    if (!fs.existsSync(LOGO_DIR)) {
      fs.mkdirSync(LOGO_DIR, { recursive: true });
    }

    // Delete old logo
    const config = await prisma.widgetConfig.findUnique({ where: { id: "default" } });
    if (config?.logoUrl) {
      const oldPath = path.join(LOGO_DIR, path.basename(config.logoUrl));
      try { fs.unlinkSync(oldPath); } catch {}
    }

    // Save new logo with random name
    const ext = extFromMime(file.type);
    const randomId = randomBytes(8).toString("hex");
    const filename = `logo-${randomId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(LOGO_DIR, filename), buffer);

    const logoUrl = `/api/public/widget-logo/${filename}`;

    await prisma.widgetConfig.upsert({
      where: { id: "default" },
      update: { logoUrl },
      create: { id: "default", logoUrl },
    });

    return apiSuccess({ logoUrl });
  } catch (error) {
    return apiServerError(error);
  }
}
