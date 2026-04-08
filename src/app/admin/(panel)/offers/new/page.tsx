"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UnifiedPanel } from "@/components/unified-panel";

function NewOfferContent() {
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
      onClose={() => router.push("/admin/offers")}
      onCreated={() => router.push("/admin/offers")}
      initialTab="offer"
      prefill={prefill}
    />
  );
}

export default function NewOfferPage() {
  return <Suspense><NewOfferContent /></Suspense>;
}
