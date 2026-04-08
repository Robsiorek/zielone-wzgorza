/**
 * GET /api/settings/payment-methods — active payment methods from CompanySettings
 *
 * C2: Used by PaymentForm to populate method dropdown.
 */

import { prisma } from "@/lib/prisma";
import { apiSuccess, apiServerError } from "@/lib/api-response";

export async function GET() {
  try {
    const settings = await prisma.companySettings.findFirst({
      select: { paymentMethodsConfig: true },
    });

    const methods = (settings?.paymentMethodsConfig as any[]) || [];

    return apiSuccess({ methods });
  } catch (error) {
    return apiServerError(error);
  }
}
