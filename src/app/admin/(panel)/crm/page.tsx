import { ModulePlaceholder } from "@/components/ui/module-placeholder";
export const dynamic = "force-dynamic";
export default function CrmPage() {
  return <ModulePlaceholder title="CRM" description="System zarządzania relacjami z klientami." features={["Pipeline sprzedażowy","Historia kontaktów","Notatki i zadania","Kampanie email"]} />;
}
