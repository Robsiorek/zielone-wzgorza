import { ModulePlaceholder } from "@/components/ui/module-placeholder";
export const dynamic = "force-dynamic";
export default function SettingsPage() {
  return <ModulePlaceholder title="Ustawienia konta" description="Ustawienia Twojego konta użytkownika." features={["Zmiana hasła", "Preferencje powiadomień", "Motyw jasny/ciemny", "Język interfejsu"]} />;
}
