"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UnifiedPanel } from "@/components/unified-panel";

function NewReservationContent() {
  const router = useRouter();
  const params = useSearchParams();

  const prefill = (params.get("resourceId") || params.get("startDate") || params.get("endDate"))
    ? {
        resourceId: params.get("resourceId") || undefined,
        startDate: params.get("startDate") || undefined,
        endDate: params.get("endDate") || undefined,
      }
    : undefined;

  return (
    <UnifiedPanel
      open={true}
      onClose={() => router.push("/admin/reservations")}
      onCreated={() => router.push("/admin/reservations")}
      initialTab="booking"
      prefill={prefill}
    />
  );
}

export default function NewReservationPage() {
  return <Suspense><NewReservationContent /></Suspense>;
}
