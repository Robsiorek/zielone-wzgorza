import { ReservationDetail } from "@/components/reservations/reservation-detail";
export const dynamic = "force-dynamic";
export default function ReservationDetailPage({ params }: { params: { id: string } }) {
  return <ReservationDetail bookingId={params.id} />;
}
