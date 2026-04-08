import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/layout/admin-shell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell
      userName={`${user.firstName} ${user.lastName}`}
      userEmail={user.email}
    >
      {children}
    </AdminShell>
  );
}
