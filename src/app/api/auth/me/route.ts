import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiUnauthorized } from "@/lib/api-response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();
  return apiSuccess({ user });
}
