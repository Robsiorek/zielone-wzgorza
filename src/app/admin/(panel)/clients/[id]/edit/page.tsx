import { ClientFormPage } from "@/components/clients/client-form-page";
export const dynamic = "force-dynamic";
export default function EditClientPage({ params }: { params: { id: string } }) {
  return <ClientFormPage mode="edit" clientId={params.id} />;
}
