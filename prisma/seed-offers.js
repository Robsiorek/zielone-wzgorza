const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding offers + timeline...");

  // Get existing clients and resources
  const clients = await prisma.client.findMany({ take: 5 });
  const resources = await prisma.resource.findMany({
    where: { category: { type: "ACCOMMODATION" } },
    include: { category: true },
    take: 10,
  });

  if (clients.length === 0 || resources.length === 0) {
    console.log("Brak klientów lub zasobów — uruchom najpierw seed-clients.js i seed-resources.js");
    return;
  }

  // Helper: generate offer number
  let offerCounter = 1;
  const offerNum = () => `OF-2026-${String(offerCounter++).padStart(4, "0")}`;

  // Helper: date
  const d = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const offers = [
    {
      offerNumber: offerNum(),
      clientId: clients[0]?.id,
      status: "DRAFT",
      checkIn: d(7),
      checkOut: d(10),
      nights: 3,
      source: "PHONE",
      note: "Klient pytał o domek nad jeziorem",
      resources: [{ resourceId: resources[0]?.id, capacity: 4, pricePerNight: 350 }],
    },
    {
      offerNumber: offerNum(),
      clientId: clients[1]?.id,
      status: "OPEN",
      checkIn: d(14),
      checkOut: d(21),
      nights: 7,
      source: "EMAIL",
      note: "Rodzina z dziećmi, potrzebują 2 domki",
      expiresAt: d(5),
      sentAt: d(-2),
      resources: [
        { resourceId: resources[0]?.id, capacity: 4, pricePerNight: 350 },
        { resourceId: resources[1]?.id, capacity: 6, pricePerNight: 450 },
      ],
    },
    {
      offerNumber: offerNum(),
      clientId: clients[2]?.id,
      status: "ACCEPTED",
      checkIn: d(3),
      checkOut: d(5),
      nights: 2,
      source: "SOCIAL",
      sentAt: d(-5),
      acceptedAt: d(-1),
      resources: [{ resourceId: resources[2]?.id || resources[0]?.id, capacity: 2, pricePerNight: 280 }],
    },
    {
      offerNumber: offerNum(),
      clientId: clients[3]?.id || clients[0]?.id,
      status: "EXPIRED",
      checkIn: d(-3),
      checkOut: d(-1),
      nights: 2,
      source: "EMAIL",
      expiresAt: d(-4),
      expiredAt: d(-4),
      resources: [{ resourceId: resources[1]?.id || resources[0]?.id, capacity: 4, pricePerNight: 320 }],
    },
    {
      offerNumber: offerNum(),
      clientId: clients[4]?.id || clients[0]?.id,
      status: "CANCELLED",
      checkIn: d(10),
      checkOut: d(14),
      nights: 4,
      source: "PHONE",
      cancelReason: "Klient zmienił plany",
      cancelledBy: "CLIENT",
      cancelledAt: d(-1),
      resources: [{ resourceId: resources[0]?.id, capacity: 4, pricePerNight: 350 }],
    },
    {
      offerNumber: offerNum(),
      clientId: clients[0]?.id,
      status: "OPEN",
      checkIn: d(30),
      checkOut: d(37),
      nights: 7,
      source: "WEBSITE",
      note: "Wyjazd firmowy, 3 domki + sala",
      expiresAt: d(10),
      sentAt: d(-1),
      resources: [
        { resourceId: resources[0]?.id, capacity: 6, pricePerNight: 350 },
        { resourceId: resources[1]?.id || resources[0]?.id, capacity: 6, pricePerNight: 450 },
        { resourceId: resources[2]?.id || resources[0]?.id, capacity: 4, pricePerNight: 280 },
      ],
    },
  ];

  for (const offerData of offers) {
    const { resources: resList, ...data } = offerData;

    // Calculate totals
    let subtotal = 0;
    const resourcesCreate = resList.map((r, i) => {
      const resSubtotal = r.pricePerNight * data.nights;
      subtotal += resSubtotal;
      return {
        resourceId: r.resourceId,
        capacity: r.capacity,
        pricePerNight: r.pricePerNight,
        nights: data.nights,
        subtotal: resSubtotal,
        sortOrder: i,
      };
    });

    const offer = await prisma.offer.create({
      data: {
        ...data,
        subtotal,
        total: subtotal,
        offerResources: { create: resourcesCreate },
        activities: {
          create: [
            { action: "CREATED", description: "Oferta utworzona", changedBy: "ADMIN" },
            ...(data.status === "OPEN" || data.status === "ACCEPTED"
              ? [{ action: "SENT", description: "Oferta wysłana do klienta", changedBy: "ADMIN" }]
              : []),
            ...(data.status === "ACCEPTED"
              ? [{ action: "ACCEPTED", description: "Oferta zaakceptowana przez klienta", changedBy: "CLIENT" }]
              : []),
            ...(data.status === "CANCELLED"
              ? [{ action: "CANCELLED", description: data.cancelReason || "Oferta anulowana", changedBy: data.cancelledBy || "ADMIN" }]
              : []),
            ...(data.status === "EXPIRED"
              ? [{ action: "EXPIRED", description: "Oferta wygasła", changedBy: "SYSTEM" }]
              : []),
          ],
        },
      },
    });

    // Create timeline entries (only for DRAFT, OPEN, ACCEPTED — not cancelled/expired)
    if (["DRAFT", "OPEN", "ACCEPTED"].includes(data.status)) {
      for (const r of resList) {
        await prisma.timelineEntry.create({
          data: {
            type: "OFFER",
            status: "ACTIVE",
            resourceId: r.resourceId,
            startDate: data.checkIn,
            endDate: data.checkOut,
            offerId: offer.id,
            label: `Oferta ${data.offerNumber}`,
            color: data.status === "ACCEPTED" ? "#10B981" : "#3B82F6",
          },
        });
      }
    }

    // For cancelled — create as CANCELLED for history
    if (data.status === "CANCELLED") {
      for (const r of resList) {
        await prisma.timelineEntry.create({
          data: {
            type: "OFFER",
            status: "CANCELLED",
            resourceId: r.resourceId,
            startDate: data.checkIn,
            endDate: data.checkOut,
            offerId: offer.id,
            label: `Oferta ${data.offerNumber} (anulowana)`,
          },
        });
      }
    }

    console.log(`  ✓ Oferta ${data.offerNumber} (${data.status})`);
  }

  // Add some block entries for timeline demo
  if (resources[0]) {
    await prisma.timelineEntry.create({
      data: {
        type: "BLOCK",
        resourceId: resources[0].id,
        startDate: d(45),
        endDate: d(75),
        label: "Obozy letnie 2026",
        color: "#EF4444",
        note: "Blokada na obozy letnie",
      },
    });
    console.log("  ✓ Blokada: Obozy letnie");
  }

  console.log("Done! Offers + timeline seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
