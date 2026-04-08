import { OfferDetail } from "@/components/offers/offer-detail";
export const dynamic = "force-dynamic";
export default function OfferDetailPage({ params }: { params: { id: string } }) {
  return <OfferDetail offerId={params.id} />;
}
