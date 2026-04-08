// ═══════════════════════════════════════════════════════════════════════
// SCHEMA CHANGES v3.0 — Offer + Timeline System
// ═══════════════════════════════════════════════════════════════════════
//
// INSTRUKCJA WDROŻENIA:
// 1. Otwórz prisma/schema.prisma
// 2. Wykonaj 5 podmian w kolejności opisanej poniżej
// 3. Uruchom: npx prisma migrate dev --name offer-timeline-system
// 4. Uruchom seed: node prisma/seed-offers.js
//
// UWAGA: Nie zmieniaj nic poza wskazanymi blokami!
//
// ═══════════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────────
// ZMIANA 1/5 — Resource model
// STATUS: ZMIENIONY (dodane 2 relacje na końcu)
// AKCJA: Podmień CAŁY model Resource (linie ~155-199)
// ─────────────────────────────────────────────────────────────────────

model Resource {
  id           String   @id @default(cuid())
  categoryId   String
  name         String   // "Domek Hobbita #1", "Kajak #3"
  slug         String   @unique
  unitNumber   String?  // nr domku, pokoju, sali
  description  String?
  shortDesc    String?
  status       ResourceStatus @default(ACTIVE)
  sortOrder    Int      @default(0)

  // Physical properties
  maxCapacity    Int?     // max persons
  area           Decimal? // m²
  floor          Int?
  location       String?  // "Nad jeziorem", "Strefa B"

  // Equipment specific
  totalUnits     Int      @default(1) // e.g. 5 kayaks
  unitDuration   Int?     // default rental duration in minutes

  // Attraction specific
  minPersons     Int?
  maxPersons     Int?
  durationMinutes Int?
  isSeasonal     Boolean  @default(false)
  seasonStart    Int?     // month 1-12
  seasonEnd      Int?     // month 1-12

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  category       ResourceCategory  @relation(fields: [categoryId], references: [id])
  variants       ResourceVariant[]
  images         ResourceImage[]
  amenities      ResourceAmenity[]
  blockedPeriods BlockedPeriod[]
  bookingResources BookingResource[]
  channelMappings  ChannelMapping[]
  availabilityCache AvailabilityCache[]
  offerResources   OfferResource[]     // ← NOWE
  timelineEntries  TimelineEntry[]     // ← NOWE

  @@index([categoryId])
  @@index([status])
  @@map("resources")
}


// ─────────────────────────────────────────────────────────────────────
// ZMIANA 2/5 — Addon model
// STATUS: ZMIENIONY (offerItems → offerAddons)
// AKCJA: Podmień CAŁY model Addon (linie ~261-276)
// ─────────────────────────────────────────────────────────────────────

model Addon {
  id           String     @id @default(cuid())
  name         String     // "Śniadanie", "Sprzątanie końcowe", "Parking"
  description  String?
  pricingType  AddonPricingType
  price        Decimal
  isActive     Boolean    @default(true)
  sortOrder    Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  bookingAddons BookingAddon[]
  offerAddons   OfferAddon[]    // ← ZMIENIONE (było: offerItems OfferItem[])

  @@map("addons")
}


// ─────────────────────────────────────────────────────────────────────
// ZMIANA 3/5 — TimelineEntry (NOWY model)
// STATUS: NOWY
// AKCJA: Dodaj PO enum CalendarEventType (po linii ~501),
//        PRZED komentarzem "MODULE 4 — Bookings"
// ─────────────────────────────────────────────────────────────────────

// ── Timeline: unified resource blocking (v3.0) ──
model TimelineEntry {
  id          String              @id @default(cuid())
  type        TimelineEntryType
  status      TimelineEntryStatus @default(ACTIVE)
  resourceId  String
  startDate   DateTime            @db.Date
  endDate     DateTime            @db.Date
  label       String?             // display label on timeline
  color       String?             // override color on timeline
  note        String?

  // References (exactly one should be set based on type)
  offerId     String?
  bookingId   String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  offer    Offer?   @relation(fields: [offerId], references: [id], onDelete: Cascade)
  booking  Booking? @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([resourceId, startDate, endDate])
  @@index([type, status])
  @@index([offerId])
  @@index([bookingId])
  @@map("timeline_entries")
}

enum TimelineEntryType {
  BOOKING   // rezerwacja
  BLOCK     // blokada ręczna (obozy, remont, itp.)
  OFFER     // oferta (soft block)
}

enum TimelineEntryStatus {
  ACTIVE
  CANCELLED
}


// ─────────────────────────────────────────────────────────────────────
// ZMIANA 4/5 — Booking model
// STATUS: ZMIENIONY (dodana relacja timelineEntries)
// AKCJA: Podmień CAŁY model Booking (linie ~507-571)
// ─────────────────────────────────────────────────────────────────────

model Booking {
  id              String        @id @default(cuid())
  bookingNumber   String        @unique // e.g. "ZW-2026-0001"
  clientId        String
  status          BookingStatus @default(NEW)
  source          BookingSource @default(WEBSITE)

  checkIn         DateTime      @db.Date
  checkOut        DateTime      @db.Date
  nights          Int

  // Guests
  adults          Int           @default(1)
  children        Int           @default(0)
  infants         Int           @default(0)

  // Financial
  subtotal        Decimal       @default(0) // before tax/discounts
  discount        Decimal       @default(0)
  taxTotal        Decimal       @default(0)
  total           Decimal       @default(0)
  currency        String        @default("PLN")
  paidAmount      Decimal       @default(0)
  balanceDue      Decimal       @default(0) // computed: total - paid

  // Promo
  promoCodeId     String?

  // Metadata
  guestNotes      String?  // notes from guest
  internalNotes   String?  // internal notes
  specialRequests String?

  // Timestamps
  confirmedAt     DateTime?
  checkedInAt     DateTime?
  checkedOutAt    DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  client          Client    @relation(fields: [clientId], references: [id])
  promoCode       PromoCode? @relation(fields: [promoCodeId], references: [id])
  resources       BookingResource[]
  addons          BookingAddon[]
  guests          BookingGuest[]
  taxes           BookingTax[]
  priceSnapshot   BookingPriceSnapshot?
  payments        Payment[]
  deposits        Deposit[]
  invoices        Invoice[]
  statusLogs      BookingStatusLog[]
  notes           BookingNote[]
  cleaningTasks   CleaningTask[]
  messageLogs     MessageLog[]
  timelineEntries TimelineEntry[]       // ← NOWE

  @@index([clientId])
  @@index([status])
  @@index([checkIn, checkOut])
  @@index([source])
  @@index([bookingNumber])
  @@index([createdAt])
  @@map("bookings")
}


// ─────────────────────────────────────────────────────────────────────
// ZMIANA 5/5 — MODULE 5: Offer Builder (CAŁA SEKCJA)
// STATUS: ZASTĄPIONY (nowe modele, nowe enumy, usunięte stare)
// AKCJA: Podmień CAŁĄ sekcję MODULE 5 (linie ~789-893)
//        od "// MODULE 5 — Offer Builder" do końca OfferVersion
//        UWAGA: Usuwa OfferItem i OfferItemType!
// ─────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════
// MODULE 5 — Offer + Timeline System (v3.0)
// ═══════════════════════════════════════════════════════════════════════

model Offer {
  id            String              @id @default(cuid())
  offerNumber   String              @unique // "OF-2026-0001"
  clientId      String

  // Status (3 separate layers)
  status            OfferStatus            @default(DRAFT)
  paymentStatus     OfferPaymentStatus     @default(UNPAID)
  fulfillmentStatus OfferFulfillmentStatus @default(PENDING)

  // Dates
  checkIn       DateTime   @db.Date
  checkOut      DateTime   @db.Date
  nights        Int

  // Totals (computed from resources + addons)
  subtotal      Decimal    @default(0)
  discount      Decimal    @default(0)
  taxTotal      Decimal    @default(0)
  total         Decimal    @default(0)
  currency      String     @default("PLN")

  // Public access
  token         String     @unique @default(cuid()) // for /offer/:token
  pin           String?    // optional PIN protection

  // Expiry
  expiresAt     DateTime?
  expiryAction  OfferExpiryAction @default(CANCEL)

  // Source & notes
  source        OfferSource @default(EMAIL)
  note          String?

  // Conversion
  convertedBookingId String? @unique

  // Cancellation
  cancelReason  String?
  cancelledBy   String?    // "ADMIN" | "CLIENT"
  cancelledAt   DateTime?

  // Tracking timestamps
  sentAt        DateTime?
  viewedAt      DateTime?
  acceptedAt    DateTime?
  expiredAt     DateTime?

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  client           Client           @relation(fields: [clientId], references: [id])
  offerResources   OfferResource[]
  offerAddons      OfferAddon[]
  activities       OfferActivity[]
  versions         OfferVersion[]
  timelineEntries  TimelineEntry[]

  @@index([clientId])
  @@index([status])
  @@index([token])
  @@index([expiresAt])
  @@index([createdAt])
  @@map("offers")
}

enum OfferStatus {
  DRAFT       // robocza, nieedytowalna publicznie
  OPEN        // wysłana do klienta
  ACCEPTED    // zaakceptowana
  EXPIRED     // wygasła (expiresAt)
  CANCELLED   // anulowana (ręcznie lub automatycznie)
}

enum OfferPaymentStatus {
  UNPAID
  PARTIALLY_PAID
  PAID
  OVERPAID
}

enum OfferFulfillmentStatus {
  PENDING
  COMPLETED
}

enum OfferExpiryAction {
  CANCEL           // automatycznie anuluj po wygaśnięciu
  NEEDS_ATTENTION  // oznacz do ręcznego przeglądu
}

enum OfferSource {
  EMAIL
  PHONE
  SOCIAL
  WEBSITE
  OTHER
}

// ── Zasoby w ofercie ──
model OfferResource {
  id              String   @id @default(cuid())
  offerId         String
  resourceId      String
  capacity        Int      // guests for this resource
  pricePerNight   Decimal  @default(0)
  pricePerStay    Decimal? // optional fixed price (overrides per-night)
  nights          Int
  subtotal        Decimal  @default(0)

  // Snapshot — data at offer creation time (resource may change later)
  resourceSnapshot Json?   // { name, unitNumber, maxCapacity, category }

  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())

  offer    Offer    @relation(fields: [offerId], references: [id], onDelete: Cascade)
  resource Resource @relation(fields: [resourceId], references: [id])

  @@index([offerId])
  @@index([resourceId])
  @@map("offer_resources")
}

// ── Dodatki w ofercie ──
model OfferAddon {
  id        String   @id @default(cuid())
  offerId   String
  addonId   String
  quantity  Int      @default(1)
  unitPrice Decimal
  total     Decimal
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  offer Offer @relation(fields: [offerId], references: [id], onDelete: Cascade)
  addon Addon @relation(fields: [addonId], references: [id])

  @@index([offerId])
  @@map("offer_addons")
}

// ── Activity log ──
model OfferActivity {
  id          String              @id @default(cuid())
  offerId     String
  action      OfferActivityAction
  description String?
  changedBy   String?             // userId or "SYSTEM" or "CLIENT"
  metadata    Json?               // extra data (e.g. old/new status)
  createdAt   DateTime            @default(now())

  offer Offer @relation(fields: [offerId], references: [id], onDelete: Cascade)

  @@index([offerId])
  @@index([createdAt])
  @@map("offer_activities")
}

enum OfferActivityAction {
  CREATED
  UPDATED
  SENT
  VIEWED
  ACCEPTED
  CANCELLED
  EXPIRED
  CONVERTED
  PAYMENT_RECEIVED
  NOTE_ADDED
}

// ── Version snapshots (zachowane z v2.0 — bez zmian) ──
model OfferVersion {
  id        String   @id @default(cuid())
  offerId   String
  version   Int
  snapshot  Json     // full offer snapshot
  changedBy String?
  createdAt DateTime @default(now())

  offer Offer @relation(fields: [offerId], references: [id], onDelete: Cascade)

  @@index([offerId])
  @@map("offer_versions")
}
