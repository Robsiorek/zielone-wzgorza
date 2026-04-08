/**
 * Integration tests for Unified Reservation System v4.0
 * Run: npx tsx scripts/test-reservations.ts
 *
 * Requirements: server running on localhost:3000
 * Tests use dates in 2027-xx to avoid conflicts with seed data.
 *
 * Tests:
 *   1. Overlap detection (booking A blocks booking B)
 *   2. Booking creates TimelineEntry
 *   3. Checkout A = Checkin B (no conflict)
 *   4. Block creates TimelineEntry & prevents booking
 *   5. Edit booking dates → timeline updates
 *   6. Booking doesn't block itself on edit
 *   7. POST /cancel → timeline entries disappear
 *   8. POST /confirm → status changes
 *   9. OFFER creation + POST /convert → BOOKING
 *  10. Offer doesn't conflict with another offer
 *  11. PATCH rejects status changes (must use action endpoints)
 */

const BASE = "http://localhost:3000";
let authCookie = "";

// ── Auth ──

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@zielonewzgorza.eu", password: "Admin123!" }),
    redirect: "manual",
  });
  const cookies = res.headers.getSetCookie?.() || [];
  authCookie = cookies.map(c => c.split(";")[0]).join("; ");
  if (!authCookie) {
    const raw = res.headers.get("set-cookie") || "";
    authCookie = raw.split(";")[0];
  }
  const json = await res.json();
  if (!json.success) throw new Error(`Login failed: ${json.error}`);
  console.log("  🔐 Logged in as admin");
}

// ── Helpers ──

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Cookie: authCookie, ...options?.headers },
  });
  const json = await res.json();
  return { status: res.status, ...json };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
    return;
  }
  passed++;
  console.log(`  ✅ PASS: ${msg}`);
}

async function cleanup(resourceId: string, start: string, end: string) {
  const tl = await api(`/api/timeline?startDate=${start}&endDate=${end}&resourceId=${resourceId}&includeInactive=true`);
  const entries = tl.data?.entries || [];
  for (const e of entries) {
    if (e.reservationId && e.status === "ACTIVE") {
      await api(`/api/reservations/${e.reservationId}/cancel`, { method: "POST", body: JSON.stringify({}) });
    }
  }
}

async function setup() {
  const resData = await api("/api/resources?status=ACTIVE");
  const resource = resData.data?.resources?.[0];
  if (!resource) throw new Error("No active resources found");

  const clientData = await api("/api/clients?limit=1");
  const client = clientData.data?.clients?.[0];
  if (!client) throw new Error("No clients found");

  return { resourceId: resource.id, resourceName: resource.name, clientId: client.id };
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

async function testOverlap() {
  console.log("\n🧪 TEST 1: Overlap detection");
  const { resourceId, clientId } = await setup();

  const a = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-11-01", checkOut: "2027-11-05",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
    }),
  });
  assert(a.status === 201, `Booking A created`);

  const b = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-11-03", checkOut: "2027-11-08",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
    }),
  });
  assert(b.status === 409 || b.code === "CONFLICT", `Booking B rejected (status ${b.status})`);
}

async function testBookingTimeline() {
  console.log("\n🧪 TEST 2: Booking creates TimelineEntry");
  const { resourceId, clientId } = await setup();

  const res = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-12-01", checkOut: "2027-12-05",
      resources: [{ resourceId, pricePerNight: 150 }], adults: 2,
    }),
  });
  assert(res.status === 201, `Booking created`);
  const id = res.data?.reservation?.id;

  const tl = await api(`/api/timeline?startDate=2027-12-01&endDate=2027-12-05&resourceId=${resourceId}`);
  const found = (tl.data?.entries || []).find((e: any) => e.reservationId === id);
  assert(!!found, `Timeline entry exists`);
  assert(found?.type === "BOOKING", `Type is BOOKING`);
  assert(found?.status === "ACTIVE", `Status is ACTIVE`);
  assert(found?.reservation?.number != null, `Entry has reservation.number`);
  assert(found?.reservation?.client != null, `Entry has reservation.client`);
}

async function testCheckoutCheckin() {
  console.log("\n🧪 TEST 3: Checkout=Checkin (no conflict)");
  const { resourceId, clientId } = await setup();

  const a = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-10-01", checkOut: "2027-10-05",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
    }),
  });
  assert(a.status === 201, `Booking A created`);

  const b = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-10-05", checkOut: "2027-10-10",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
    }),
  });
  assert(b.status === 201, `Booking B created (no conflict)`);
}

async function testBlockPreventsBooking() {
  console.log("\n🧪 TEST 4: Block creates timeline & prevents booking");
  const { resourceId, clientId } = await setup();

  const block = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BLOCK", checkIn: "2027-08-01", checkOut: "2027-08-05",
      resources: [{ resourceId }], internalNotes: "Test block",
    }),
  });
  assert(block.status === 201, `Block created`);
  assert(block.data?.reservation?.type === "BLOCK", `Type is BLOCK`);
  assert(block.data?.reservation?.status === "CONFIRMED", `Block auto-confirmed`);

  const booking = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-08-01", checkOut: "2027-08-05",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
    }),
  });
  assert(booking.status === 409 || booking.code === "CONFLICT", `Booking rejected by block`);

  // Cleanup
  if (block.data?.reservation?.id) {
    await api(`/api/reservations/${block.data.reservation.id}/cancel`, { method: "POST", body: JSON.stringify({}) });
  }
}

async function testEditDates() {
  console.log("\n🧪 TEST 5: Edit dates → timeline updates");
  const { resourceId, clientId } = await setup();

  const res = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-07-01", checkOut: "2027-07-05",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
    }),
  });
  assert(res.status === 201, `Booking created`);
  const id = res.data?.reservation?.id;

  const patch = await api(`/api/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      checkIn: "2027-07-03", checkOut: "2027-07-08",
      resources: [{ resourceId, pricePerNight: 100 }],
      force: true,
    }),
  });
  assert(patch.status === 200, `Edit succeeded`);
  assert(patch.data?.timelineChanged === true, `timelineChanged=true`);
  assert(patch.data?.oldRange?.checkIn === "2027-07-01", `oldRange correct`);
  assert(patch.data?.newRange?.checkIn === "2027-07-03", `newRange correct`);
}

async function testSelfOverlap() {
  console.log("\n🧪 TEST 6: Booking doesn't block itself on edit");
  const { resourceId, clientId } = await setup();

  const res = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-06-01", checkOut: "2027-06-05",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
    }),
  });
  assert(res.status === 201, `Booking created`);

  const patch = await api(`/api/reservations/${res.data?.reservation?.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      checkIn: "2027-06-03", checkOut: "2027-06-08",
      resources: [{ resourceId, pricePerNight: 100 }],
      force: true,
    }),
  });
  assert(patch.status === 200, `Self-overlap edit succeeded`);
}

async function testCancel() {
  console.log("\n🧪 TEST 7: POST /cancel → timeline cleared");
  const { resourceId, clientId } = await setup();

  const res = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-05-01", checkOut: "2027-05-05",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
    }),
  });
  assert(res.status === 201, `Booking created`);
  const id = res.data?.reservation?.id;

  const cancel = await api(`/api/reservations/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancelReason: "Test cancel" }),
  });
  assert(cancel.status === 200, `Cancel succeeded`);
  assert(cancel.data?.reservation?.status === "CANCELLED", `Status is CANCELLED`);

  const tl = await api(`/api/timeline?startDate=2027-05-01&endDate=2027-05-05&resourceId=${resourceId}`);
  const active = (tl.data?.entries || []).filter((e: any) => e.reservationId === id && e.status === "ACTIVE");
  assert(active.length === 0, `No active timeline entries`);

  // Idempotent
  const cancel2 = await api(`/api/reservations/${id}/cancel`, {
    method: "POST", body: JSON.stringify({}),
  });
  assert(cancel2.status === 200, `Second cancel is idempotent`);
  assert(cancel2.data?.alreadyCancelled === true, `alreadyCancelled flag`);
}

async function testConfirm() {
  console.log("\n🧪 TEST 8: POST /confirm → status changes");
  const { resourceId, clientId } = await setup();

  const res = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-04-10", checkOut: "2027-04-15",
      resources: [{ resourceId, pricePerNight: 200 }], adults: 2,
      status: "PENDING",
    }),
  });
  assert(res.status === 201, `PENDING booking created`);
  const id = res.data?.reservation?.id;
  assert(res.data?.reservation?.status === "PENDING", `Initial status is PENDING`);

  const confirm = await api(`/api/reservations/${id}/confirm`, {
    method: "POST", body: JSON.stringify({ note: "Klient potwierdził telefonicznie" }),
  });
  assert(confirm.status === 200, `Confirm succeeded`);
  assert(confirm.data?.reservation?.status === "CONFIRMED", `Status is CONFIRMED`);

  // Idempotent
  const confirm2 = await api(`/api/reservations/${id}/confirm`, {
    method: "POST", body: JSON.stringify({}),
  });
  assert(confirm2.status === 200, `Second confirm is idempotent`);
  assert(confirm2.data?.alreadyConfirmed === true, `alreadyConfirmed flag`);
}

async function testConvert() {
  console.log("\n🧪 TEST 9: OFFER → BOOKING conversion");
  const { resourceId, clientId } = await setup();

  const res = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "OFFER", clientId, checkIn: "2027-04-01", checkOut: "2027-04-05",
      resources: [{ resourceId, pricePerNight: 200 }], adults: 2,
    }),
  });
  assert(res.status === 201, `Offer created`);
  const id = res.data?.reservation?.id;
  const offerNumber = res.data?.reservation?.number;
  assert(offerNumber?.startsWith("OF-"), `Number starts with OF-`);
  assert(res.data?.reservation?.offerDetails?.token != null, `Has secure token`);

  // Timeline shows OFFER
  const tl1 = await api(`/api/timeline?startDate=2027-04-01&endDate=2027-04-05&resourceId=${resourceId}`);
  const offerEntries = (tl1.data?.entries || []).filter((e: any) => e.reservationId === id && e.status === "ACTIVE");
  assert(offerEntries[0]?.type === "OFFER", `Timeline type is OFFER`);

  // Convert
  const convert = await api(`/api/reservations/${id}/convert`, {
    method: "POST", body: JSON.stringify({}),
  });
  assert(convert.status === 200, `Conversion succeeded`);
  assert(convert.data?.converted === true, `converted=true`);
  assert(convert.data?.newNumber?.startsWith("ZW-"), `New number starts with ZW-`);

  // Verify type changed
  const detail = await api(`/api/reservations/${id}`);
  assert(detail.data?.reservation?.type === "BOOKING", `Type is now BOOKING`);
  assert(detail.data?.reservation?.status === "CONFIRMED", `Status is CONFIRMED`);
  assert(detail.data?.reservation?.bookingDetails != null, `Has BookingDetails`);

  // Timeline shows BOOKING
  const tl2 = await api(`/api/timeline?startDate=2027-04-01&endDate=2027-04-05&resourceId=${resourceId}`);
  const bookingEntries = (tl2.data?.entries || []).filter((e: any) => e.reservationId === id && e.status === "ACTIVE");
  assert(bookingEntries[0]?.type === "BOOKING", `Timeline type is now BOOKING`);
}

async function testOfferNoConflict() {
  console.log("\n🧪 TEST 10: Offers don't conflict with each other");
  const { resourceId, clientId } = await setup();

  const a = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "OFFER", clientId, checkIn: "2027-03-01", checkOut: "2027-03-05",
      resources: [{ resourceId, pricePerNight: 200 }], adults: 2,
    }),
  });
  assert(a.status === 201, `Offer A created`);

  const b = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "OFFER", clientId, checkIn: "2027-03-01", checkOut: "2027-03-05",
      resources: [{ resourceId, pricePerNight: 250 }], adults: 3,
    }),
  });
  assert(b.status === 201, `Offer B created (no conflict)`);
}

async function testPatchRejectsStatus() {
  console.log("\n🧪 TEST 11: PATCH rejects status changes");
  const { resourceId, clientId } = await setup();

  const res = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-02-01", checkOut: "2027-02-05",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
      status: "PENDING",
    }),
  });
  assert(res.status === 201, `Booking created`);

  const patch = await api(`/api/reservations/${res.data?.reservation?.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  assert(patch.status === 400, `PATCH with status rejected (${patch.status})`);
  assert(patch.error?.includes("POST"), `Error message mentions POST endpoints`);
}

async function testSoftLock() {
  console.log("\n🧪 TEST 12: Soft lock — CONFIRMED booking rejects date edit without force");
  const { resourceId, clientId } = await setup();

  // Create CONFIRMED booking (default status)
  const res = await api("/api/reservations", {
    method: "POST",
    body: JSON.stringify({
      type: "BOOKING", clientId, checkIn: "2027-01-10", checkOut: "2027-01-15",
      resources: [{ resourceId, pricePerNight: 100 }], adults: 1,
    }),
  });
  assert(res.status === 201, `CONFIRMED booking created`);
  const id = res.data?.reservation?.id;
  assert(res.data?.reservation?.status === "CONFIRMED", `Status is CONFIRMED`);

  // Try edit dates WITHOUT force → should be rejected
  const patchNoForce = await api(`/api/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ checkIn: "2027-01-12", checkOut: "2027-01-17" }),
  });
  assert(patchNoForce.status === 400, `Edit without force rejected (${patchNoForce.status})`);

  // Edit with force:true → should succeed
  const patchForce = await api(`/api/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      checkIn: "2027-01-12", checkOut: "2027-01-17",
      resources: [{ resourceId, pricePerNight: 100 }],
      force: true,
    }),
  });
  assert(patchForce.status === 200, `Edit with force succeeded (${patchForce.status})`);

  // Edit notes WITHOUT force → should succeed (notes don't need force)
  const patchNotes = await api(`/api/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ guestNotes: "Nowa notatka" }),
  });
  assert(patchNotes.status === 200, `Notes edit without force succeeded`);
}

// ═══════════════════════════════════════════════════════════════════
// RUN ALL
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  RESERVATION SYSTEM INTEGRATION TESTS");
  console.log("  v4.0 — Action Endpoints");
  console.log("═══════════════════════════════════════");

  try {
    await login();

    console.log("\n🧹 Cleaning up old test data...");
    const { resourceId } = await setup();
    for (const [s, e] of [
      ["2027-01-01", "2027-01-20"],
      ["2027-02-01", "2027-02-10"],
      ["2027-03-01", "2027-03-10"],
      ["2027-04-01", "2027-04-20"],
      ["2027-05-01", "2027-05-10"],
      ["2027-06-01", "2027-06-10"],
      ["2027-07-01", "2027-07-10"],
      ["2027-08-01", "2027-08-10"],
      ["2027-10-01", "2027-10-15"],
      ["2027-11-01", "2027-11-15"],
      ["2027-12-01", "2027-12-10"],
    ]) {
      await cleanup(resourceId, s, e);
    }
    console.log("  ✅ Cleanup done");

    await testOverlap();
    await testBookingTimeline();
    await testCheckoutCheckin();
    await testBlockPreventsBooking();
    await testEditDates();
    await testSelfOverlap();
    await testCancel();
    await testConfirm();
    await testConvert();
    await testOfferNoConflict();
    await testPatchRejectsStatus();
    await testSoftLock();

    console.log("\n═══════════════════════════════════════");
    if (failed === 0) {
      console.log(`  ✅ ALL ${passed} ASSERTIONS PASSED (12 tests)`);
    } else {
      console.log(`  ⚠️  ${passed} passed, ${failed} FAILED`);
    }
    console.log("═══════════════════════════════════════\n");
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  }
}

main();
