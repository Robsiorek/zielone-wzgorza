import { ModulePlaceholder } from "@/components/ui/module-placeholder";
export const dynamic = "force-dynamic";
export default function DocumentsPage() {
  return <ModulePlaceholder title="Dokumenty" description="Zarządzanie dokumentami, umowami i szablonami." features={["Szablony dokumentów","Generowanie umów","Przechowywanie plików","Wersjonowanie"]} />;
}
