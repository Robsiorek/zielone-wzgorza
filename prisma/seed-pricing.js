// seed-pricing.js — Run with: node prisma/seed-pricing.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding pricing data...\n");

  // ═══ SEZONY ═══
  console.log("--- Sezony ---");
  const seasonData = [
    { name: "Niski sezon (zima)", type: "LOW", startDate: "2026-01-01", endDate: "2026-04-30", color: "#3b82f6" },
    { name: "Sredni sezon (wiosna)", type: "MEDIUM", startDate: "2026-05-01", endDate: "2026-06-19", color: "#f59e0b" },
    { name: "Wysoki sezon (wakacje)", type: "HIGH", startDate: "2026-06-20", endDate: "2026-08-31", color: "#ef4444" },
    { name: "Sredni sezon (jesien)", type: "MEDIUM", startDate: "2026-09-01", endDate: "2026-10-31", color: "#f59e0b" },
    { name: "Niski sezon (zima II)", type: "LOW", startDate: "2026-11-01", endDate: "2026-12-31", color: "#3b82f6" },
    { name: "Dlugi weekend majowy", type: "SPECIAL", startDate: "2026-05-01", endDate: "2026-05-03", color: "#8b5cf6" },
    { name: "Boze Narodzenie", type: "SPECIAL", startDate: "2026-12-23", endDate: "2026-12-27", color: "#8b5cf6" },
    { name: "Sylwester", type: "SPECIAL", startDate: "2026-12-28", endDate: "2027-01-02", color: "#8b5cf6" },
  ];

  const seasons = {};
  for (const s of seasonData) {
    const existing = await prisma.season.findFirst({ where: { name: s.name } });
    if (existing) {
      seasons[s.name] = existing.id;
      console.log("  Skip (exists):", s.name);
    } else {
      const created = await prisma.season.create({
        data: { name: s.name, type: s.type, startDate: new Date(s.startDate), endDate: new Date(s.endDate), color: s.color },
      });
      seasons[s.name] = created.id;
      console.log("  Created:", s.name);
    }
  }

  // ═══ PLANY CENOWE ═══
  console.log("\n--- Plany cenowe ---");
  const planData = [
    { name: "Standardowy", slug: "standardowy", description: "Podstawowy plan cenowy z elastyczna anulacja", cancellationPolicy: "FLEXIBLE", isDefault: true, sortOrder: 0 },
    { name: "Weekendowy", slug: "weekendowy", description: "Ceny na piatek-niedziela (wyzsze o 15%)", cancellationPolicy: "FLEXIBLE", sortOrder: 1 },
    { name: "Last Minute", slug: "last-minute", description: "Znizka -20% przy rezerwacji do 3 dni przed", cancellationPolicy: "STRICT", sortOrder: 2 },
    { name: "Bezzwrotny", slug: "bezzwrotny", description: "Znizka -10% bez mozliwosci anulacji", cancellationPolicy: "STRICT", sortOrder: 3 },
  ];

  const plans = {};
  for (const p of planData) {
    const existing = await prisma.ratePlan.findUnique({ where: { slug: p.slug } });
    if (existing) {
      plans[p.slug] = existing.id;
      console.log("  Skip (exists):", p.name);
    } else {
      const created = await prisma.ratePlan.create({ data: p });
      plans[p.slug] = created.id;
      console.log("  Created:", p.name);
    }
  }

  // Set inheritance: Last Minute inherits from Standardowy -20%
  if (plans["last-minute"] && plans["standardowy"]) {
    await prisma.ratePlan.update({
      where: { id: plans["last-minute"] },
      data: { parentId: plans["standardowy"], modifierType: "PERCENTAGE", modifierValue: -20 },
    });
    console.log("  -> Last Minute dziedziczy z Standardowy (-20%)");
  }
  // Bezzwrotny inherits from Standardowy -10%
  if (plans["bezzwrotny"] && plans["standardowy"]) {
    await prisma.ratePlan.update({
      where: { id: plans["bezzwrotny"] },
      data: { parentId: plans["standardowy"], modifierType: "PERCENTAGE", modifierValue: -10 },
    });
    console.log("  -> Bezzwrotny dziedziczy z Standardowy (-10%)");
  }

  // ═══ PRZYKLADOWE CENY ═══
  console.log("\n--- Przykladowe ceny ---");
  const variants = await prisma.resourceVariant.findMany({
    include: { resource: { select: { name: true, category: { select: { slug: true } } } } },
  });

  // Ceny bazowe per sezon dla domkow (wariant 4-os.)
  const cabinPrices = {
    "LOW": { "4-os": 250, "6-os": 320 },
    "MEDIUM": { "4-os": 350, "6-os": 450 },
    "HIGH": { "4-os": 500, "6-os": 620 },
    "SPECIAL": { "4-os": 550, "6-os": 680 },
  };

  let priceCount = 0;
  const stdPlan = plans["standardowy"];
  const wkdPlan = plans["weekendowy"];

  if (stdPlan) {
    for (const v of variants) {
      const catSlug = v.resource.category.slug;
      if (catSlug !== "domki") continue;

      for (const [seasonName, seasonId] of Object.entries(seasons)) {
        const seasonType = seasonData.find(s => s.name === seasonName)?.type;
        if (!seasonType) continue;

        const priceKey = v.name.includes("6") ? "6-os" : "4-os";
        const basePrice = cabinPrices[seasonType]?.[priceKey];
        if (!basePrice) continue;

        // Standard price
        const existing = await prisma.priceEntry.findFirst({
          where: { variantId: v.id, ratePlanId: stdPlan, seasonId },
        });
        if (!existing) {
          await prisma.priceEntry.create({
            data: { variantId: v.id, ratePlanId: stdPlan, seasonId, price: basePrice },
          });
          priceCount++;
        }

        // Weekend price (+15%)
        if (wkdPlan) {
          const wkdExisting = await prisma.priceEntry.findFirst({
            where: { variantId: v.id, ratePlanId: wkdPlan, seasonId },
          });
          if (!wkdExisting) {
            await prisma.priceEntry.create({
              data: { variantId: v.id, ratePlanId: wkdPlan, seasonId, price: Math.round(basePrice * 1.15) },
            });
            priceCount++;
          }
        }
      }
    }
  }

  console.log("  Utworzono " + priceCount + " wpisow cenowych");

  // ═══ PODSUMOWANIE ═══
  const totalSeasons = await prisma.season.count();
  const totalPlans = await prisma.ratePlan.count();
  const totalPrices = await prisma.priceEntry.count();

  console.log("\n========================================");
  console.log("PRICING SEED COMPLETE!");
  console.log("  Sezony:        " + totalSeasons);
  console.log("  Plany cenowe:  " + totalPlans);
  console.log("  Wpisy cenowe:  " + totalPrices);
  console.log("========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
