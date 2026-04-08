import { ClientDetailsPage } from "@/components/clients/client-details-page";
export const dynamic = "force-dynamic";
export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return <ClientDetailsPage clientId={params.id} />;
}
