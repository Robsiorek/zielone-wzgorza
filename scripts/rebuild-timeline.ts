/**
 * Timeline Rebuild Command
 *
 * Naprawia ACTIVE timeline state dla pojedynczej rezerwacji.
 * Source of truth: reservation + reservation_items.
 *
 * Usage:
 *   npx tsx scripts/rebuild-timeline.ts --reservationId=cmn...
 *   npx tsx scripts/rebuild-timeline.ts --reservationId=cmn... --apply
 *
 * Default: dry-run (analiza bez zmian).
 * --apply: wykonuje rebuild (atomic — albo wszystko albo nic).
 *
 * Uruchamiany na serwerze przez SSH (shell access = implicit OWNER auth).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Types ──

interface RebuildReport {
  reservationId: string;
  reservationNumber: string;
  status: string;
  type: string;
  dryRun: boolean;
  before: {
    activeEntries: number;
    cancelledEntries: number;
  };
  expected: {
    shouldHaveTimeline: boolean;
    itemCount: number;
  };
  after: {
    action: "rebuild" | "cleanup" | "no_change";
    entriesCreated: number;
    entriesCancelled: number;
  };
  conflicts: Array<{
    itemId: string;
    resourceId: string;
    resourceName: string;
    conflictWith: string;
  }>;
  success: boolean;
  error?: string;
}

// ── Helpers ──

function toTimelineType(type: string): "BOOKING" | "OFFER" | "BLOCK" {
  if (type === "BOOKING" || type === "OFFER" || type === "BLOCK") return type;
  throw new Error(`Nieprawidłowy typ: ${type}`);
}

function getTimelineLabel(type: string, number: string): string {
  if (type === "BLOCK") return `Blokada ${number}`;
  if (type === "OFFER") return `Oferta ${number}`;
  return number;
}

// Statuses that should have ACTIVE timeline entries
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "NO_SHOW"];

// ── Main rebuild logic ──

async function rebuildTimeline(reservationId: string, apply: boolean): Promise<RebuildReport> {
  return prisma.$transaction(async (tx) => {
    // 1. Lock reservation row
    const locked: Array<{ id: string; status: string; type: string; number: string }> =
      await tx.$queryRaw`
        SELECT id, status, type, number FROM reservations
        WHERE id = ${reservationId}
        FOR UPDATE
      `;

    if (locked.length === 0) {
      return {
        reservationId,
        reservationNumber: "?",
        status: "?",
        type: "?",
        dryRun: !apply,
        before: { activeEntries: 0, cancelledEntries: 0 },
        expected: { shouldHaveTimeline: false, itemCount: 0 },
        after: { action: "no_change", entriesCreated: 0, entriesCancelled: 0 },
        conflicts: [],
        success: false,
        error: "Rezerwacja nie znaleziona",
      };
    }

    const reservation = locked[0];
    const shouldHaveTimeline = ACTIVE_STATUSES.includes(reservation.status);

    // 2. Load reservation items
    const items = await tx.reservationItem.findMany({
      where: { reservationId },
      select: {
        id: true,
        resourceId: true,
        startAt: true,
        endAt: true,
        categoryType: true,
        quantity: true,
        resource: { select: { name: true } },
      },
    });

    // 3. Count existing timeline entries
    const activeEntries = await tx.timelineEntry.count({
      where: { reservationId, status: "ACTIVE" },
    });
    const cancelledEntries = await tx.timelineEntry.count({
      where: { reservationId, status: "CANCELLED" },
    });

    const report: RebuildReport = {
      reservationId,
      reservationNumber: reservation.number,
      status: reservation.status,
      type: reservation.type,
      dryRun: !apply,
      before: { activeEntries, cancelledEntries },
      expected: { shouldHaveTimeline, itemCount: items.length },
      after: { action: "no_change", entriesCreated: 0, entriesCancelled: 0 },
      conflicts: [],
      success: true,
    };

    // 4. Determine action
    if (!shouldHaveTimeline) {
      // CANCELLED/EXPIRED/FINISHED — should have zero ACTIVE entries
      if (activeEntries === 0) {
        report.after.action = "no_change";
        return report;
      }
      // Cleanup: cancel orphan ACTIVE entries
      report.after.action = "cleanup";
      report.after.entriesCancelled = activeEntries;

      if (apply) {
        await tx.timelineEntry.updateMany({
          where: { reservationId, status: "ACTIVE" },
          data: { status: "CANCELLED" },
        });
        // Audit
        await tx.auditLog.create({
          data: {
            action: "TIMELINE_REBUILD",
            entity: "Reservation",
            entityId: reservationId,
            userId: "SYSTEM_CLI",
            changes: { type: "cleanup", cancelledEntries: activeEntries },
          },
        });
      }

      return report;
    }

    // 5. Should have timeline — check for conflicts with OTHER reservations
    for (const item of items) {
      const overlapping: Array<{ id: string; reservationId: string }> = await tx.$queryRaw`
        SELECT te.id, te."reservationId"
        FROM timeline_entries te
        WHERE te."resourceId" = ${item.resourceId}
          AND te.status = 'ACTIVE'
          AND te."reservationId" != ${reservationId}
          AND te."startAt" < ${item.endAt}
          AND te."endAt" > ${item.startAt}
        LIMIT 1
      `;

      if (overlapping.length > 0) {
        report.conflicts.push({
          itemId: item.id,
          resourceId: item.resourceId,
          resourceName: item.resource?.name || "?",
          conflictWith: overlapping[0].reservationId,
        });
      }
    }

    // 6. If conflicts exist — ABORT (atomic: all or nothing)
    if (report.conflicts.length > 0) {
      report.success = false;
      report.error = `${report.conflicts.length} konflikt(ów) z innymi rezerwacjami. Rebuild niemożliwy.`;
      // Dry-run or apply — doesn't matter, we abort
      return report;
    }

    // 7. Rebuild: cancel existing ACTIVE → recreate from items
    report.after.action = "rebuild";
    report.after.entriesCancelled = activeEntries;
    report.after.entriesCreated = items.length;

    if (apply) {
      // Cancel existing ACTIVE entries
      if (activeEntries > 0) {
        await tx.timelineEntry.updateMany({
          where: { reservationId, status: "ACTIVE" },
          data: { status: "CANCELLED" },
        });
      }

      // Recreate from items
      const timelineType = toTimelineType(reservation.type);
      const label = getTimelineLabel(reservation.type, reservation.number);

      for (const item of items) {
        await tx.timelineEntry.create({
          data: {
            type: timelineType,
            status: "ACTIVE",
            resourceId: item.resourceId,
            startAt: item.startAt,
            endAt: item.endAt,
            quantityReserved: item.categoryType === "QUANTITY_TIME" ? item.quantity : 1,
            reservationId,
            reservationItemId: item.id,
            label,
          },
        });
      }

      // Audit
      await tx.auditLog.create({
        data: {
          action: "TIMELINE_REBUILD",
          entity: "Reservation",
          entityId: reservationId,
          userId: "SYSTEM_CLI",
          changes: {
            type: "rebuild",
            cancelledEntries: activeEntries,
            createdEntries: items.length,
            itemIds: items.map((i) => i.id),
          },
        },
      });
    }

    return report;
  });
}

// ── CLI entry point ──

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let reservationId = "";
  let apply = false;

  for (const arg of args) {
    if (arg.startsWith("--reservationId=")) {
      reservationId = arg.replace("--reservationId=", "");
    }
    if (arg === "--apply") {
      apply = true;
    }
  }

  if (!reservationId) {
    console.error("Użycie:");
    console.error("  npx tsx scripts/rebuild-timeline.ts --reservationId=cmn...");
    console.error("  npx tsx scripts/rebuild-timeline.ts --reservationId=cmn... --apply");
    console.error("");
    console.error("Domyślnie: dry-run (tylko analiza, zero zmian).");
    console.error("--apply: wykonuje rebuild (atomic — albo wszystko albo nic).");
    process.exit(1);
  }

  console.log("═══════════════════════════════════════════════");
  console.log(`Timeline Rebuild — ${apply ? "APPLY MODE" : "DRY-RUN (bez zmian)"}`);
  console.log(`Rezerwacja: ${reservationId}`);
  console.log(`Czas: ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════════");
  console.log("");

  try {
    const report = await rebuildTimeline(reservationId, apply);

    console.log(`Numer:    ${report.reservationNumber}`);
    console.log(`Status:   ${report.status}`);
    console.log(`Typ:      ${report.type}`);
    console.log(`Dry-run:  ${report.dryRun}`);
    console.log("");
    console.log("PRZED:");
    console.log(`  ACTIVE entries:    ${report.before.activeEntries}`);
    console.log(`  CANCELLED entries: ${report.before.cancelledEntries}`);
    console.log("");
    console.log("OCZEKIWANE:");
    console.log(`  Powinien mieć timeline: ${report.expected.shouldHaveTimeline}`);
    console.log(`  Liczba items:           ${report.expected.itemCount}`);
    console.log("");
    console.log("PO:");
    console.log(`  Akcja:             ${report.after.action}`);
    console.log(`  Anulowane entries: ${report.after.entriesCancelled}`);
    console.log(`  Utworzone entries:  ${report.after.entriesCreated}`);

    if (report.conflicts.length > 0) {
      console.log("");
      console.log("KONFLIKTY:");
      for (const c of report.conflicts) {
        console.log(`  ❌ ${c.resourceName} (${c.resourceId}) — zajęty przez ${c.conflictWith}`);
      }
    }

    console.log("");
    if (report.success) {
      if (report.dryRun) {
        console.log("✅ Dry-run OK. Użyj --apply żeby wykonać rebuild.");
      } else {
        console.log("✅ Rebuild wykonany pomyślnie.");
      }
    } else {
      console.log(`❌ ${report.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Błąd krytyczny:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
