// seed-resources.js — Run with: node prisma/seed-resources.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding resources for Zielone Wzgorza...\n");

  // Get categories
  const cats = {};
  const allCats = await prisma.resourceCategory.findMany();
  for (const c of allCats) cats[c.slug] = c.id;

  if (!cats["domki"]) {
    console.log("ERROR: Categories not found. Run seed-categories.js first.");
    return;
  }

  // ═══════════════════════════════════════
  // DOMKI HOBBITA (10 szt.)
  // ═══════════════════════════════════════
  console.log("--- Domki Hobbita ---");
  const cabinNames = [
    "Domek Hobbita #1", "Domek Hobbita #2", "Domek Hobbita #3",
    "Domek Hobbita #4", "Domek Hobbita #5", "Domek Hobbita #6",
    "Domek Hobbita #7", "Domek Hobbita #8", "Domek Hobbita #9",
    "Domek Hobbita #10",
  ];

  for (let i = 0; i < cabinNames.length; i++) {
    const name = cabinNames[i];
    const slug = "domek-hobbita-" + (i + 1);
    const existing = await prisma.resource.findUnique({ where: { slug } });
    if (existing) { console.log("  Skip (exists):", name); continue; }

    const resource = await prisma.resource.create({
      data: {
        name,
        slug,
        categoryId: cats["domki"],
        description: "Klimatyczny domek w stylu hobbickim z widokiem na jezioro. Wyposa\u017cony w \u0142azienk\u0119, aneks kuchenny, taras z grillem.",
        shortDesc: "Domek dla 4-6 os\u00f3b z tarasem i grillem",
        maxCapacity: 6,
        totalUnits: 1,
        location: i < 5 ? "Strefa A - Nad jeziorem" : "Strefa B - Wzg\u00f3rze",
        status: "ACTIVE",
        sortOrder: i + 1,
      },
    });

    // Warianty sprzedazowe
    await prisma.resourceVariant.createMany({
      data: [
        {
          resourceId: resource.id,
          name: "4-osobowy",
          slug: slug + "-4os",
          description: "Wariant dla max 4 os\u00f3b",
          capacity: 4,
          basePrice: 350,
          isDefault: true,
          isActive: true,
          sortOrder: 0,
        },
        {
          resourceId: resource.id,
          name: "6-osobowy",
          slug: slug + "-6os",
          description: "Wariant dla max 6 os\u00f3b (dop\u0142ata za dodatkowe osoby)",
          capacity: 6,
          basePrice: 450,
          isDefault: false,
          isActive: true,
          sortOrder: 1,
        },
      ],
    });

    // Udogodnienia
    await prisma.resourceAmenity.createMany({
      data: [
        { resourceId: resource.id, name: "Wi-Fi", icon: "wifi" },
        { resourceId: resource.id, name: "\u0141azienka", icon: "bath" },
        { resourceId: resource.id, name: "Aneks kuchenny", icon: "utensils" },
        { resourceId: resource.id, name: "Taras", icon: "sun" },
        { resourceId: resource.id, name: "Grill", icon: "flame" },
        { resourceId: resource.id, name: "Parking", icon: "car" },
      ],
    });

    console.log("  Created:", name, "(+ 2 warianty, 6 udogodnie\u0144)");
  }

  // ═══════════════════════════════════════
  // POKOJE (4 szt.)
  // ═══════════════════════════════════════
  console.log("\n--- Pokoje ---");
  const rooms = [
    { name: "Pok\u00f3j 2-osobowy #1", slug: "pokoj-2os-1", capacity: 2, price: 180, desc: "Przytulny pok\u00f3j 2-osobowy z \u0142azienk\u0105" },
    { name: "Pok\u00f3j 2-osobowy #2", slug: "pokoj-2os-2", capacity: 2, price: 180, desc: "Przytulny pok\u00f3j 2-osobowy z \u0142azienk\u0105" },
    { name: "Pok\u00f3j 3-osobowy #1", slug: "pokoj-3os-1", capacity: 3, price: 240, desc: "Przestronny pok\u00f3j 3-osobowy z \u0142azienk\u0105" },
    { name: "Pok\u00f3j 3-osobowy #2", slug: "pokoj-3os-2", capacity: 3, price: 240, desc: "Przestronny pok\u00f3j 3-osobowy z \u0142azienk\u0105" },
  ];

  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    const existing = await prisma.resource.findUnique({ where: { slug: r.slug } });
    if (existing) { console.log("  Skip (exists):", r.name); continue; }

    const resource = await prisma.resource.create({
      data: {
        name: r.name,
        slug: r.slug,
        categoryId: cats["pokoje"],
        description: r.desc,
        maxCapacity: r.capacity,
        totalUnits: 1,
        location: "Budynek us\u0142ugowy",
        status: "ACTIVE",
        sortOrder: i + 1,
      },
    });

    await prisma.resourceVariant.create({
      data: {
        resourceId: resource.id,
        name: r.capacity + "-osobowy",
        slug: r.slug + "-standard",
        capacity: r.capacity,
        basePrice: r.price,
        isDefault: true,
        isActive: true,
        sortOrder: 0,
      },
    });

    await prisma.resourceAmenity.createMany({
      data: [
        { resourceId: resource.id, name: "Wi-Fi", icon: "wifi" },
        { resourceId: resource.id, name: "\u0141azienka", icon: "bath" },
        { resourceId: resource.id, name: "TV", icon: "tv" },
      ],
    });

    console.log("  Created:", r.name);
  }

  // ═══════════════════════════════════════
  // SALA EVENTOWA
  // ═══════════════════════════════════════
  console.log("\n--- Sala eventowa ---");
  const salaSlug = "sala-eventowa";
  if (!(await prisma.resource.findUnique({ where: { slug: salaSlug } }))) {
    const sala = await prisma.resource.create({
      data: {
        name: "Sala eventowa",
        slug: salaSlug,
        categoryId: cats["sale"],
        description: "Du\u017ca sala nad restauracj\u0105, idealna na konferencje, szkolenia, imprezy firmowe. Pojemno\u015b\u0107 do 80 os\u00f3b.",
        maxCapacity: 80,
        totalUnits: 1,
        location: "Pi\u0119tro nad restauracj\u0105",
        status: "ACTIVE",
        sortOrder: 1,
      },
    });

    await prisma.resourceVariant.createMany({
      data: [
        { resourceId: sala.id, name: "Uk\u0142ad teatralny", slug: "sala-teatralny", capacity: 80, basePrice: 2000, isDefault: true, isActive: true, sortOrder: 0 },
        { resourceId: sala.id, name: "Uk\u0142ad bankietowy", slug: "sala-bankietowy", capacity: 60, basePrice: 2500, isDefault: false, isActive: true, sortOrder: 1 },
        { resourceId: sala.id, name: "Uk\u0142ad konferencyjny", slug: "sala-konferencyjny", capacity: 40, basePrice: 1500, isDefault: false, isActive: true, sortOrder: 2 },
      ],
    });

    await prisma.resourceAmenity.createMany({
      data: [
        { resourceId: sala.id, name: "Projektor", icon: "projector" },
        { resourceId: sala.id, name: "Ekran", icon: "monitor" },
        { resourceId: sala.id, name: "Nag\u0142o\u015bnienie", icon: "speaker" },
        { resourceId: sala.id, name: "Wi-Fi", icon: "wifi" },
        { resourceId: sala.id, name: "Klimatyzacja", icon: "thermometer" },
      ],
    });
    console.log("  Created: Sala eventowa (+ 3 warianty)");
  } else { console.log("  Skip (exists): Sala eventowa"); }

  // ═══════════════════════════════════════
  // RESTAURACJA
  // ═══════════════════════════════════════
  console.log("\n--- Restauracja ---");
  const restoSlug = "restauracja";
  if (!(await prisma.resource.findUnique({ where: { slug: restoSlug } }))) {
    const resto = await prisma.resource.create({
      data: {
        name: "Restauracja",
        slug: restoSlug,
        categoryId: cats["restauracja"],
        description: "Restauracja z pe\u0142n\u0105 obs\u0142ug\u0105 gastronomiczn\u0105. Idealna na komunie, urodziny, jubileusze, spotkania firmowe.",
        maxCapacity: 60,
        totalUnits: 1,
        location: "Budynek g\u0142\u00f3wny - parter",
        status: "ACTIVE",
        sortOrder: 1,
      },
    });

    await prisma.resourceVariant.createMany({
      data: [
        { resourceId: resto.id, name: "Ca\u0142a sala", slug: "restauracja-cala", capacity: 60, basePrice: 3000, isDefault: true, isActive: true, sortOrder: 0 },
        { resourceId: resto.id, name: "P\u00f3\u0142 sali", slug: "restauracja-pol", capacity: 30, basePrice: 1800, isDefault: false, isActive: true, sortOrder: 1 },
      ],
    });
    console.log("  Created: Restauracja (+ 2 warianty)");
  } else { console.log("  Skip (exists): Restauracja"); }

  // ═══════════════════════════════════════
  // SPRZET WODNY
  // ═══════════════════════════════════════
  console.log("\n--- Sprz\u0119t wodny ---");
  const waterEquip = [
    { name: "Kajaki", slug: "kajaki", units: 7, desc: "Kajaki jednoosobowe i dwuosobowe", duration: 60, price: 40 },
    { name: "Rowerki wodne", slug: "rowerki-wodne", units: 3, desc: "Rowerki wodne 2-4 osobowe", duration: 60, price: 60 },
    { name: "Deski SUP", slug: "deski-sup", units: 7, desc: "Deski Stand Up Paddle", duration: 60, price: 35 },
  ];

  for (const eq of waterEquip) {
    if (await prisma.resource.findUnique({ where: { slug: eq.slug } })) {
      console.log("  Skip (exists):", eq.name); continue;
    }
    const resource = await prisma.resource.create({
      data: {
        name: eq.name,
        slug: eq.slug,
        categoryId: cats["sprzet-wodny"],
        description: eq.desc,
        totalUnits: eq.units,
        unitDuration: eq.duration,
        status: "ACTIVE",
        isSeasonal: true,
        seasonStart: 5,
        seasonEnd: 9,
        sortOrder: waterEquip.indexOf(eq) + 1,
      },
    });

    await prisma.resourceVariant.create({
      data: {
        resourceId: resource.id,
        name: "Wypo\u017cyczenie " + eq.duration + " min",
        slug: eq.slug + "-60min",
        capacity: eq.units,
        basePrice: eq.price,
        isDefault: true,
        isActive: true,
        sortOrder: 0,
      },
    });
    console.log("  Created:", eq.name, "(" + eq.units + " szt.)");
  }

  // ═══════════════════════════════════════
  // ATRAKCJE (przykladowe)
  // ═══════════════════════════════════════
  console.log("\n--- Atrakcje ---");
  const attractions = [
    { name: "Wyprawa quadowa", slug: "wyprawa-quadowa", desc: "Wyprawa quadami po okolicy - ok. 1.5h", min: 4, max: 12, duration: 90, price: 150 },
    { name: "Zaj\u0119cia ASG", slug: "zajecia-asg", desc: "Gra terenowa ASG z pe\u0142nym wyposa\u017ceniem", min: 8, max: 20, duration: 120, price: 120 },
    { name: "Sp\u0142yw kajakowy", slug: "splyw-kajakowy", desc: "Zorganizowany sp\u0142yw kajakowy z przewodnikiem", min: 4, max: 14, duration: 180, price: 100 },
    { name: "Ognisko z pieczeniem", slug: "ognisko", desc: "Ognisko ze smażeniem kie\u0142basek i pianek", min: 1, max: 50, duration: 120, price: 25 },
  ];

  for (const attr of attractions) {
    if (await prisma.resource.findUnique({ where: { slug: attr.slug } })) {
      console.log("  Skip (exists):", attr.name); continue;
    }
    const resource = await prisma.resource.create({
      data: {
        name: attr.name,
        slug: attr.slug,
        categoryId: cats["atrakcje"],
        description: attr.desc,
        minPersons: attr.min,
        maxPersons: attr.max,
        durationMinutes: attr.duration,
        totalUnits: 1,
        status: "ACTIVE",
        sortOrder: attractions.indexOf(attr) + 1,
      },
    });

    await prisma.resourceVariant.create({
      data: {
        resourceId: resource.id,
        name: "Za osob\u0119",
        slug: attr.slug + "-os",
        capacity: attr.max,
        basePrice: attr.price,
        isDefault: true,
        isActive: true,
        sortOrder: 0,
      },
    });
    console.log("  Created:", attr.name);
  }

  // ═══════════════════════════════════════
  // DODATKI (Addons)
  // ═══════════════════════════════════════
  console.log("\n--- Dodatki ---");
  const addons = [
    { name: "\u015aniadanie", pricingType: "PER_PERSON_NIGHT", price: 35, desc: "Bufet \u015bniadaniowy" },
    { name: "Obiad", pricingType: "PER_PERSON", price: 55, desc: "Dwudaniowy obiad" },
    { name: "Kolacja", pricingType: "PER_PERSON", price: 65, desc: "Kolacja z deserem" },
    { name: "Pe\u0142ne wy\u017cywienie", pricingType: "PER_PERSON_NIGHT", price: 140, desc: "\u015aniadanie + obiad + kolacja" },
    { name: "Sprz\u0105tanie ko\u0144cowe", pricingType: "PER_BOOKING", price: 150, desc: "Profesjonalne sprz\u0105tanie po wymeldowaniu" },
    { name: "Po\u015bciel i r\u0119czniki", pricingType: "PER_BOOKING", price: 30, desc: "Komplet po\u015bcieli i r\u0119cznik\u00f3w" },
    { name: "Drewno na ognisko", pricingType: "PER_UNIT", price: 40, desc: "Worek drewna na ognisko/grill" },
    { name: "Parking premium", pricingType: "PER_NIGHT", price: 20, desc: "Parking ogrodzony przy domku" },
    { name: "Wczesne zameldowanie", pricingType: "PER_BOOKING", price: 100, desc: "Check-in od 12:00 zamiast 15:00" },
    { name: "P\u00f3\u017ane wymeldowanie", pricingType: "PER_BOOKING", price: 100, desc: "Check-out do 14:00 zamiast 11:00" },
  ];

  for (let i = 0; i < addons.length; i++) {
    const a = addons[i];
    const existing = await prisma.addon.findFirst({ where: { name: a.name } });
    if (existing) { console.log("  Skip (exists):", a.name); continue; }
    await prisma.addon.create({
      data: { name: a.name, description: a.desc, pricingType: a.pricingType, price: a.price, isActive: true, sortOrder: i + 1 },
    });
    console.log("  Created:", a.name, "-", a.price, "PLN");
  }

  // ═══════════════════════════════════════
  // PODSUMOWANIE
  // ═══════════════════════════════════════
  const totalResources = await prisma.resource.count();
  const totalVariants = await prisma.resourceVariant.count();
  const totalAmenities = await prisma.resourceAmenity.count();
  const totalAddons = await prisma.addon.count();

  console.log("\n========================================");
  console.log("SEED COMPLETE!");
  console.log("  Zasoby:       " + totalResources);
  console.log("  Warianty:     " + totalVariants);
  console.log("  Udogodnienia: " + totalAmenities);
  console.log("  Dodatki:      " + totalAddons);
  console.log("========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
