import { getCurrentUser } from "@/lib/auth";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  return <DashboardContent firstName={user?.firstName || "Admin"} />;
}
