import { OfferPublicView } from "@/components/engine/offer-view";
export const dynamic = "force-dynamic";
export default function PublicOfferPage({ params }: { params: { token: string } }) {
  return <OfferPublicView token={params.token} />;
}
