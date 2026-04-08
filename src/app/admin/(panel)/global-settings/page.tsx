import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function GlobalSettingsPage() {
  redirect("/admin/global-settings/appearance");
}
