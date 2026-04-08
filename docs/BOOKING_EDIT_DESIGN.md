# PROJEKT: Edycja Rezerwacji — Flow Architektoniczny
# Wersja 2.0 | Marzec 2026
# STATUS: Zatwierdzony przez ChatGPT (z poprawkami v2)

---

## 1. SCENARIUSZE EDYCJI

| Co zmienia | Wpływ na TimelineEntry | Wpływ na Booking | Walidacja overlap | Frontend refresh |
|---|---|---|---|---|
| Dane klienta | ❌ Brak | ✅ Update clientId | ❌ | refetch widocznych miesięcy |
| Status (→ CANCELLED) | ✅ Cancel entries | ✅ Update status | ❌ | invalidate(checkIn, checkOut) |
| Status (→ CHECKED_IN itp.) | ❌ Brak | ✅ Update status | ❌ | refetch widocznych miesięcy (kolor) |
| Notatki / source | ❌ Brak | ✅ Update pól | ❌ | brak |
| Goście / ceny | ❌ Brak | ✅ Update BookingResource | ❌ | brak |
| Daty (checkIn / checkOut) | ✅ Cancel stare + create nowe | ✅ Update | ✅ | invalidate(old) + invalidate(new) |
| Zasoby (dodanie/usunięcie) | ✅ Cancel stare + create nowe | ✅ Replace BookingResource[] | ✅ | invalidate(old) + invalidate(new) |
| Daty + zasoby | ✅ Cancel stare + create nowe | ✅ Update + replace | ✅ | invalidate(old) + invalidate(new) |

---

## 2. DECYZJA: UPDATE vs CANCEL+CREATE

### TimelineEntry:
**CANCEL (soft) + CREATE nowe** — nie UPDATE.

Nazewnictwo (wg ChatGPT):
- `cancelTimelineEntries()` — NIE `deleteTimelineEntries()` (bo to soft-delete, nie hard)
- `replaceBookingTimelineEntries()` — cancel stare + create nowe w jednej funkcji

Powody:
- Zmiana zasobów = inna ilość entries
- Soft cancel (status=CANCELLED) zachowuje historię
- Exclusion constraint waliduje nowe entries automatycznie

### Booking:
**UPDATE** (PATCH). Booking ID się nie zmienia.
**BookingResource[]** — DELETE + CREATE (replace all).

---

## 3. PORÓWNANIE ZMIAN — DWA POZIOMY

### Poziom 1: timelineChanged (daty + zestaw zasobów)
```typescript
const datesChanged = body.checkIn !== currentCheckIn || body.checkOut !== currentCheckOut;
const resourceIdsChanged = !sameResourceIds(currentResourceIds, newResourceIds);
const timelineChanged = datesChanged || resourceIdsChanged;
```
→ Jeśli true: cancel stare entries + create nowe + availability check

### Poziom 2: resourcesPayloadChanged (ceny, goście, capacity)
```typescript
const resourcesPayloadChanged = !deepEqual(currentResources, body.resources);
```
→ Jeśli true (ale timelineChanged=false): replace BookingResource[] bez ruszania timeline

To rozdziela:
- **timeline layer** (tylko daty + które zasoby)
- **business layer** (ceny, goście, capacity override per zasób)

---

## 4. TRANSAKCJA — PEŁNY FLOW

```
PATCH /api/bookings/[id]

prisma.$transaction(async (tx) => {

  // 1. POBIERZ aktualny booking
  const current = await tx.booking.findUnique({
    where: { id },
    include: { resources: true }
  });
  if (!current) throw NotFoundError;
  if (current.status === "CANCELLED") throw ValidationError("Nie można edytować anulowanej rezerwacji");

  // 2. USTAL co się zmieniło
  const oldCheckIn = toDateStr(current.checkIn);
  const oldCheckOut = toDateStr(current.checkOut);
  const newCheckIn = body.checkIn || oldCheckIn;
  const newCheckOut = body.checkOut || oldCheckOut;
  const datesChanged = newCheckIn !== oldCheckIn || newCheckOut !== oldCheckOut;
  const newResourceIds = body.resources?.map(r => r.resourceId) || current.resources.map(r => r.resourceId);
  const currentResourceIds = current.resources.map(r => r.resourceId);
  const resourceIdsChanged = !sameResourceIds(currentResourceIds, newResourceIds);
  const timelineChanged = datesChanged || resourceIdsChanged;
  const statusChanged = body.status && body.status !== current.status;
  const isCancellation = statusChanged && body.status === "CANCELLED";

  // 3. JEŚLI ANULOWANIE → osobny flow
  if (isCancellation) {
    await cancelTimelineEntries(tx, { bookingId: id });
    await tx.booking.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() }
    });
    await tx.bookingStatusLog.create({ data: {
      bookingId: id, fromStatus: current.status, toStatus: "CANCELLED",
      changedBy: "ADMIN", note: body.statusNote || "Rezerwacja anulowana",
    }});
    return { booking: updated, timelineChanged: true,
      oldRange: { checkIn: oldCheckIn, checkOut: oldCheckOut },
      newRange: null };
  }

  // 4. JEŚLI ZMIANA DAT/ZASOBÓW → walidacja + replace entries
  if (timelineChanged) {
    const startDate = dateForDB(newCheckIn);
    const endDate = dateForDB(newCheckOut);

    // 4a. Check availability (exclude THIS booking's entries)
    const { available, conflicts } = await checkAvailability(
      tx, newResourceIds, startDate, endDate,
      ["BOOKING", "BLOCK"],
      { excludeBookingId: id }
    );
    if (!available) throw new ConflictError(conflicts[0].resourceName, conflicts[0].type);

    // 4b. Cancel STARE timeline entries
    await cancelTimelineEntries(tx, { bookingId: id });

    // 4c. Create NOWE timeline entries
    for (const resId of newResourceIds) {
      await createTimelineEntry(tx, {
        type: "BOOKING", resourceId: resId,
        startDate, endDate, bookingId: id,
        label: `Rezerwacja ${current.bookingNumber}`,
      });
    }
  }

  // 5. REPLACE BookingResource[] (jeśli resources w body)
  if (body.resources) {
    await tx.bookingResource.deleteMany({ where: { bookingId: id } });
    const nights = nightsBetween(newCheckIn, newCheckOut);
    for (const res of body.resources) {
      await tx.bookingResource.create({
        data: {
          bookingId: id,
          resourceId: res.resourceId,
          pricePerNight: Number(res.pricePerNight || 0),
          totalPrice: Number(res.pricePerNight || 0) * nights,
        },
      });
    }
    // Recalculate totals
    const subtotal = body.resources.reduce((sum, r) => sum + Number(r.pricePerNight || 0) * nights, 0);
    const discount = Number(body.discount ?? current.discount ?? 0);
    const total = Math.max(0, subtotal - discount);
    await tx.booking.update({ where: { id }, data: { subtotal, discount, total, balanceDue: total - (current.paidAmount || 0) } });
  }

  // 6. UPDATE BOOKING (core fields)
  const updated = await tx.booking.update({
    where: { id },
    data: {
      ...(body.clientId && { clientId: body.clientId }),
      ...(body.checkIn && { checkIn: dateForDB(body.checkIn) }),
      ...(body.checkOut && { checkOut: dateForDB(body.checkOut), nights: nightsBetween(body.checkIn || oldCheckIn, body.checkOut) }),
      ...(body.adults !== undefined && { adults: body.adults }),
      ...(body.children !== undefined && { children: body.children }),
      ...(body.source && { source: body.source }),
      ...(body.status && { status: body.status }),
      ...(body.guestNotes !== undefined && { guestNotes: body.guestNotes }),
      ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes }),
    },
    include: { client: true, resources: { include: { resource: true } } },
  });

  // 7. STATUS LOG
  if (statusChanged) {
    await tx.bookingStatusLog.create({ data: {
      bookingId: id, fromStatus: current.status, toStatus: body.status,
      changedBy: "ADMIN", note: body.statusNote || "Zmiana statusu",
    }});
  }

  return {
    booking: updated,
    timelineChanged,
    oldRange: timelineChanged ? { checkIn: oldCheckIn, checkOut: oldCheckOut } : null,
    newRange: timelineChanged ? { checkIn: newCheckIn, checkOut: newCheckOut } : null,
  };
});
```

**Kolejność w transakcji (wg ChatGPT):**
1. Pobierz current
2. Walidacja
3. Cancel stare timeline entries
4. Create nowe timeline entries
5. Replace BookingResource[]
6. Update booking core
7. Status log

---

## 5. API CONTRACT

### PATCH /api/bookings/[id]

**Request body** (wszystkie pola opcjonalne):
```json
{
  "clientId": "string",
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "resources": [
    {
      "resourceId": "string",
      "pricePerNight": 180,
      "adults": 2,
      "children": 1,
      "capacityOverride": true
    }
  ],
  "adults": 2,
  "children": 1,
  "source": "PHONE",
  "status": "CONFIRMED",
  "guestNotes": "string",
  "internalNotes": "string",
  "statusNote": "Powód zmiany statusu"
}
```

**Response (200):**
```json
{
  "success": true,
  "code": null,
  "data": {
    "booking": { "id": "...", "bookingNumber": "ZW-2026-0010", ... },
    "timelineChanged": true,
    "oldRange": { "checkIn": "2026-03-05", "checkOut": "2026-03-10" },
    "newRange": { "checkIn": "2026-03-07", "checkOut": "2026-03-12" }
  }
}
```

Semantyka:
- `timelineChanged: true` → frontend invaliduje `oldRange` + `newRange`
- `timelineChanged: false` → frontend refetchuje widoczne miesiące (kolor/status mogły się zmienić)
- CANCELLED → `timelineChanged: true`, `newRange: null`

---

## 6. NAZEWNICTWO TIMELINE-SERVICE (poprawione wg ChatGPT)

| Stara nazwa | Nowa nazwa | Powód |
|---|---|---|
| `deleteTimelineEntries()` | `cancelTimelineEntries()` | Soft-delete, nie hard delete |
| (nowe) | `replaceBookingTimelineEntries()` | Cancel + check + create w jednym |

```typescript
// timeline-service.ts

async function cancelTimelineEntries(tx, filter: { bookingId?, offerId?, id? }) {
  return tx.timelineEntry.updateMany({
    where: { ...filter, status: "ACTIVE" },
    data: { status: "CANCELLED" },
  });
}

async function replaceBookingTimelineEntries(
  tx, bookingId: string,
  newResourceIds: string[], startDate: Date, endDate: Date, label: string,
) {
  // 1. Cancel existing
  await cancelTimelineEntries(tx, { bookingId });
  // 2. Check availability (exclude self)
  const { available, conflicts } = await checkAvailability(
    tx, newResourceIds, startDate, endDate,
    ["BOOKING", "BLOCK"], { excludeBookingId: bookingId }
  );
  if (!available) throw new ConflictError(...);
  // 3. Create new
  for (const resId of newResourceIds) {
    await createTimelineEntry(tx, { type: "BOOKING", resourceId: resId, startDate, endDate, bookingId, label });
  }
}
```

---

## 7. EDGE CASES (uzupełnione)

### 7.1 Booking blokuje sam siebie
→ `excludeBookingId` w checkAvailability. Entry tego bookingu pomijane.

### 7.2 Booking na zakresie oferty
→ NIE anulujemy automatycznie oferty (decyzja ChatGPT). Booking wchodzi, oferta zostaje.

### 7.3 Edycja anulowanej rezerwacji
→ Backend odmawia: `if (current.status === "CANCELLED") throw ValidationError(...)`.

### 7.4 Concurrent edit
→ Brak optimistic locking w v1. Last-write-wins.
→ **JAWNY DŁUG:** Docelowo: `expectedUpdatedAt` w PATCH → jeśli inne niż DB → 409 "Zmienione przez innego użytkownika".

### 7.5 CANCELLED → timelineChanged
→ Jawnie: `timelineChanged: true` przy anulowaniu. Frontend invaliduje zakres.

### 7.6 Zmiana dat "na siebie"
→ `datesChanged = false` → skip timeline operations. Tylko update business fields.

---

## 8. TESTY (6 testów)

1. **Edycja dat** — zmień 5-10 → 7-12, sprawdź nowe timeline entries
2. **Edycja zasobów** — zmień Domek1 → Domek2, sprawdź entries
3. **Booking nie blokuje siebie** — zmień daty na overlapping z samym sobą → powinno przejść
4. **CANCELLED kasuje timeline** — zmień status na CANCELLED → entries znikają
5. **Block blokuje edycję** — zmień daty na zakres z blokadą → 409
6. **Edycja anulowanej** — próba PATCH na CANCELLED booking → 400

---

## 9. PLAN IMPLEMENTACJI

1. `timeline-service.ts` — rename `deleteTimelineEntries` → `cancelTimelineEntries`, dodaj `replaceBookingTimelineEntries`, dodaj `excludeBookingId` do `checkAvailability`
2. `PATCH /api/bookings/[id]` — endpoint wg flow z sekcji 4
3. `UnifiedPanel` — tryb edit (locked tab, prefill, PATCH submit)
4. `CalendarDetailPanel` — przycisk "Edytuj" → otwiera UnifiedPanel(mode=edit)
5. Cache invalidation — `oldRange`/`newRange` z response
6. Testy — 6 testów z sekcji 8
7. Aktualizacja `scripts/test-timeline.ts`
