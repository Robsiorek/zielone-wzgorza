/**
 * Seed — Zielone Wzgórza Admin Panel
 * Unified Reservation System v5.0
 *
 * Run: npx prisma db seed  (or: npx tsx prisma/seed.ts)
 *
 * Creates:
 *   - Property (Zielone Wzgórza)
 *   - Admin user
 *   - Resource categories: ACCOMMODATION (domki, pokoje), TIME_SLOT (sala, restauracja), QUANTITY_TIME (kajaki)
 *   - 10 domków + 4 pokoje + 1 sala + 1 restauracja + 20 kajaków
 *   - 3 clients
 *   - Sequences: reservation_number_seq, client_number_seq
 *   - 9 sample reservations (including all types + edge cases)
 *   - Company settings (with reservation settings)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database (v5.0)...\n");

  // ── 0. Clean everything ──
  console.log("  🗑️  Cleaning existing data...");
  const tables = [
    "timeline_entries", "reservation_status_logs", "reservation_notes",
    "reservation_items", "reservation_addons", "offer_details",
    "booking_details", "payment_schedules", "payments", "reservations",
    "client_activities", "client_notes", "client_tags", "client_consents",
    "client_guest_profiles", "client_billing_profiles", "client_stats",
    "client_accounts", "clients",
    "resource_amenities", "resource_images", "resource_variants",
    "resources", "resource_categories", "properties",
    "sessions", "users", "company_settings",
    "notification_events", "notifications",
  ];
  for (const t of tables) {
    try { await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${t} CASCADE`); } catch {}
  }

  // ── 1. Sequences ──
  console.log("  🔢 Creating sequences...");
  await prisma.$executeRaw`DROP SEQUENCE IF EXISTS reservation_number_seq`;
  await prisma.$executeRaw`CREATE SEQUENCE reservation_number_seq START WITH 1`;
  await prisma.$executeRaw`DROP SEQUENCE IF EXISTS client_number_seq`;
  await prisma.$executeRaw`CREATE SEQUENCE client_number_seq START WITH 4`;

  // ── 2. Property ──
  console.log("  🏞️  Creating property...");
  const property = await prisma.property.create({
    data: {
      name: "Zielone Wzgórza",
      address: "ul. Leśna 1",
      city: "Przywidz",
      postalCode: "83-047",
      country: "PL",
      phone: "+48 123 456 789",
      email: "kontakt@zielonewzgorza.eu",
      website: "https://zielonewzgorza.eu",
    },
  });

  // ── 3. Admin user ──
  console.log("  👤 Creating admin user...");
  const hashedPassword = await bcrypt.hash("Admin123!", 10);
  await prisma.user.create({
    data: {
      email: "admin@zielonewzgorza.eu",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "Zielone Wzgórza",
      role: "OWNER",
    },
  });

  // ── 4. Company settings ──
  console.log("  🏢 Creating company settings...");
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Zielone Wzgórza",
      email: "kontakt@zielonewzgorza.eu",
      phone: "+48 123 456 789",
      website: "https://zielonewzgorza.eu",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      paymentDeadlineHours: 24,
      paymentDeadlineAction: "CANCEL",
      requiredDepositPercent: 30,
      minInstallmentAmount: 10000,
      overdueNotificationHours: 12,
    },
  });

  // ── 5. Resource categories (3 types) ──
  console.log("  📂 Creating resource categories...");
  const catDomki = await prisma.resourceCategory.create({
    data: { name: "Domki", slug: "domki", type: "ACCOMMODATION", icon: "home", sortOrder: 1 },
  });
  const catPokoje = await prisma.resourceCategory.create({
    data: { name: "Pokoje", slug: "pokoje", type: "ACCOMMODATION", icon: "bed-double", sortOrder: 2 },
  });
  const catSale = await prisma.resourceCategory.create({
    data: { name: "Sale", slug: "sale", type: "TIME_SLOT", icon: "presentation", sortOrder: 3 },
  });
  const catRestauracja = await prisma.resourceCategory.create({
    data: { name: "Restauracja", slug: "restauracja", type: "TIME_SLOT", icon: "utensils", sortOrder: 4 },
  });
  const catKajaki = await prisma.resourceCategory.create({
    data: { name: "Kajaki", slug: "kajaki", type: "QUANTITY_TIME", icon: "sailboat", sortOrder: 5 },
  });

  // ── 6. Resources ──
  console.log("  🏠 Creating resources...");

  // ACCOMMODATION: 10 domków + 4 pokoje
  const domki: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const capacity = i <= 6 ? 6 : i <= 8 ? 8 : 10;
    domki.push(await prisma.resource.create({
      data: {
        propertyId: property.id, categoryId: catDomki.id,
        name: `Domek ${i}`, slug: `domek-${i}`, unitNumber: `D${i}`,
        status: "ACTIVE", sortOrder: i, maxCapacity: capacity,
      },
    }));
  }
  const pokoje: any[] = [];
  for (let i = 1; i <= 4; i++) {
    const capacity = i <= 2 ? 2 : 4;
    pokoje.push(await prisma.resource.create({
      data: {
        propertyId: property.id, categoryId: catPokoje.id,
        name: `Pokój ${i}`, slug: `pokoj-${i}`, unitNumber: `P${i}`,
        status: "ACTIVE", sortOrder: i, maxCapacity: capacity,
      },
    }));
  }

  // TIME_SLOT: sala konferencyjna + restauracja
  const sala = await prisma.resource.create({
    data: {
      propertyId: property.id, categoryId: catSale.id,
      name: "Sala konferencyjna", slug: "sala-konferencyjna",
      status: "ACTIVE", sortOrder: 1, maxCapacity: 50, durationMinutes: 60,
    },
  });
  const restauracja = await prisma.resource.create({
    data: {
      propertyId: property.id, categoryId: catRestauracja.id,
      name: "Restauracja", slug: "restauracja",
      status: "ACTIVE", sortOrder: 1, maxCapacity: 80, durationMinutes: 240,
    },
  });

  // QUANTITY_TIME: kajaki (20 sztuk)
  const kajaki = await prisma.resource.create({
    data: {
      propertyId: property.id, categoryId: catKajaki.id,
      name: "Kajak", slug: "kajak",
      status: "ACTIVE", sortOrder: 1, totalUnits: 20, durationMinutes: 60,
    },
  });

  // ── 7. Clients ──
  console.log("  👥 Creating 3 clients...");
  const clientInd = await prisma.client.create({
    data: {
      clientNumber: "KL-0001", type: "INDIVIDUAL",
      firstName: "Jan", lastName: "Kowalski",
      email: "jan.kowalski@example.com", phone: "+48 600 100 200",
      city: "Warszawa", postalCode: "00-001", source: "PHONE",
    },
  });
  const clientCorp = await prisma.client.create({
    data: {
      clientNumber: "KL-0002", type: "COMPANY",
      companyName: "TechCorp Sp. z o.o.", nip: "5271234567",
      contactFirstName: "Anna", contactLastName: "Nowak",
      email: "anna.nowak@techcorp.pl", phone: "+48 600 300 400",
      city: "Kraków", source: "EMAIL", segment: "CORPORATE",
    },
  });
  const clientGroup = await prisma.client.create({
    data: {
      clientNumber: "KL-0003", type: "GROUP",
      firstName: "Piotr", lastName: "Wiśniewski",
      companyName: "Szkoła Podstawowa nr 5",
      email: "p.wisniewski@sp5.edu.pl", phone: "+48 600 500 600",
      city: "Gdańsk", source: "EMAIL",
    },
  });

  // ── Helper ──
  async function nextNum(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const r: any[] = await prisma.$queryRaw`SELECT nextval('reservation_number_seq') as num`;
    return `${prefix}-${year}-${String(Number(r[0].num)).padStart(4, "0")}`;
  }

  // ══════════════════════════════════════════════════════════════════
  // 8. RESERVATIONS (9 samples covering all types and edge cases)
  // ══════════════════════════════════════════════════════════════════

  console.log("  📋 Creating reservations...\n");

  // ── 8a. BOOKING CONFIRMED — Domek 1, next week ──
  const bkNum1 = await nextNum("ZW");
  const bk1 = await prisma.reservation.create({
    data: {
      number: bkNum1, type: "BOOKING", status: "CONFIRMED",
      propertyId: property.id, clientId: clientInd.id, source: "PHONE",
      checkIn: new Date("2026-04-06T00:00:00.000Z"),
      checkOut: new Date("2026-04-13T00:00:00.000Z"),
      nights: 7, adults: 2, children: 1, subtotal: 2450, total: 2450,
      guestNotes: "Proszę o dodatkowe łóżko dziecięce",
      items: {
        create: {
          resourceId: domki[0].id, categoryType: "ACCOMMODATION",
          startAt: new Date("2026-04-06T00:00:00.000Z"),
          endAt: new Date("2026-04-13T00:00:00.000Z"),
          pricePerUnit: 350, totalPrice: 2450, adults: 2, children: 1,
        },
      },
      bookingDetails: { create: { confirmedAt: new Date(), paidAmount: 0, balanceDue: 2450 } },
      statusLogs: { create: { toStatus: "CONFIRMED", action: "CREATED", note: "Rezerwacja utworzona", changedBy: "ADMIN" } },
    },
    include: { items: true },
  });
  await prisma.timelineEntry.create({
    data: {
      type: "BOOKING", status: "ACTIVE", resourceId: domki[0].id,
      startAt: new Date("2026-04-06T00:00:00.000Z"),
      endAt: new Date("2026-04-13T00:00:00.000Z"),
      reservationId: bk1.id, reservationItemId: bk1.items[0].id,
      label: `Rezerwacja ${bkNum1}`,
    },
  });
  console.log(`     ${bkNum1} — BOOKING CONFIRMED (Domek 1, 6-13 kwie)`);

  // ── 8b. BOOKING CONFIRMED partially paid — Domek 2 ──
  const bkNum2 = await nextNum("ZW");
  const bk2 = await prisma.reservation.create({
    data: {
      number: bkNum2, type: "BOOKING", status: "CONFIRMED",
      propertyId: property.id, paymentStatus: "PARTIAL",
      clientId: clientCorp.id, source: "EMAIL",
      checkIn: new Date("2026-04-14T00:00:00.000Z"),
      checkOut: new Date("2026-04-28T00:00:00.000Z"),
      nights: 14, adults: 4, subtotal: 5600, discount: 400, total: 5200,
      internalNotes: "Firma TechCorp, integracja. Wpłacono zaliczkę 2000 PLN.",
      items: {
        create: {
          resourceId: domki[1].id, categoryType: "ACCOMMODATION",
          startAt: new Date("2026-04-14T00:00:00.000Z"),
          endAt: new Date("2026-04-28T00:00:00.000Z"),
          pricePerUnit: 400, totalPrice: 5600, adults: 4,
        },
      },
      bookingDetails: { create: { confirmedAt: new Date(), paidAmount: 2000, balanceDue: 3200 } },
      statusLogs: { create: { toStatus: "CONFIRMED", action: "CREATED", note: "Rezerwacja z zaliczką", changedBy: "ADMIN" } },
    },
    include: { items: true },
  });
  await prisma.timelineEntry.create({
    data: {
      type: "BOOKING", status: "ACTIVE", resourceId: domki[1].id,
      startAt: new Date("2026-04-14T00:00:00.000Z"),
      endAt: new Date("2026-04-28T00:00:00.000Z"),
      reservationId: bk2.id, reservationItemId: bk2.items[0].id,
      label: `Rezerwacja ${bkNum2}`,
    },
  });
  console.log(`     ${bkNum2} — BOOKING CONFIRMED partially paid (Domek 2, 14-28 kwie)`);

  // ── 8c. OFFER PENDING — Domek 3+4, multi-resource ──
  const ofNum1 = await nextNum("OF");
  const of1 = await prisma.reservation.create({
    data: {
      number: ofNum1, type: "OFFER", status: "PENDING",
      propertyId: property.id, clientId: clientCorp.id, source: "EMAIL",
      checkIn: new Date("2026-04-20T00:00:00.000Z"),
      checkOut: new Date("2026-04-27T00:00:00.000Z"),
      nights: 7, adults: 8, subtotal: 5250, total: 5250,
      internalNotes: "Pobyt integracyjny TechCorp",
      items: {
        create: [
          { resourceId: domki[2].id, categoryType: "ACCOMMODATION", startAt: new Date("2026-04-20T00:00:00.000Z"), endAt: new Date("2026-04-27T00:00:00.000Z"), pricePerUnit: 400, totalPrice: 2800, adults: 4, sortOrder: 0 },
          { resourceId: domki[3].id, categoryType: "ACCOMMODATION", startAt: new Date("2026-04-20T00:00:00.000Z"), endAt: new Date("2026-04-27T00:00:00.000Z"), pricePerUnit: 350, totalPrice: 2450, adults: 4, sortOrder: 1 },
        ],
      },
      offerDetails: {
        create: { token: randomBytes(32).toString("hex"), expiresAt: new Date("2026-04-15T00:00:00.000Z"), expiryAction: "CANCEL" },
      },
      statusLogs: { create: { toStatus: "PENDING", action: "CREATED", note: "Oferta utworzona", changedBy: "ADMIN" } },
    },
    include: { items: true },
  });
  for (let i = 0; i < of1.items.length; i++) {
    await prisma.timelineEntry.create({
      data: {
        type: "OFFER", status: "ACTIVE", resourceId: of1.items[i].resourceId,
        startAt: new Date("2026-04-20T00:00:00.000Z"),
        endAt: new Date("2026-04-27T00:00:00.000Z"),
        reservationId: of1.id, reservationItemId: of1.items[i].id,
        label: `Oferta ${ofNum1}`,
      },
    });
  }
  console.log(`     ${ofNum1} — OFFER PENDING (Domek 3+4, 20-27 kwie)`);

  // ── 8d. OFFER EXPIRED ──
  const ofNum2 = await nextNum("OF");
  const of2 = await prisma.reservation.create({
    data: {
      number: ofNum2, type: "OFFER", status: "EXPIRED",
      propertyId: property.id, clientId: clientInd.id, source: "PHONE",
      checkIn: new Date("2026-03-10T00:00:00.000Z"),
      checkOut: new Date("2026-03-15T00:00:00.000Z"),
      nights: 5, adults: 2, subtotal: 1750, total: 1750,
      items: {
        create: {
          resourceId: domki[4].id, categoryType: "ACCOMMODATION",
          startAt: new Date("2026-03-10T00:00:00.000Z"),
          endAt: new Date("2026-03-15T00:00:00.000Z"),
          pricePerUnit: 350, totalPrice: 1750, adults: 2,
        },
      },
      offerDetails: {
        create: { token: randomBytes(32).toString("hex"), expiresAt: new Date("2026-03-08T00:00:00.000Z"), expiryAction: "CANCEL", expiredAt: new Date("2026-03-08T00:00:00.000Z") },
      },
      statusLogs: { create: [
        { toStatus: "PENDING", action: "CREATED", note: "Oferta utworzona", changedBy: "ADMIN" },
        { fromStatus: "PENDING", toStatus: "EXPIRED", action: "STATUS_CHANGE", note: "Oferta wygasła", changedBy: "SYSTEM" },
      ]},
    },
    include: { items: true },
  });
  await prisma.timelineEntry.create({
    data: {
      type: "OFFER", status: "CANCELLED", resourceId: domki[4].id,
      startAt: new Date("2026-03-10T00:00:00.000Z"),
      endAt: new Date("2026-03-15T00:00:00.000Z"),
      reservationId: of2.id, reservationItemId: of2.items[0].id,
      label: `Oferta ${ofNum2}`,
    },
  });
  console.log(`     ${ofNum2} — OFFER EXPIRED (Domek 5, 10-15 mar)`);

  // ── 8e. BLOCK — Obozy letnie (Domki 5-10) ──
  const blNum1 = await nextNum("BL");
  const bl1 = await prisma.reservation.create({
    data: {
      number: blNum1, type: "BLOCK", status: "CONFIRMED",
      propertyId: property.id, source: "OTHER",
      checkIn: new Date("2026-07-01T00:00:00.000Z"),
      checkOut: new Date("2026-08-31T00:00:00.000Z"),
      nights: 61,
      internalNotes: "Obozy letnie — blokada domków 5-10",
      items: {
        create: [5, 6, 7, 8, 9, 10].map((i, idx) => ({
          resourceId: domki[i - 1].id, categoryType: "ACCOMMODATION" as const,
          startAt: new Date("2026-07-01T00:00:00.000Z"),
          endAt: new Date("2026-08-31T00:00:00.000Z"),
          sortOrder: idx,
        })),
      },
      statusLogs: { create: { toStatus: "CONFIRMED", action: "CREATED", note: "Blokada na obozy letnie", changedBy: "ADMIN" } },
    },
    include: { items: true },
  });
  for (const item of bl1.items) {
    await prisma.timelineEntry.create({
      data: {
        type: "BLOCK", status: "ACTIVE", resourceId: item.resourceId,
        startAt: new Date("2026-07-01T00:00:00.000Z"),
        endAt: new Date("2026-08-31T00:00:00.000Z"),
        reservationId: bl1.id, reservationItemId: item.id,
        label: "Obozy letnie", note: "Blokada na sezon obozowy",
      },
    });
  }
  console.log(`     ${blNum1} — BLOCK obozy letnie (Domki 5-10, lip-sie)`);

  // ── 8f. BLOCK — Maintenance (Pokój 1) ──
  const blNum2 = await nextNum("BL");
  const bl2 = await prisma.reservation.create({
    data: {
      number: blNum2, type: "BLOCK", status: "CONFIRMED",
      propertyId: property.id, source: "OTHER",
      checkIn: new Date("2026-04-01T00:00:00.000Z"),
      checkOut: new Date("2026-04-14T00:00:00.000Z"),
      nights: 13,
      internalNotes: "Remont łazienki",
      items: {
        create: {
          resourceId: pokoje[0].id, categoryType: "ACCOMMODATION",
          startAt: new Date("2026-04-01T00:00:00.000Z"),
          endAt: new Date("2026-04-14T00:00:00.000Z"),
        },
      },
      statusLogs: { create: { toStatus: "CONFIRMED", action: "CREATED", note: "Blokada na remont", changedBy: "ADMIN" } },
    },
    include: { items: true },
  });
  await prisma.timelineEntry.create({
    data: {
      type: "BLOCK", status: "ACTIVE", resourceId: pokoje[0].id,
      startAt: new Date("2026-04-01T00:00:00.000Z"),
      endAt: new Date("2026-04-14T00:00:00.000Z"),
      reservationId: bl2.id, reservationItemId: bl2.items[0].id,
      label: "Remont", note: "Remont łazienki",
    },
  });
  console.log(`     ${blNum2} — BLOCK maintenance (Pokój 1, 1-14 kwie)`);

  // ── 8g. BOOKING CANCELLED ──
  const bkNum3 = await nextNum("ZW");
  const bk3 = await prisma.reservation.create({
    data: {
      number: bkNum3, type: "BOOKING", status: "CANCELLED",
      propertyId: property.id, clientId: clientGroup.id, source: "EMAIL",
      checkIn: new Date("2026-05-01T00:00:00.000Z"),
      checkOut: new Date("2026-05-04T00:00:00.000Z"),
      nights: 3, adults: 20, subtotal: 6000, total: 6000,
      cancelledAt: new Date("2026-03-20T00:00:00.000Z"),
      cancelReason: "Zmiana planów szkoły", cancelledBy: "CLIENT",
      items: {
        create: [
          { resourceId: domki[4].id, categoryType: "ACCOMMODATION", startAt: new Date("2026-05-01T00:00:00.000Z"), endAt: new Date("2026-05-04T00:00:00.000Z"), pricePerUnit: 500, totalPrice: 1500, adults: 10, sortOrder: 0 },
          { resourceId: domki[5].id, categoryType: "ACCOMMODATION", startAt: new Date("2026-05-01T00:00:00.000Z"), endAt: new Date("2026-05-04T00:00:00.000Z"), pricePerUnit: 500, totalPrice: 1500, adults: 10, sortOrder: 1 },
        ],
      },
      bookingDetails: { create: { balanceDue: 6000 } },
      statusLogs: { create: [
        { toStatus: "PENDING", action: "CREATED", note: "Rezerwacja grupowa", changedBy: "ADMIN" },
        { fromStatus: "PENDING", toStatus: "CANCELLED", action: "STATUS_CHANGE", note: "Zmiana planów szkoły", changedBy: "CLIENT" },
      ]},
    },
    include: { items: true },
  });
  for (const item of bk3.items) {
    await prisma.timelineEntry.create({
      data: {
        type: "BOOKING", status: "CANCELLED", resourceId: item.resourceId,
        startAt: new Date("2026-05-01T00:00:00.000Z"),
        endAt: new Date("2026-05-04T00:00:00.000Z"),
        reservationId: bk3.id, reservationItemId: item.id,
        label: `Rezerwacja ${bkNum3}`,
      },
    });
  }
  console.log(`     ${bkNum3} — BOOKING CANCELLED (Domki 5+6, 1-4 maj)`);

  // ── 8h. TIME_SLOT — Sala konferencyjna (rezerwacja godzinowa) ──
  const bkNum4 = await nextNum("ZW");
  const bk4 = await prisma.reservation.create({
    data: {
      number: bkNum4, type: "BOOKING", status: "CONFIRMED",
      propertyId: property.id, clientId: clientCorp.id, source: "PHONE",
      checkIn: new Date("2026-04-10T09:00:00.000Z"),
      checkOut: new Date("2026-04-10T17:00:00.000Z"),
      nights: 0, adults: 30, subtotal: 2000, total: 2000,
      internalNotes: "Szkolenie TechCorp — cały dzień",
      items: {
        create: {
          resourceId: sala.id, categoryType: "TIME_SLOT",
          startAt: new Date("2026-04-10T09:00:00.000Z"),
          endAt: new Date("2026-04-10T17:00:00.000Z"),
          pricePerUnit: 250, totalPrice: 2000, adults: 30,
        },
      },
      bookingDetails: { create: { confirmedAt: new Date(), paidAmount: 2000, balanceDue: 0 } },
      statusLogs: { create: { toStatus: "CONFIRMED", action: "CREATED", note: "Rezerwacja sali", changedBy: "ADMIN" } },
    },
    include: { items: true },
  });
  await prisma.timelineEntry.create({
    data: {
      type: "BOOKING", status: "ACTIVE", resourceId: sala.id,
      startAt: new Date("2026-04-10T09:00:00.000Z"),
      endAt: new Date("2026-04-10T17:00:00.000Z"),
      reservationId: bk4.id, reservationItemId: bk4.items[0].id,
      label: `Sala ${bkNum4}`,
    },
  });
  console.log(`     ${bkNum4} — BOOKING TIME_SLOT (Sala, 10 kwie 9:00-17:00)`);

  // ── 8i. QUANTITY_TIME — Kajaki (5 sztuk na 2h) ──
  const bkNum5 = await nextNum("ZW");
  const bk5 = await prisma.reservation.create({
    data: {
      number: bkNum5, type: "BOOKING", status: "CONFIRMED",
      propertyId: property.id, clientId: clientInd.id, source: "WALK_IN",
      checkIn: new Date("2026-04-12T10:00:00.000Z"),
      checkOut: new Date("2026-04-12T12:00:00.000Z"),
      nights: 0, adults: 5, subtotal: 500, total: 500,
      items: {
        create: {
          resourceId: kajaki.id, categoryType: "QUANTITY_TIME",
          startAt: new Date("2026-04-12T10:00:00.000Z"),
          endAt: new Date("2026-04-12T12:00:00.000Z"),
          quantity: 5, pricePerUnit: 50, totalPrice: 500, adults: 5,
        },
      },
      bookingDetails: { create: { confirmedAt: new Date(), paidAmount: 500, balanceDue: 0 } },
      statusLogs: { create: { toStatus: "CONFIRMED", action: "CREATED", note: "Kajaki — walk-in", changedBy: "ADMIN" } },
    },
    include: { items: true },
  });
  await prisma.timelineEntry.create({
    data: {
      type: "BOOKING", status: "ACTIVE", resourceId: kajaki.id,
      startAt: new Date("2026-04-12T10:00:00.000Z"),
      endAt: new Date("2026-04-12T12:00:00.000Z"),
      quantityReserved: 5,
      reservationId: bk5.id, reservationItemId: bk5.items[0].id,
      label: `Kajaki ${bkNum5}`,
    },
  });
  console.log(`     ${bkNum5} — BOOKING QUANTITY_TIME (5 kajaków, 12 kwie 10:00-12:00)`);

  // ── Summary ──
  console.log("\n✅ Seed complete!");
  console.log(`  🏞️  Property: Zielone Wzgórza`);
  console.log(`  👤 Admin: admin@zielonewzgorza.eu / Admin123!`);
  console.log(`  🏠 Resources: 10 domków + 4 pokoje + 1 sala + 1 restauracja + 20 kajaków`);
  console.log(`  👥 Clients: KL-0001 (Kowalski), KL-0002 (TechCorp), KL-0003 (SP5)`);
  console.log(`  📋 9 reservations (ACCOMMODATION + TIME_SLOT + QUANTITY_TIME + blocks + cancelled + expired)`);
  console.log(`  🔢 Sequences: reservation_number_seq (current: 9), client_number_seq (start: 4)\n`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
