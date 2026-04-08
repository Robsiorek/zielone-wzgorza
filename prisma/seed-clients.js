const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding clients module...\n");

  // Tags
  const tagNames = [
    { name: "VIP", color: "#7C3AED" },
    { name: "Sta\u0142y klient", color: "#059669" },
    { name: "Firma", color: "#2563EB" },
    { name: "Szko\u0142a", color: "#F59E0B" },
    { name: "Grupa", color: "#EC4899" },
    { name: "Problematyczny", color: "#DC2626" },
  ];
  const tags = {};
  for (const t of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name: t.name },
      update: {},
      create: { name: t.name, color: t.color },
    });
    tags[t.name] = tag.id;
    console.log("Tag:", t.name);
  }

  // Check existing
  const existing = await prisma.client.count();
  if (existing > 0) {
    console.log("\nClients already exist (" + existing + "), skipping...");
    return;
  }

  // Clients
  const clients = [
    {
      type: "INDIVIDUAL", status: "ACTIVE", segment: "VIP", source: "REFERRAL",
      firstName: "Jan", lastName: "Kowalski", email: "jan.kowalski@example.com", phone: "+48 600 111 222",
      address: "ul. Przyk\u0142adowa 1", postalCode: "00-001", city: "Warszawa", country: "PL", language: "pl",
      tagNames: ["VIP", "Sta\u0142y klient"],
    },
    {
      type: "INDIVIDUAL", status: "ACTIVE", segment: "REGULAR", source: "GOOGLE_ADS",
      firstName: "Anna", lastName: "Nowak", email: "anna.nowak@example.com", phone: "+48 601 222 333",
      city: "Krak\u00f3w", country: "PL", language: "pl",
      tagNames: ["Sta\u0142y klient"],
    },
    {
      type: "COMPANY", status: "ACTIVE", segment: "CORPORATE", source: "SALES",
      companyName: "TechCorp Sp. z o.o.", nip: "1234567890",
      contactFirstName: "Piotr", contactLastName: "Wi\u015bniewski",
      email: "biuro@techcorp.pl", phone: "+48 22 111 22 33",
      address: "ul. Biznesowa 15", postalCode: "02-001", city: "Warszawa", country: "PL", language: "pl",
      tagNames: ["Firma"],
    },
    {
      type: "INDIVIDUAL", status: "LEAD", segment: "STANDARD", source: "FACEBOOK",
      firstName: "Maria", lastName: "Zieli\u0144ska", email: "maria.z@example.com", phone: "+48 602 333 444",
      city: "Pozna\u0144", country: "PL", language: "pl",
      tagNames: [],
    },
    {
      type: "COMPANY", status: "ACTIVE", segment: "GROUP", source: "PHONE",
      companyName: "Szko\u0142a Podstawowa nr 5", contactFirstName: "Ewa", contactLastName: "Kaczmarek",
      email: "sp5@szkola.pl", phone: "+48 61 555 66 77",
      city: "Wroc\u0142aw", country: "PL", language: "pl",
      tagNames: ["Szko\u0142a", "Grupa"],
    },
    {
      type: "INDIVIDUAL", status: "BLOCKED", segment: "STANDARD", source: "MANUAL",
      firstName: "Tomasz", lastName: "D\u0105browski", email: "t.dabrowski@example.com", phone: "+48 603 444 555",
      city: "Gda\u0144sk", country: "PL", language: "pl",
      tagNames: ["Problematyczny"],
    },
    {
      type: "INDIVIDUAL", status: "ARCHIVED", segment: "STANDARD", source: "SEO",
      firstName: "Katarzyna", lastName: "W\u00f3jcik", email: "k.wojcik@example.com",
      city: "\u0141\u00f3d\u017a", country: "PL", language: "pl",
      tagNames: [],
    },
    {
      type: "INDIVIDUAL", status: "VIP", segment: "VIP", source: "REFERRAL",
      firstName: "Marek", lastName: "Lewandowski", email: "marek.l@example.com", phone: "+48 604 555 666",
      address: "ul. Sosnowa 8", postalCode: "40-001", city: "Katowice", country: "PL", language: "pl",
      tagNames: ["VIP", "Sta\u0142y klient"],
    },
  ];

  let counter = 0;
  for (const c of clients) {
    counter++;
    const clientNumber = "KL-" + String(counter).padStart(4, "0");
    const { tagNames: tNames, ...clientData } = c;

    const client = await prisma.client.create({
      data: {
        ...clientData,
        clientNumber,
        tags: tNames.length > 0 ? { create: tNames.map(n => ({ tagId: tags[n] })) } : undefined,
        activities: { create: { action: "CREATED", description: "Klient utworzony (seed)" } },
      },
    });

    // Add consent for some
    if (counter <= 5) {
      await prisma.clientConsent.create({
        data: { clientId: client.id, newsletter: counter % 2 === 0, phoneContact: counter <= 3, marketing: counter <= 2 },
      });
    }

    console.log("  " + clientNumber + " " + (c.companyName || c.firstName + " " + c.lastName));
  }

  const total = await prisma.client.count();
  const tagCount = await prisma.tag.count();
  console.log("\n========================================");
  console.log("SEED COMPLETE!");
  console.log("Klienci:", total);
  console.log("Tagi:", tagCount);
  console.log("========================================");
}

main().catch(console.error).finally(() => prisma.$disconnect());
