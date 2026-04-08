/**
 * GET /api/public/widget-config — Public widget configuration.
 *
 * Returns theme tokens, logo URL, font for booking frontend.
 * No auth. No sensitive data.
 * Cache-Control: no-store — admin changes must be visible immediately.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiServerError } from "@/lib/api-response";

// CRITICAL: disable Next.js server-side cache for this route
// Without this, GET responses are cached and admin changes don't propagate
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let config = await prisma.widgetConfig.findUnique({ where: { id: "default" } });
    if (!config) {
      config = await prisma.widgetConfig.create({ data: { id: "default" } });
    }

    const body = {
      success: true,
      data: {
        theme: {
          primaryColor: config.primaryColor,
          primaryForeground: config.primaryForeground,
          backgroundColor: config.backgroundColor,
          foregroundColor: config.foregroundColor,
          cardColor: config.cardColor,
          mutedColor: config.mutedColor,
          borderColor: config.borderColor,
          successColor: config.successColor,
          warningColor: config.warningColor,
          dangerColor: config.dangerColor,
        },
        logoUrl: config.logoUrl,
        logoHeight: config.logoHeight,
        fontFamily: config.fontFamily,
        termsUrl: config.termsUrl,
        privacyUrl: config.privacyUrl,
      },
      error: null,
      code: null,
    };

    return NextResponse.json(body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return apiServerError(error);
  }
}
