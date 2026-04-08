import { ModulePlaceholder } from "@/components/ui/module-placeholder";
export const dynamic = "force-dynamic";
export default function PaymentsPage() {
  return <ModulePlaceholder title="Płatności" description="Obsługa płatności, faktur i rozliczeń." features={["Rejestr płatności","Integracja z bramkami","Generowanie faktur","Raporty finansowe"]} />;
}
