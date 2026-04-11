**ZIELONE WZGÓRZA**

Panel Administracyjny

**MASTER PLAN --- Pełna Specyfikacja Systemu**

Wersja 2.3 --- 11 kwietnia 2026

*Dokument zawiera pełną specyfikację logiki biznesowej, architektury
technicznej i plan implementacji systemu rezerwacyjnego.*

═══════════════════════════════════════════════════════════════════
CURRENT PRODUCTION STATE (stan faktyczny na 11.04.2026)
═══════════════════════════════════════════════════════════════════

System działa na VPS 185.25.150.237 (cyber_Folks, Ubuntu 24.04).
Health status: **healthy** (DB ok, SMTP ok, cron ok).
Repo: github.com/Robsiorek/zielone-wzgorza (public).

**Wdrożone i działające:**
- ✅ Core booking engine (quote → book → timeline → payments)
- ✅ Reservation transition service (FOR UPDATE, typed state machine)
- ✅ Payment transition service (FOR UPDATE, lock order payment→reservation)
- ✅ Exclusion constraint no_resource_overlap (DB-level protection)
- ✅ Concurrency tests C1–C5: 5/5 PASS
- ✅ requestId middleware (X-Request-Id na każdym request)
- ✅ GET /api/health (DB + SMTP cached + cron heartbeat)
- ✅ Timeline rebuild CLI (dry-run domyślny, atomic --apply)
- ✅ Cron heartbeat (zapis po każdym uruchomieniu reminder)
- ✅ Testy regresyjne: 18/18 PASS (scripts/test-critical.sh)
- ✅ Git na serwerze + GitHub backup (push po deployu)
- ✅ Email: SPF ✅ + DKIM ✅ + DMARC ✅ (p=none)
- ✅ Widget publiczny (pełny flow booking)
- ✅ RBAC (OWNER/MANAGER/RECEPTION)
- ✅ Email szablony + reminders cron
- ✅ Prisma migrations (migrate deploy, nie db push)
- ✅ B1 Media Storage (upload, processing, CRUD, local/R2-ready)
- ✅ B2 Resource Content (opisy, dane techniczne, łóżka, ADR-14 rename)
- ✅ B2 Panel zasobu (inline SectionCards, brak edit mode)

**Production readiness vs Product readiness:**

Production readiness (silnik): ✅ GOTOWY. Core działa, jest bezpieczny,
odporny na concurrency, diagnozowalny (health, requestId), naprawialny
(rebuild CLI), z backupem (git + GitHub + DB cron).

Product readiness (produkt dla klienta): 🔵 W BUDOWIE. Zdjęcia i opisy
domków (B1/B2) wdrożone. Brakuje: amenities i property content (B3-B5),
moduł sprzątania (C), pakiety i reguły cenowe (D), integracje
i channel manager (E). GO-LIVE dopiero po zamknięciu Warstw A–D
i testach wewnętrznych.

**Zależności serwerowe (B1):**
- @aws-sdk/client-s3 — klient S3-compatible (dla Cloudflare R2)
- sharp@0.34.5 — przetwarzanie obrazów (resize, WebP, EXIF)
- STORAGE_PROVIDER=local w .env (dev), LOCAL_MEDIA_DIR=data/media

═══════════════════════════════════════════════════════════════════

Spis treści

1\. Informacje ogólne

2\. Architektura systemu

3\. Statusy rezerwacji

4\. Macierz przejść statusów

5\. Zameldowanie i niestawienie

6\. Blokady

7\. System ofert

8\. System dodatków (Addons)

9\. Płatności --- Ledger finansowy

10\. Ustawienia globalne

11\. Frontend klienta (Widget)

12\. System użytkowników i uprawnień

13\. System logów

14\. Timeline --- specyfikacja wizualna

15\. API --- endpointy

16\. Schema bazy danych

17\. Plan implementacji (fazy)

18\. Warunki i reguły biznesowe

19\. Ograniczenia bazy danych (DB Constraints)

20\. Edge cases i reguły synchronizacji

21\. Sekwencje i numeracja

22\. Typy zasobów i logika dostępności

23\. ReservationItem --- model elementów rezerwacji

24\. Multi-property

25\. Panel klienta (ClientAccount)

26\. System powiadomień (Notifications)

27\. Storage (pliki i media)

1\. Informacje ogólne

1.1. O projekcie

Zielone Wzgórza to pełny system rezerwacyjny klasy
iDoBooking/ProfitRoom, budowany jako własne rozwiązanie bez zależności
od SaaS. System obsługuje trzy linie biznesowe:

-   Wynajem domków (10 domków, 4 pokoje) --- dotychczas iDoBooking

-   Pobyty zorganizowane dla firm/szkół --- pakiety: domki +
    wyżywienie + sala + sprzęt wodny + atrakcje

-   Restauracja --- jednodniowe przyjęcia (komunie, urodziny,
    jubileusze)

**Relacja z iDoBooking:** iDoBooking jest wzorcem funkcjonalnym (skrypty,
moduły, UX flow). NIE jest źródłem danych. Zero migracji — system
startuje z czystą bazą. Żadne dane klientów, rezerwacji ani historii
nie są importowane z iDoBooking.

1.2. Stack techniczny

  ---------------------- ------------------------------------------------
  **Komponent**          **Technologia**

  Framework              Next.js 14 (App Router)

  Styl                   Tailwind CSS

  ORM                    Prisma

  Baza danych            PostgreSQL 16

  Autoryzacja            JWT + bcrypt + HttpOnly cookie

  Hosting                VPS cyber_Folks (Ubuntu 24.04)

  Process Manager        PM2

  Język                  TypeScript (strict mode)

  Architektura           Modular monolith
  ---------------------- ------------------------------------------------

1.3. Hosting i deployment

-   VPS: 185.25.150.237 (cyber_Folks, Ubuntu 24.04)

-   Panel: dev.zielonewzgorza.eu/admin

-   PM2 process: zw-admin

-   Baza: zielone_wzgorza_admin na localhost:5432

-   Deploy: FileZilla → tar.gz → SSH → prisma migrate deploy → next build
    → pm2 restart

-   Prisma: npx prisma@5.22.0 migrate deploy (od S3; wcześniej db push)

2\. Architektura systemu

2.1. Unified Reservation Model

System oparty jest na jednym modelu Reservation z polem type
określającym rodzaj:

  ----------- ------------------------- -------------- -------------------
  **Type**    **Opis**                  **Wymagany     **Timeline**
                                        klient**       

  BOOKING     Rezerwacja (domek/pokój)  TAK            Blokuje zasób

  OFFER       Oferta handlowa           TAK            Blokuje zasób
                                                       (niebieska
                                                       przerywana)

  BLOCK       Blokada zasobu            Opcjonalny     Blokuje zasób
                                                       (szara ciągła)
  ----------- ------------------------- -------------- -------------------

2.2. Kluczowe zasady architektury

1.  Jeden model Reservation z type: BOOKING \| OFFER \| BLOCK

2.  ReservationItem = pojedynczy element rezerwacji (zasób + czas +
    ilość). Jedna rezerwacja może zawierać wiele elementów (domek +
    sala + sprzęt)

3.  ResourceCategory.type definiuje logikę systemu: ACCOMMODATION
    (noclegi) / TIME_SLOT (godziny) / QUANTITY_TIME (ilość + godziny)

4.  OfferDetails i BookingDetails jako osobne modele 1:1 (NIE flat na
    Reservation)

5.  TimelineEntry = jedyne źródło prawdy dla dostępności zasobów

6.  Jeden backend timeline → wiele widoków logicznych (noclegi / sala /
    restauracja / sprzęt). Filtrowanie po category.type, nie osobne
    tabele

7.  Konwersja OFFER → BOOKING = UPDATE type + status (zero kopiowania
    danych)

8.  Timeline: cancel + create (NIGDY update typu entry)

9.  Wszystkie operacje timeline MUSZĄ być wykonywane w transakcji DB,
    aby zapobiec chwilowemu brakowi blokady zasobu

10. Payment ledger (immutable) = jedyne source of truth dla finansów.
    paidAmountMinor/balanceDueMinor/paymentStatus = cache przeliczany z
    CONFIRMED payments

11. amountMinor (Int) wszędzie --- cały system finansowy operuje na
    minor units (grosze). Zero Decimal dla pieniędzy

12. Snapshot cen i dodatków --- wartości zamrażane w momencie utworzenia
    rezerwacji

13. Multi-property: propertyId na zasobach i rezerwacjach (przygotowanie
    pod wiele ośrodków)

2.2.1. System Guarantees (kontrakt systemowy)

Poniższe gwarancje opisują zachowanie systemu, które MUSI być zawsze
prawdziwe. Nie są to aspiracje ani opis intencji — są to twarde reguły
architektoniczne. Obowiązują od S3.1 (08.04.2026).

**Availability / booking guarantees:**

1. Dla ACTIVE timeline entries nie może istnieć overlap czasu dla tego
   samego resourceId.
2. Twardą gwarancję braku overlapów zapewnia PostgreSQL EXCLUDE USING
   gist (no_resource_overlap) na tabeli timeline_entries.
3. checkAvailability() jest wyłącznie pre-checkiem aplikacyjnym. NIE
   jest gwarancją spójności przy współbieżności.
4. Ostateczna walidacja konfliktu dostępności odbywa się na poziomie DB.
5. Konflikt overlapu MUSI być mapowany na HTTP 409 CONFLICT, nigdy 500.

**Quote / public booking guarantees:**

1. Ten sam quoteId może zostać skutecznie użyty tylko raz.
2. POST /api/public/book jest idempotentny względem użytego quote.
3. Równoległe próby użycia tego samego quote nie mogą utworzyć dwóch
   rezerwacji.
4. Quote lockowany jest przez FOR UPDATE w transakcji tworzenia
   rezerwacji.

**Reservation transition guarantees:**

1. Każda zmiana statusu rezerwacji MUSI przechodzić przez centralny
   mechanizm transitionReservationStatus() (reservation-transition.ts).
2. Mechanizm odpowiada za: FOR UPDATE lock na reservation row, odczyt
   statusu po locku, walidację state machine, zapis nowego statusu,
   audit/status log, deterministyczny wynik (idempotent success albo
   409 INVALID_TRANSITION).
3. Email statusowy nigdy nie jest wysyłany w transakcji.
4. Email statusowy może zostać wysłany wyłącznie po commicie i tylko
   dla zwycięskiego przejścia.

**Payment transition guarantees:**

1. Każda zmiana statusu płatności MUSI przechodzić przez centralny
   mechanizm transitionPaymentStatus() (payment-transition.ts).
2. Payment row jest lockowany pierwszy (FOR UPDATE), a dopiero potem
   reservation row. Lock order: payment → reservation (nigdy odwrotnie).
3. Dwa równoległe confirm tej samej płatności nie mogą zaksięgować
   jej dwa razy.
4. Tylko płatności CONFIRMED wpływają na projekcje finansowe.
5. Invalid payment state transition zwraca 409, nie 500.

**Side effects guarantees:**

1. Side effecty zewnętrzne (email, webhook, notyfikacja) nie są częścią
   transakcji DB.
2. Side effect może zostać uruchomiony wyłącznie po skutecznym commicie.
3. Przegrany request współbieżny nie może generować: emaila, fałszywego
   audit logu, dodatkowej projekcji, wtórnej zmiany statusu.

**Financial guarantees:**

1. Payment jest jedynym source of truth dla finansów.
2. paidAmountMinor, balanceDueMinor, paymentStatus są projekcjami/cache.
3. amountMinor (Int) jest jedynym formatem przechowywania pieniędzy.
4. CONFIRMED Payment jest immutable.

**Automatic transitions guarantees:**

1. Automatyczne przejścia wykonywane przez system (cron / scheduler)
   podlegają tym samym regułom state machine, logowania i side effects
   co przejścia ręczne (changedBy = "SYSTEM").

2.2.2. Architecture Decision Records (ADR-lite)

Najważniejsze decyzje architektoniczne i ich uzasadnienie. Każda
decyzja jest świadoma, udokumentowana i ma konsekwencje na przyszłość.

**ADR-01: TimelineEntry jako jedyne source of truth dostępności**
Decyzja: TimelineEntry (nie Reservation) określa czy zasób jest zajęty.
Dlaczego: Jedno miejsce prawdy, prostsze zapytania, brak rozsynchronizowania.
Odrzucone: Wyliczanie dostępności z Reservation + items (złożone, wolne).
Skutek: Każda zmiana rezerwacji MUSI aktualizować timeline (cancel+create).

**ADR-02: EXCLUDE constraint jako finalna gwarancja braku overlapów**
Decyzja: PostgreSQL exclusion constraint (btree_gist, tsrange) na timeline_entries.
Dlaczego: checkAvailability() jest tylko hintem — constraint DB chroni przed race conditions.
Odrzucone: Tylko application-level check (podatne na race conditions).
Skutek: Double-booking niemożliwy nawet przy bugach w kodzie aplikacji.

**ADR-03: Payment ledger immutable**
Decyzja: CONFIRMED Payment nigdy nie jest edytowany. Korekty przez nowe wpisy.
Dlaczego: Audytowalność, spójność finansowa, brak ukrytych zmian.
Odrzucone: Edytowalne płatności (proste ale niebezpieczne księgowo).
Skutek: paidAmountMinor/balanceDue to CACHE przeliczany z ledgera.

**ADR-04: amountMinor (Int) jako jedyny format pieniędzy**
Decyzja: Wszystkie kwoty w groszach (Int). Zero Decimal/Float.
Dlaczego: Brak błędów zaokrągleń, proste operacje, standard fintech.
Odrzucone: Decimal (wolniejsze), Float (niebezpieczne zaokrąglenia).
Skutek: Procenty w BPS (10000 = 100%). Wyświetlanie: amountMinor/100.

**ADR-05: Jeden centralny reservation-transition service**
Decyzja: Każda zmiana statusu rezerwacji przez transitionReservationStatus().
Dlaczego: Jeden punkt: lock → validate → update → audit → return.
Odrzucone: Logika per endpoint (duplikacja, niespójność, brak locków).
Skutek: Endpointy to cienkie wrappery. Email po commit, nie w transakcji.

**ADR-06: Payment-transition jako osobny service**
Decyzja: Analogiczny do reservation-transition, z lock order payment→reservation.
Dlaczego: Zapobiega deadlockom, centralizuje logikę płatności.
Odrzucone: Wspólny service z reservation (zbyt złożony, różne locki).
Skutek: PaymentTransitionError → 409. PaymentValidationError → 400.

**ADR-07: Check-in jako operacja domenowa, nie status transition**
Decyzja: Check-in ustawia bookingDetails.checkedInAt, NIE zmienia ReservationStatus.
Dlaczego: Zameldowanie to fakt fizyczny, nie stan rezerwacji.
Odrzucone: Check-in jako status (komplikuje state machine, ukrywa logikę).
Skutek: NO_SHOW → CONFIRMED wymaga jawnego /confirm, potem /check-in.

**ADR-08: Jeden branch git (master), bez dev/feature**
Decyzja: Przy jednym deweloperze i sekwencyjnym workflow — tylko master.
Dlaczego: Branche zwiększają złożoność bez wartości przy jednym dev.
Odrzucone: main/dev/feature (standard zespołowy — nie pasuje do etapu).
Skutek: Rollback przez git reset --hard. Branches gdy dojdzie 2. dev.

**ADR-09: Serwer = working copy, GitHub = zdalne repo**
Decyzja: Serwer VPS = aktywna working copy produkcji. GitHub = zdalne
repo (backup offsite, historia zmian, punkt odniesienia między sesjami).
Dlaczego: Deploy z tar.gz jest atomowy. Push po deployu synchronizuje.
Odrzucone: GitHub jako jedyne source of truth + pull na serwer (komplikacja).
Skutek: Push po każdym deployu. Repo public (sekrety w .env poza repo).

**ADR-10: Tagi tylko dla stabilnych punktów**
Decyzja: Nie każdy deploy dostaje tag. Tag = milestone / safety / bugfix.
Dlaczego: Za dużo tagów = szum. Deploy = commit. Stabilny punkt = tag.
Odrzucone: Tag per deploy (nadmiarowe), brak tagów (brak checkpointów).
Skutek: Źródło prawdy wersji = git log -1. VERSION = wskaźnik pomocniczy.

**ADR-11: Media storage = object storage, nie filesystem**
Decyzja: Zdjęcia zasobów w Cloudflare R2 (object storage). W DB tylko
storageKey (pełny object key). URL generowany runtime. (per MP §27)
Dlaczego: Filesystem nie skaluje się, nie ma CDN, trudniejsza migracja.
Odrzucone: Lokalny filesystem jako docelowy (sprzeczne z MP §27).
Skutek: MediaStorageProvider interface. R2 produkcja, local dev/fallback.

**ADR-12: Direct public media z providera, nie proxy przez backend**
Decyzja: Widget pobiera zdjęcia bezpośrednio z R2 public URL.
Dlaczego: Zero obciążenia VPS, wbudowany CDN Cloudflare, skalowalne.
Odrzucone: Proxy przez Next.js (obciąża serwer, wolniejsze, nie skaluje).
Skutek: getPublicUrl(key) → https://{R2_DOMAIN}/{key}. Dev: local streaming.

**ADR-13: CompanySettings ≠ content katalogowy**
Decyzja: CompanySettings = ustawienia techniczne (check-in/out, deposit,
currency). PropertyContent = treści katalogowe (zasady, FAQ, badges).
Dlaczego: Mieszanie tworzy model „śmietnik". Osobne modele, osobne API.
Odrzucone: Wszystko w CompanySettings (szybsze, ale brudne architektonicznie).
Skutek: PropertyContent z propertyId. Gotowe na multi-property.

2.3. Endpointy API (podsumowanie)

**Rezerwacje:**

- POST /api/reservations — Tworzenie (type: BOOKING/OFFER/BLOCK)
- GET /api/reservations — Lista z filtrami (type, status, search, clientId)
- GET /api/reservations/[id] — Szczegóły rezerwacji
- PATCH /api/reservations/[id] — Edycja danych (daty, zasoby, goście)
- POST /api/reservations/[id]/confirm — Ręczne potwierdzenie przez admina
- POST /api/reservations/[id]/cancel — Anuluj rezerwację
- POST /api/reservations/[id]/convert — OFFER→BOOKING + BLOCK→BOOKING/OFFER (FOR UPDATE lock)
- POST /api/reservations/[id]/check-in — Zameldowanie gościa
- POST /api/reservations/[id]/no-show — Oznaczenie niestawienia
- POST /api/reservations/[id]/restore — Przywrócenie anulowanej (z check availability)
- GET /api/timeline — Timeline dane

**Płatności (C1b/C2):**

- POST /api/reservations/[id]/payments — Rejestracja wpłaty/zwrotu/korekty
- GET /api/reservations/[id]/payments — Lista płatności + summary finansowe
- POST /api/payments/[id]/confirm — Zatwierdzenie PENDING → CONFIRMED
- POST /api/payments/[id]/reject — Odrzucenie PENDING → REJECTED

**Dodatki:**

- GET /api/addons — Lista z filtrami
- POST /api/addons — Utwórz dodatek
- GET/PATCH/DELETE /api/addons/[id] — CRUD

**Zasoby:**

- GET /api/resources — Lista zasobów
- POST /api/resources — Utwórz zasób
- GET/PATCH/DELETE /api/resources/[id] — CRUD
- PUT /api/resources/reorder — Zmiana kolejności

**Zasoby — Media (B1 ✅ wdrożone):**

- POST /api/resources/[id]/images — Upload zdjęcia (multipart, max 5MB)
- DELETE /api/resources/[id]/images/[imageId] — Usuń zdjęcie + storage
- PATCH /api/resources/[id]/images/[imageId] — Set cover, set alt
- PUT /api/resources/[id]/images/reorder — Transakcyjny reorder (two-phase)

**Zasoby — Content (B2 ✅ wdrożone):**

- PATCH /api/resources/[id] — Partial update (was PUT, ADR-14)
- PUT /api/resources/[id]/beds — Replace łóżka (full replace pattern)

**Amenities (Warstwa B):**

- GET /api/amenities — Lista wszystkich amenities (dla checkboxów)

**Kategorie zasobów:**

- GET /api/resource-categories — Lista kategorii
- PATCH /api/resource-categories/[id] — Edycja (np. checkInTimeOverride)

**System cenowy:**

- GET/POST /api/rate-plans — Lista/tworzenie planów cenowych
- GET/PATCH/DELETE /api/rate-plans/[id] — CRUD
- GET/POST /api/seasons — Lista/tworzenie sezonów
- GET/PATCH/DELETE /api/seasons/[id] — CRUD
- GET/POST /api/price-entries — Lista/tworzenie wpisów cennikowych
- GET/POST /api/promo-codes — Lista/tworzenie kodów rabatowych
- GET/PATCH/DELETE /api/promo-codes/[id] — CRUD

**Klienci:**

- GET /api/clients — Lista z filtrami
- POST /api/clients — Utwórz klienta
- GET/PATCH /api/clients/[id] — Odczyt/edycja
- DELETE /api/clients/[id] — Soft delete
- GET /api/tags — Lista tagów klientów

**Użytkownicy (D0):**

- GET /api/users — Lista użytkowników
- POST /api/users — Utwórz użytkownika
- GET/PATCH/DELETE /api/users/[id] — CRUD
- POST /api/users/[id]/reset-password — Reset hasła
- GET/POST /api/avatars/[...key] — Upload/stream avatarów

**Ustawienia:**

- GET/PATCH /api/settings — Odczyt/edycja CompanySettings
- GET/PATCH /api/settings/payment-methods — Konfiguracja metod płatności

**Property Content (Warstwa B):**

- GET /api/property-content — Odczyt PropertyContent (current property)
- PATCH /api/property-content — Upsert (single-record, create-or-update)
- GET /api/property-content/trust-badges — Lista trust badges
- PUT /api/property-content/trust-badges — Replace all badges

**FAQ (Warstwa B):**

- GET /api/faq — Lista FAQ items (sorted by position)
- POST /api/faq — Dodaj FAQ item
- PATCH /api/faq/[id] — Edytuj FAQ item
- DELETE /api/faq/[id] — Usuń FAQ item
- PUT /api/faq/reorder — Transakcyjny reorder

**Publiczne API (E1 + E2, bez auth, z rate limiterem):**

- GET /api/public/availability — Dostępność zasobów
- POST /api/public/quote-preview — Minimalna cena per wariant (batch)
- POST /api/public/quote — Formalna wycena z zapisem Quote w DB
- POST /api/public/book — Tworzenie rezerwacji z Quote (E2)
- GET /api/public/resources-catalog — Katalog zasobów dla widgetu (E2)
  (B1/B2 ✅: images, shortDescription, beds, areaSqm, bedroomCount, bathroomCount)
- GET /api/public/resources/[id] — Szczegóły zasobu (B2 backend ✅, B5 UI).
  Zwraca: longDescription, images, beds, variants, amenities.
- GET /api/public/reservation/[token] — Publiczny widok rezerwacji (E2)
- GET /api/public/media/[key] — Dev/local streaming zdjęć (prod: direct R2 URL)
- GET /api/public/widget-config — Theme + logo + font dla frontendu (E2-UI)
- GET /api/public/widget-logo/[...path] — Streaming logo (E2-UI)

**Admin — Widget Appearance (E2-UI):**

- GET/PATCH /api/settings/widget — Odczyt/zapis konfiguracji wyglądu
- POST /api/settings/widget — Upload/usunięcie logo

**Admin — Email (E3a):**

- GET /api/settings/email — Konfiguracja email + SMTP diagnostyka per pole
- PATCH /api/settings/email — Aktualizacja sender/bank/reminder (OWNER)
- POST /api/settings/email/test — Wysyłka test email (OWNER)
- POST /api/settings/email/test-connection — Test SMTP handshake (OWNER).
  NIE wysyła żadnego maila — tylko EHLO + AUTH weryfikacja połączenia.

**Admin — Email Templates (E3b):**

- GET /api/settings/email/templates — Lista 4 szablonów (custom/default)
- GET /api/settings/email/templates/[type] — Pojedynczy szablon
- PUT /api/settings/email/templates/[type] — Upsert (subject + bodyHtml)
- DELETE /api/settings/email/templates/[type] — Reset do domyślnego
- POST /api/settings/email/preview — Render z demo danymi (draft/saved)
- GET /api/settings/email/logs — Lista logów z filtrowaniem i paginacją

**Internal (cron, x-cron-secret — E3b ✅):**

- POST /api/internal/email/reminders/run — Reminder cron. Podwójna
  auth (middleware + route handler). FOR UPDATE lock, mark-then-send.

**OPS (operacyjne):**

- GET /api/health — Health check (public: status+timestamp, admin+detail: DB+SMTP+cron)

**Auth:**

- POST /api/auth/login — Logowanie
- POST /api/auth/logout — Wylogowanie
- GET /api/auth/me — Aktualny użytkownik

2.4. PATCH jako form-submit endpoint

PATCH /api/reservations/\[id\] = form-submit endpoint z hybrydową
semantyką:

-   **Sekcje tablicowe (items, addons):** jeśli obecne w body → full
    replace (deleteMany + create). Brak w body → bez zmian. Pusta
    tablica = admin celowo usunął wszystko

-   **Pola skalarne (client, source, notes):** partial patch --- tylko
    wysłane się zmieniają

-   **Timeline:** auto-rebuild gdy items w payload
    (needsTimelineRebuild)

Admin zawsze wysyła kompletny stan formularza. Partial patch służy do
programistycznych update'ów.

2.5. Timeline cache --- architektura frontowa

**Source of truth:** backend (GET /api/timeline). Frontend cache = kopia
robocza.

**monthCache:** klucz = „YYYY-M", wartość = entries\[\] + statusy.
Entries deduplikowane po id.

**Zasady:**

14. Invalidation: atomowa aktualizacja stanu cache (delete keys) przed
    refetchem --- stare entries znikają z allEntries w następnym
    renderze

15. Replace per miesiąc, nigdy append --- loadMonth nadpisuje cały
    monthCache\[key\]

16. Po edit: invalidate oldRange + newRange + widoczny viewport

17. Po create/cancel: invalidate miesięcy z zakresu dat

18. Guard loadedMonthsRef.has(key) --- nie ładuje dwa razy

19. Backend jako source of truth --- frontend nie przechowuje trwałych
    danych

2.6. Granice ważności deleteMany + create

ReservationItem i ReservationAddon usuwane i tworzone od nowa przy
edycji --- świadomy replace snapshotów.

**Bezpieczne dziś:** ReservationItem referowany tylko przez
TimelineEntry (cascade) i ReservationAddon (cascade). Żadne inne modele.

**Trigger zmiany strategii:** nowy model z FK do ReservationItem lub
ReservationAddon (faktury, sprzątanie, audit log per pole). Wtedy
migracja na upsert/soft-replace.

2.7. Mapowanie resourceId + sortOrder --- kontrolowane ograniczenie

Frontend wysyła resourceId + sortOrder, backend mapuje na
reservationItemId. Działa dopóki: jeden zasób = jeden item per
rezerwacja, sortOrder deterministyczny.

**Docelowo:** clientItemKey/draftKey z frontendu (UUID per item).
Trigger: split-stay lub API zewnętrzne.

2.8. Ładowanie katalogu addonów

Trigger: otwarcie formularza (resetAll ustawia addonsLoaded=false).
Warunek domenowy: typ encji != BLOCK. Implementacyjnie: activeTab jako
proxy dla reservationType. Jeden fetch, podział po scope na GLOBAL i
PER_ITEM.

3\. Statusy rezerwacji

System rozróżnia TYP rezerwacji (type) od STATUSU (status). To są dwa
osobne pola.

3.1. Typy rezerwacji (type)

Pole type określa RODZAJ rezerwacji. NIE jest statusem.

  ---------- ------------ -------------------- ----------------------------
  **Type**   **Etykieta   **Timeline**         **Opis**
             PL**                              

  BOOKING    Rezerwacja   Kolor zależny od     Rezerwacja domku/pokoju.
                          statusu              Wymagany klient.

  OFFER      Oferta       Niebieska przerywana Oferta handlowa. Po
                          (zawsze)             akceptacji zmienia type na
                                               BOOKING.

  BLOCK      Blokada      Szara ciągła         Blokada zasobu. Klient
                          (zawsze)             opcjonalny.
  ---------- ------------ -------------------- ----------------------------

+-----------------------------------------------------------------------+
| **KRYTYCZNE ROZRÓŻNIENIE**                                            |
|                                                                       |
| OFFER i BLOCK to TYPY (type), NIE statusy. Oferta ma własny wygląd na |
| timeline (niebieska przerywana) niezależnie od statusu. Blokada ma    |
| własny wygląd (szara ciągła) niezależnie od statusu. Dopiero po       |
| akceptacji oferty type zmienia się z OFFER na BOOKING i wtedy status  |
| decyduje o kolorze.                                                   |
+-----------------------------------------------------------------------+

3.2. Statusy rezerwacji (status)

Pole status określa STAN rezerwacji. Dotyczy głównie type=BOOKING, ale
częściowo także OFFER i BLOCK.

  ------------ -------------- -------------------- ----------------------------
  **Status**   **Etykieta     **Timeline (dla      **Opis**
               PL**           BOOKING)**           

  PENDING      Oczekująca     Pomarańczowa ciągła  Oczekująca na wpłatę.
                                                   Blokuje zasób.

  CONFIRMED    Przyjęta       Zielona ciągła       Potwierdzona (wpłata
                                                   zaksęgowana). Blokuje zasób.

  CANCELLED    Anulowana      Znika z timeline     Anulowana. Zwalnia zasób.

  FINISHED     Zrealizowana   Szara ciągła         Pobyt zakończony. Auto po
                              (wygaszona)          północy checkout.

  NO_SHOW      Niestawienie   Ciemnoczerwona       Gość się nie stawił. Status
                              przerywana           odwracalny.
  ------------ -------------- -------------------- ----------------------------

*Uwaga: OFFER na timeline jest ZAWSZE niebieska przerywana niezależnie
od statusu (PENDING/CANCELLED). BLOCK jest ZAWSZE szara ciągła. Kolory z
powyższej tabeli dotyczą TYLKO type=BOOKING.*

3.3. Flaga operacyjna: requiresAttention

Flaga requiresAttention (boolean) to nie jest status główny. Jest to
dodatek alarmujący, który może pojawić się na każdym typie rezerwacji.

**Wizualizacja na timeline:** mrugający wykrzyknik widoczny na bloku
rezerwacji.

**Triggery (kiedy się aktywuje):**

-   Brak wpłaty w wymaganym terminie

-   Rata po terminie

-   Oferta wygasła (jeśli ustawiono opcję „Do wyjaśnienia")

-   Ręczne oznaczenie przez admina

**Powiadomienia:** Każda aktywacja requiresAttention generuje wpis w
karcie powiadomień administratora z opisanym powodem (enum/log).

3.4. Status płatności (paymentStatus)

Osobny od statusu rezerwacji. Trzy stany + flaga overdue:

  ------------ -------------- ---------------------------------------------
  **Status**   **Etykieta     **Opis**
               PL**           

  UNPAID       Brak           Brak jakiejkolwiek wpłaty

  PARTIAL      Częściowo      Wpłata poniżej całkowitej kwoty

  PAID         Opłacona       Pełna kwota zapłacona
  ------------ -------------- ---------------------------------------------

**Flaga overdue:** true/false --- informacja o przekroczeniu terminu
płatności. Nie jest osobnym statusem, ale dodatkową flagą wyświetlaną
jako badge na timeline.

4\. Macierz przejść statusów

4.1. Dozwolone przejścia (zaimplementowana state machine)

Wszystkie przejścia statusów rezerwacji przechodzą przez jeden centralny
mechanizm: reservation-transition.ts (transitionReservationStatus).
Gwarancje: FOR UPDATE lock, state machine validation po locku,
deterministyczny wynik (idempotent lub 409), audit log tylko dla
zwycięzcy, email po commit.

  ------------------- --------------------------- -----------------------
  **Z → Na**          **Warunek**                 **Efekt na timeline**

  PENDING → CONFIRMED Wpłata osiąga próg lub      Zmiana na zieloną
                      admin ręcznie (/confirm)

  PENDING → CANCELLED Admin anuluje (/cancel)      Timeline entries →
                                                  CANCELLED, zwalnia zasób

  PENDING → EXPIRED   System (przyszłość: auto)   Timeline entries →
                                                  CANCELLED, zwalnia zasób

  CONFIRMED →         Admin anuluje (/cancel)      Timeline entries →
  CANCELLED                                       CANCELLED, zwalnia zasób

  CONFIRMED → NO_SHOW Od dnia przyjazdu, admin    Timeline POZOSTAJE
                      oznacza (/no-show)           (nadal blokuje zasób)

  CONFIRMED →         Auto po północy checkout    Timeline → historyczny
  FINISHED            LUB admin ręcznie

  CANCELLED → PENDING Przywrócenie (/restore).    Nowe timeline entries
                      ZAWSZE do PENDING.           (ACTIVE), blokuje zasób.
                      Wymaga check availability.   Admin potwierdza osobno.

  NO_SHOW → CONFIRMED Admin jawnie potwierdza     Bez zmian (timeline
                      ponownie (/confirm).          ACTIVE przez cały czas)
                      NIE przez check-in.
  ------------------- --------------------------- -----------------------

Stany terminalne: EXPIRED, FINISHED.
Stan odwracalny: NO_SHOW (przez jawny /confirm).
Restore: CANCELLED → PENDING (nigdy do CONFIRMED bezpośrednio).

4.2. Przejścia USUNIĘTE z modelu (świadome decyzje)

  ------------------- ----------------------------------------
  **Przejście**       **Dlaczego usunięte**

  CONFIRMED → PENDING Zbyt ryzykowne operacyjnie. Admin cofa
                      przez cancel + restore.

  CANCELLED →         Restore zawsze do PENDING. Confirm
  CONFIRMED           jako osobna, świadoma akcja.

  NO_SHOW → CONFIRMED Check-in NIE zmienia statusu. Admin
  (via check-in)      musi jawnie potwierdzić (/confirm),
                      potem zameldować (/check-in).
  ------------------- ----------------------------------------

4.3. Kluczowe reguły przejść

20. CANCELLED zwalnia zasoby z timeline (soft delete: status=CANCELLED
    na TimelineEntry)

22. CANCELLED → PENDING (restore) WYMAGA sprawdzenia availability

23. Przywrócenie dostępne TYLKO z Listy rezerwacji lub pełnej karty

24. NO_SHOW można ustawić TYLKO od dnia rozpoczęcia pobytu, TYLKO dla
    CONFIRMED, TYLKO jeśli gość nie zameldowany

25. FINISHED ustawia się automatycznie po północy checkout+1

27. NO_SHOW jest stanem odwracalnym — admin potwierdza ponownie przez
    /confirm endpoint

5\. Zameldowanie i niestawienie

5.1. Zameldowanie (check-in)

Zameldowanie jest osobną operacją domenową — NIE jest przejściem statusu
rezerwacji. Ustawia bookingDetails.checkedInAt. NIE korzysta z
reservation-transition service.

**Endpoint:** POST /api/reservations/[id]/check-in
**Concurrency:** FOR UPDATE lock na reservation row.

**Warunki:**
- status MUSI być CONFIRMED (jedyny dozwolony)
- type MUSI być BOOKING
- today >= checkIn (od dnia przyjazdu)
- checkedInAt musi być null (idempotent — już zameldowany = no-op)

**Jeśli status = NO_SHOW:** endpoint zwraca 409 z komunikatem
"Najpierw cofnij niestawienie (potwierdź rezerwację), potem zamelduj."
Admin musi wykonać dwie osobne akcje: /confirm (NO_SHOW → CONFIRMED),
potem /check-in. Zero ukrytych ścieżek transition.

5.2. Niestawienie (NO_SHOW)

NO_SHOW jest pełnym statusem głównym rezerwacji. Jest stanem operacyjnym,
NIE terminalnym — może zostać odwrócony.

**Endpoint:** POST /api/reservations/[id]/no-show (via transition service)

**Warunki (walidowane w beforeUpdate hook):**
- status MUSI być CONFIRMED
- type MUSI być BOOKING
- today >= checkIn (od dnia przyjazdu)
- today < checkOut (przed zakończeniem pobytu)
- bookingDetails.checkedInAt MUSI być null

**Efekt:** Timeline entries POZOSTAJĄ ACTIVE (zasób nadal zablokowany).

**Odwrócenie:** Admin używa /confirm endpoint (NO_SHOW → CONFIRMED).
NIE przez check-in. Jawna, świadoma akcja.

+-----------------------------------------------------------------------+
| **Scenariusz późnego przyjazdu (po S3.1)**                            |
|                                                                       |
| Gość ma rezerwację CONFIRMED. Nie pojawia się w dniu checkIn → admin  |
| oznacza NO_SHOW (/no-show). Następnego dnia gość przyjeżdża → admin:  |
| 1) potwierdza rezerwację (/confirm, NO_SHOW → CONFIRMED),             |
| 2) zameldowuje (/check-in, ustawia checkedInAt).                      |
| Dwie osobne akcje. Potem po północy → FINISHED.                       |
+-----------------------------------------------------------------------+

6\. Blokady

Blokada to rezerwacja z type=BLOCK. Działa inaczej niż pozostałe
statusy.

6.1. Tworzenie blokady

Formularz tworzenia blokady zawiera:

29. Termin pobytu (daty)

30. Wybór klienta (opcjonalny --- use case: trzymam dla kogoś bez
    formalnej rezerwacji)

31. Zasoby (jeden lub wiele)

32. Nazwa blokady

33. Notatka wewnętrzna

6.2. Konwersja blokady na rezerwację/ofertę ✅

Po kliknięciu blokady na timeline, w slide panelu pojawia się:

-   **Przycisk „Zamień na rezerwację lub ofertę"** (ArrowLeftRight,
    btn-primary-bubble) --- otwiera UnifiedPanel z prefillem

-   **Przycisk „Usuń blokadę"** (btn-danger-bubble) --- anuluje blokadę
    i zwalnia zasoby

**Flow konwersji (zaimplementowany):**

34. Klik „Zamień na rezerwację lub ofertę"

35. Frontend fetchuje GET /api/reservations/\[id\] (source of truth, nie
    timeline)

36. Otwiera UnifiedPanel z prefillem: daty + WSZYSTKIE zasoby z blokady
    (multi-resource)

37. Wybór tab: „Rezerwację" lub „Ofertę"

38. excludeReservationId w availability check (blokada nie blokuje samej
    siebie)

39. Uzupełnienie: klient, cena, osoby, źródło

40. Zapis → POST /api/reservations/\[id\]/convert --- JEDNA transakcja
    DB

**Kolejność operacji w transakcji (krytyczna):**

41. SELECT FOR UPDATE (lock blokady --- zero double convert)

42. Walidacja: type === BLOCK, status !== CANCELLED

43. Create reservation (jeśli padnie → rollback, blokada nienaruszona)

44. Create timeline entries (nowa rezerwacja)

45. Log creation

46. Cancel block timeline entries (dopiero po sukcesie create)

47. Mark block as CANCELLED

48. Log block cancellation

+-----------------------------------------------------------------------+
| **DECYZJA ARCHITEKTONICZNA: Jeden endpoint, dwa flow-y**              |
|                                                                       |
| Endpoint POST /api/reservations/\[id\]/convert obsługuje zarówno      |
| OFFER → BOOKING jak i BLOCK → BOOKING/OFFER. Nie ma osobnego          |
| /api/blocks/ --- bo Block = Reservation z type=BLOCK. Twarda          |
| walidacja: if type===OFFER → flow 1, if type===BLOCK → flow 2, else → |
| error. Zero fallbacków.                                               |
+-----------------------------------------------------------------------+

**Slide panel blokady --- ukryte elementy:**

-   „Otwórz kartę rezerwacji" --- ukryty (nie dotyczy blokad)

-   Boxy Status rezerwacji + Płatność --- ukryte (nie dotyczy blokad)

7\. System ofert

7.1. Tworzenie oferty (backend)

Formularz tworzenia oferty zawiera:

49. Termin pobytu

50. Wybór klienta

51. Zasoby + cena + ilość osób

52. Checkbox „Dodaj obowiązkowe dodatki"

53. Ustawienie ważności oferty (data + godzina) + akcja po wygaśnięciu

54. Odpowiedzialny za rezerwację (domyślnie zalogowany user, opcjonalny)

55. Ÿródło

56. Uwagi gościa / Notatka wewnętrzna

7.2. Akcja po wygaśnięciu oferty

Ustawiane podczas tworzenia/edycji oferty. Dwie opcje:

  ---------------------- ------------------------------------------------
  **Opcja**              **Efekt**

  Zostanie anulowana     Status → CANCELLED, znika z timeline, zwalnia
                         zasoby

  Przejdzie w status „Do Pozostaje na timeline jako oferta (niebieska
  wyjaśnienia"           przerywana), aktywuje requiresAttention
  ---------------------- ------------------------------------------------

7.3. Akceptacja oferty

**Przez klienta (front):**

-   Klient klika „Akceptuję ofertę" na stronie /offer/:token

-   type zmienia się z OFFER na BOOKING

-   status zmienia się na PENDING (oczekująca na wpłatę)

-   Wizualnie na timeline: zmiana z niebieskiej przerywanej na
    pomarańczową ciągłą

-   Akceptacja NIE oznacza „Przyjęta" --- wymaga spełnienia warunku
    płatności

**Przez admina (panel):**

-   Admin może ręcznie ustawić ofertę jako Przyjętą (CONFIRMED) ---
    pomijając klienta

-   type zmienia się z OFFER na BOOKING, status na CONFIRMED

7.4. Blokowanie zasobów przez ofertę

+-----------------------------------------------------------------------+
| **KRYTYCZNA REGUŁA**                                                  |
|                                                                       |
| Oferta blokuje timeline i zasoby identycznie jak rezerwacja. Żaden    |
| klient i żaden użytkownik panelu nie może zablokować żadnego dnia dla |
| nowej rezerwacji, w którym widnieje aktywna oferta. Jedynym sposobem  |
| zwolnienia jest anulowanie oferty.                                    |
+-----------------------------------------------------------------------+

8\. System dodatków (Addons)

8.1. Zasada domenowa: katalog vs snapshot

**Addon (katalog)** = definicja startowa / szablon. Zawiera: nazwę,
opis, scope, pricingType, cenę, flagę required. Edytowalny przez admina
w dowolnym momencie.

**ReservationAddon (snapshot)** = zamrożona pozycja kalkulacyjna
przypisana do konkretnej rezerwacji. Zawiera snapshotName,
snapshotPrice, snapshotPricingType (kopia z katalogu) + edytowalne pola
kalkulacyjne: unitPrice, calcPersons, calcNights, calcQuantity.

**Zasady:**

57. Po dodaniu addonu do rezerwacji powstaje snapshot --- od tego
    momentu niezależny od katalogu

58. Edycja addonu w katalogu NIE wpływa na istniejące snapshoty

59. Edycja pól kalkulacyjnych w snapszcie NIE wpływa na katalog

60. Usunięcie/dezaktywacja addonu w katalogu NIE kasuje istniejących
    snapshotów

61. addonId w snapszcie to FK referencyjny (do historii/raportów), nie
    link operacyjny

8.2. Zakres dodatku (AddonScope)

Każdy addon ma dokładnie jeden scope --- GLOBAL albo PER_ITEM. Nie ma
dual scope.

  -------------- --------------------------------- -----------------------
  **Scope**      **Opis**                          **Przykład**

  GLOBAL         Dotyczy całej rezerwacji          Podatek turystyczny,
                 (reservationItemId = null)        parking

  PER_ITEM       Dotyczy konkretnego zasobu        Śniadanie, dostawka,
                 (reservationItemId = ID)          łóżeczko
  -------------- --------------------------------- -----------------------

Enum AddonScope na modelu Addon z \@default(GLOBAL). Index
@@index(\[scope, isActive\]). Blokada zmiany scope gdy addon używany w
rezerwacjach (PATCH walidacja).

8.3. Typy rozliczenia (AddonPricingType)

Type union, nie string. Runtime w 100% sterowany przez pricingType.

  ------------------ --------------------------------- -------------------
  **Typ**            **Formuła**                       **Przykład**

  PER_BOOKING        unitPrice × calcQuantity          Sprzątanie końcowe
                                                       (1×)

  PER_NIGHT          unitPrice × calcNights ×          Parking (noce ×
                     calcQuantity                      cena)

  PER_PERSON         unitPrice × calcPersons ×         Śniadanie (osoby ×
                     calcQuantity                      cena)

  PER_PERSON_NIGHT   unitPrice × calcPersons ×         Wyżywienie pełne
                     calcNights × calcQuantity         

  PER_UNIT           unitPrice × calcQuantity          Wypożyczenie kajaka
                                                       (szt. × cena)
  ------------------ --------------------------------- -------------------

PER_PERSON = adults + children (wszędzie spójnie, global i per-item).

8.4. Edytowalne pola kalkulacyjne

Po dodaniu addonu system prefilluje wartości z rezerwacji/zasobu, ale
admin może je ręcznie zmienić. Zmiana dat/osób w rezerwacji NIE
nadpisuje już dodanych addonów --- manual override ma pierwszeństwo.

**Prefill przy dodaniu (jednorazowy):**

-   unitPrice = cena z katalogu

-   calcPersons = adults + children (z zasobu dla PER_ITEM, z rezerwacji
    dla GLOBAL)

-   calcNights = noce z formularza

-   calcQuantity = 1 (PER_NIGHT i PER_PERSON nie podwajają ---
    calcNights/calcPersons już trzymają mnożniki)

**Widoczne pola per typ:**

  ------------------------ ----------- ----------- ----------- -----------
  **Typ**                  **Osoby**   **Noce**    **Ilość**   **Cena**

  PER_BOOKING              ---         ---         ---         ✓

  PER_NIGHT                ---         ✓           ---         ✓

  PER_PERSON               ✓           ---         ---         ✓

  PER_PERSON_NIGHT         ✓           ✓           ---         ✓

  PER_UNIT                 ---         ---         ✓           ✓
  ------------------------ ----------- ----------- ----------- -----------

**total = derived** --- wyliczany przez computeAddonTotal() przy
renderze, NIE trzymany w stanie formularza.

8.5. Pola snapshotu (ReservationAddon)

Pełny zestaw pól zapisywanych przy create/edit:

-   addonId, reservationId, reservationItemId (nullable)

-   snapshotName, snapshotPrice, snapshotPricingType --- kopia z
    katalogu

-   unitPrice, calcPersons, calcNights, calcQuantity --- edytowalne pola
    z formularza (zapis 1:1)

-   total --- wyliczony z powyższych w momencie zapisu

-   quantity --- legacy/backward compat, = calcQuantity

8.6. UI --- karty z edytowalnymi polami

Nowy model UI (zastąpił checkboxy):

-   Przycisk + Dodaj otwiera SlidePanel picker z listą dostępnych
    addonów

-   Picker: search, scope-aware, ukrywa już dodane, klik dodaje (nie
    zamyka --- user może dodać wiele)

-   Dodany addon = karta (AddonCard) z: nagłówkiem (nazwa + badge
    obowiązkowy + typ + total + X), edytowalnymi polami w jednej linii z
    ikonami (Users, Moon, Hash, DollarSign), inputami w-\[48px\] h-7

-   ConfirmDialog przy usuwaniu obowiązkowego z pytaniem o potwierdzenie

**Struktura w formularzu:**

-   Sekcja Globalne opłaty i dodatki --- między Zasobami a Szczegółami,
    z opisem

-   Sekcja Udogodnienia --- pod Dorośli/Dzieci w KAŻDYM zaznaczonym
    zasobie

-   Podsumowanie: Globalne opłaty i dodatki + Udogodnienia jako osobne
    wiersze + Razem

8.7. Auto-add obowiązkowych

**GLOBAL required:** auto-dodawane po załadowaniu katalogu addonów.
Guard: existing.has(addonId) --- zero duplikatów.

**PER_ITEM required:** auto-dodawane przy zaznaczeniu nowego zasobu
(useEffect na selectedResources). Nie dotyka istniejących snapshotów.
Guard: if (!itemAddons\[resourceId\]) --- inicjuje tylko puste.

**Przy edit:** loadReservationForEdit jawnie ustawia setSelectedAddons +
setItemAddons z danymi z API. Auto-add widzi że addons już istnieją →
nie nadpisuje. Nowy zasób (którego nie było) → auto-add required.

+-----------------------------------------------------------------------+
| **ZASADA**                                                            |
|                                                                       |
| Auto-add required działa tylko przy inicjalizacji pustego stanu lub   |
| dodaniu nowego zasobu. Nigdy nie modyfikuje już istniejącego          |
| snapshotu.                                                            |
+-----------------------------------------------------------------------+

8.8. Backend --- walidacja scope

-   scope=PER_ITEM bez resourceId → error

-   scope=PER_ITEM na nie-ACCOMMODATION → error (śniadanie na kajak =
    kabaret)

-   scope=GLOBAL z resourceId → ignoruje resourceId (reservationItemId =
    null)

-   Zmiana scope użytego addonu → zablokowana (PATCH walidacja: count
    ReservationAddon \> 0 → error)

8.9. Slide panel --- wyświetlanie addonów

r.addons dzielone na globalAddons (reservationItemId = null) i
itemAddonsMap (klucz = reservationItemId):

-   Per-item addony: wewnątrz rozwinięcia każdego zasobu, pod Suma
    pozycji --- nagłówek UDOGODNIENIA

-   Globalne: osobna sekcja w podsumowaniu cenowym --- nagłówek GLOBALNE
    OPŁATY I DODATKI

-   Udogodnienia (łącznie) --- zbiorczy wiersz z sumą per-item

-   Usunięty filtr isActive --- to snapshoty, zawsze wyświetlamy

8.10. Admin --- podstrona Dodatki

-   Formularz: nazwa, opis, zakres (Globalny/Per zasób), typ
    rozliczenia, cena, obowiązkowy

-   Pole Sposób wyboru (selectType) usunięte z UI --- DEPRECATED (patrz
    8.11)

-   Tabela: 5 kolumn --- Nazwa (z badges obowiązkowy + aktywny), Typ,
    Zakres, Cena, Akcje

-   PER_BOOKING + scope=PER_ITEM → etykieta Jednorazowo na zasób

8.11. selectType --- DEPRECATED

Pole selectType (CHECKBOX/QUANTITY/SELECT) istnieje w schemacie ale jest
martwe w runtime. Zachowanie UI sterowane wyłącznie przez pricingType.
Usunięte z formularza admin i tabeli. Do pełnego usunięcia (schema +
typy) w fazie porządkowej.

8.12. Przyszłe rozszerzenia (nie wdrażane teraz)

-   **maxPerItem / maxQuantity** na modelu Addon --- np. dostawka max 2
    na zasób. Trigger: realny use case w UI

-   **Wybór konkretnych dni** (np. 3 z 5 śniadań) --- osobny system
    (advanced addons), za duży scope

-   **Pełne usunięcie selectType** --- w fazie porządkowej po zamknięciu
    Fazy C

9\. Płatności --- Ledger finansowy

9.1. Zasady najwyższego poziomu

-   **Ledger immutable:** Payment to jedyne źródło prawdy o finansach
    rezerwacji. Nie edytujemy, nie usuwamy. Korekty = osobny rekord.

-   **Only CONFIRMED counts:** projekcje finansowe (paidAmountMinor,
    balanceDueMinor, paymentStatus) liczone WYŁĄCZNIE z płatności o
    statusie CONFIRMED.

-   **amountMinor (Int) wszędzie:** cały system finansowy operuje na
    minor units (grosze). Zero Decimal dla pieniędzy. Formatowanie do UI
    dopiero na końcu (amountMinor / 100).

-   **Direction rozstrzyga znak:** amount zawsze \> 0. Typ operacji
    (kind) + kierunek (direction: IN/OUT) decydują o wpływie na saldo.

-   **GlobalSettings steruje dostępnością metod** dla nowych operacji,
    ale nie unieważnia historycznych rekordów.

-   **Snapshot progu:** requiredDepositMinor snapshotowany na rezerwacji
    przy create --- zmiana GlobalSettings nie zmienia wymagań
    historycznych.

9.2. Model Payment (ledger)

Docelowy model gotowy na manual + online + workflow zatwierdzania:

  ------------------------- ------------------ -------------------------------
  **Pole**                  **Typ**            **Opis**

  id                        String (cuid)      Klucz główny

  reservationId             String (FK)        Powiązanie z rezerwacją

  kind                      PaymentKind        CHARGE / REFUND / ADJUSTMENT

  direction                 PaymentDirection   IN (inflow) / OUT (outflow)

  status                    PaymentStatus      PENDING / CONFIRMED / REJECTED
                                               / FAILED / CANCELLED

  method                    PaymentMethod      CASH / TRANSFER / TERMINAL /
                                               CARD / ONLINE / BLIK / OTHER

  amountMinor               Int                Kwota w groszach (zawsze \> 0)

  currency                  String             ISO 4217, default PLN

  occurredAt                DateTime           Data operacji finansowej (kiedy
                                               realnie zaszło)

  createdAt                 DateTime           Kiedy zapisano w systemie

  createdByUserId           String?            Kto zarejestrował

  createdSource             PaymentSource      ADMIN_MANUAL / SYSTEM / WEBHOOK
                                               / IMPORT

  confirmedByUserId +       String? +          Kto i kiedy zatwierdził
  confirmedAt               DateTime?          

  rejectedByUserId +        String? +          Kto, kiedy i dlaczego odrzucił
  rejectedAt +              DateTime? +        
  rejectionReason           String?            

  referenceNumber           String?            Nr przelewu / ID transakcji

  note                      String?            Notatka

  linkedPaymentId           String?            Referencja do powiązanej
                                               płatności (np. refund -\>
                                               charge)

  provider +                String? (nullable) Pola pod online payments
  providerPaymentId +                          (przyszłość)
  webhookEventId                               

  externalCorrelationId     String?            Idempotency key / integracje
  ------------------------- ------------------ -------------------------------

9.3. Enumy finansowe

**PaymentKind** --- rodzaj operacji: CHARGE (wpłata/obciążenie,
direction IN), REFUND (zwrot, direction OUT), ADJUSTMENT (korekta
księgowa, direction IN lub OUT).

**PaymentDirection** --- kierunek: IN (zwiększa paidAmount), OUT
(zmniejsza paidAmount). Rozwiazuje problem korekty w dół bez udawania
refundu.

**PaymentStatus** --- state machine (payment-transition.ts):

  PENDING   → [CONFIRMED, REJECTED, CANCELLED]
  CONFIRMED → [] (terminal, immutable)
  REJECTED  → [] (terminal)
  FAILED    → [] (terminal)
  CANCELLED → [] (terminal)

Wszystkie przejścia przez transitionPaymentStatus() z FOR UPDATE lock
na payment row. Lock order: payment → reservation. Idempotent check
po locku. Invalid transition → 409.

**PaymentMethod** --- stały enum: CASH, TRANSFER, TERMINAL, CARD,
ONLINE, BLIK, OTHER. GlobalSettings steruje dostępnością per kanał.

**PaymentSource** --- skąd przyszła: ADMIN_MANUAL, SYSTEM, WEBHOOK,
IMPORT.

9.4. Projekcje finansowe (cache)

Pola wyliczane z ledgera Payment --- nie są source of truth, tylko
cache:

  --------------------- ----------------- ------------------------------------
  **Pole**              **Lokalizacja**   **Wyliczenie**

  paidAmountMinor       BookingDetails    sum(CONFIRMED IN) - sum(CONFIRMED
                                          OUT)

  balanceDueMinor       BookingDetails    max(totalMinor - paidAmountMinor, 0)

  overpaidAmountMinor   BookingDetails    max(paidAmountMinor - totalMinor, 0)
                        (opcja)           

  paymentStatus         Reservation       UNPAID \| PARTIAL \| PAID
  --------------------- ----------------- ------------------------------------

+-----------------------------------------------------------------------+
| **ZASADA**                                                            |
|                                                                       |
| Only CONFIRMED counts. PENDING nie wpływa na saldo ani na             |
| automatyczne przejścia statusów rezerwacji.                           |
+-----------------------------------------------------------------------+

9.5. System minor units (amountMinor)

Cały system finansowy operuje na Int (grosze). Dotyczy WSZYSTKICH kwot:

-   Reservation: totalMinor, subtotalMinor, discountMinor

-   ReservationItem: pricePerUnitMinor, totalPriceMinor

-   ReservationAddon: snapshotPriceMinor, unitPriceMinor, totalMinor

-   BookingDetails: paidAmountMinor, balanceDueMinor

-   Addon (katalog): priceMinor

-   Payment: amountMinor

-   pricing-service, computeAddonTotal: operują na Int

-   UI: amountMinor / 100 + Intl.NumberFormat. Inputy: user wpisuje
    złotówki, system x100

+-----------------------------------------------------------------------+
| **ZASADA**                                                            |
|                                                                       |
| Zero Decimal dla pieniędzy. Stare pola Decimal = legacy/read-only.    |
| Kalkulacje wyłącznie \*Minor (Int).                                   |
+-----------------------------------------------------------------------+

9.6. Workflow PENDING / CONFIRM / REJECT

62. Admin rejestruje wpłatę → Payment PENDING (nie wpływa na saldo)

63. Manager/Admin zatwierdza → CONFIRMED (recalc projekcji, ewentualny
    auto-confirm rezerwacji)

64. Manager/Admin odrzuca → REJECTED (bez wpływu na saldo)

65. Webhook online → Payment CONFIRMED (lub PENDING → CONFIRMED)

Transitions: PENDING → CONFIRMED / REJECTED / FAILED / CANCELLED.
CONFIRMED = immutable.

9.7. Auto-confirm rezerwacji po wpłacie

Reservation PENDING → CONFIRMED gdy: sum(CONFIRMED IN) - sum(CONFIRMED
OUT) \>= requiredDepositMinor.

requiredDepositMinor = snapshot z GlobalSettings zapisany na rezerwacji
przy create. Brak retroakcji.

9.8. GlobalSettings --- metody płatności

Konfiguracja per metoda: isActive, availableForAdmin,
availableForWidget, availableForOnline, requiresConfirmation,
displayName, sortOrder.

Historyczne rekordy z wyłączoną metodą pozostają poprawne. Backend
waliduje aktywność dla nowych operacji.

9.9. RBAC płatności (policy layer)

Od D0 (30.03.2026) role są egzekwowane w backendzie (require-auth.ts +
payment-service.ts). Macierz uprawnień:

-   RECEPTION: view + create_pending (CHARGE PENDING)

-   MANAGER: jak RECEPTION + create_confirmed, confirm, reject, refund,
    adjustment

-   OWNER/ADMIN: pełny dostęp + force + adjustment

-   SYSTEM: create_confirmed (webhook), replay (idempotency)

Force: tylko OWNER/ADMIN, zawsze forceReason + log audytowy
FORCED_OPERATION.

**Macierz uprawnień (wdrożona D0):** RECEPTION: create_pending. MANAGER:
create_pending, create_confirmed, confirm, reject, refund, adjustment.
OWNER: wszystko + force. Egzekucja: getPaymentPermissions(role) w
payment-service.ts, getAuthContext() w require-auth.ts. Każdy route
płatności wywołuje getAuthContext() i sprawdza konkretne uprawnienie
przed akcją.

9.10. Walidacje biznesowe

-   amountMinor \> 0 (zawsze)

-   REFUND/OUT: nie przekracza netPaid (w transakcji), chyba że force

-   Metoda aktywna dla kanału (GlobalSettings), chyba że force

-   CANCELLED reservation: REFUND/ADJUSTMENT OK, CHARGE blokowane bez
    force

-   CONFIRMED Payment = immutable (nie cofamy)

9.11. Edycja rezerwacji po wpłatach

-   totalMinor zmienia się, balanceDueMinor przeliczane, paidAmountMinor
    bez zmian

-   paymentStatus przeliczany od nowa

-   Nadpłata: paymentStatus=PAID, balanceDue=0, overpaid \> 0. Admin
    decyduje o zwrocie.

9.12. Logi i audyt finansowy

Każda operacja generuje log: PAYMENT_CREATED/CONFIRMED/REJECTED,
REFUND_CREATED/CONFIRMED, PAYMENT_STATUS_CHANGED,
RESERVATION_AUTO_CONFIRMED_BY_PAYMENT, FORCED_OPERATION.

Log: reservationId, paymentId, actorUserId, timestamp, metadata (kwota,
metoda, reason).

9.13. UI płatności

**Slide panel rezerwacji (skrót):** total, wpłaty przyjęte, oczekujące,
zwroty, saldo, progress bar, lista ostatnich 3 płatności, CTA.

**Slide panel Rozliczenia:** summary kafle, pełna historia (ledger),
grupowanie Pending/Confirmed/Rejected, akcje Confirm/Reject, Dodaj
wpłatę/zwrot.

**Formularz:** kwota, metoda (aktywne z GlobalSettings), data operacji,
nr referencyjny, notatka, status PENDING/CONFIRMED.

Spójność: slide panel i karta rezerwacji = te same endpointy i DTO,
wspólne komponenty.

9.14. Endpointy API

  ----------------------------------- -----------------------------------------
  **Endpoint**                        **Opis**

  POST                                Rejestracja wpłaty/zwrotu/korekty
  /api/reservations/\[id\]/payments   

  POST /api/payments/\[id\]/confirm   Zatwierdzenie PENDING → CONFIRMED +
                                      recalc

  POST /api/payments/\[id\]/reject    Odrzucenie PENDING → REJECTED

  GET                                 Lista płatności + summary
  /api/reservations/\[id\]/payments   
  ----------------------------------- -----------------------------------------

9.15. Odroczone (C4+)

-   PaymentSchedule / harmonogram rat / overdue (C4)

-   Płatności online / bramka / webhook pipeline (C4)

-   Faktury / dokumenty księgowe (osobny moduł)

-   Zaawansowane korekty: reversals, chargebacks

-   Pełny RBAC z rolami ACCOUNTANT (Faza D)

10\. Ustawienia globalne

System ustawień jest podzielony na dwa moduły:

**Ustawienia systemu** (/admin/config) --- Zarządzanie → Ustawienia.
Taby: Rezerwacje, Płatności, Obiekt. Dotyczą konfiguracji rezerwacyjnej
i danych firmy. Zmiany dotyczą TYLKO przyszłych rezerwacji (nie wpływa
na istniejące).

**Ustawienia globalne** (/admin/global-settings) --- Pozostałe →
Ustawienia globalne. 4 podstrony (taby): Wygląd widżetu (/appearance),
Powiadomienia e-mail (/email), Szablony e-mail (/email-templates),
Logi e-mail (/email-logs). Dotyczą wyglądu publicznego frontendu
i systemu email. Redirect z /admin/global-settings → /appearance.

**Design System** (/admin/design-system) --- osobna pozycja na dole
sidebara (separator + link). 6 tabów: Typography, Colors & Tokens,
Buttons & Inputs, Selects & Pickers, Panels & Feedback, Layout &
Patterns. Żywa referencja UI z realnymi komponentami.

**Implementacja (D0 + E2-UI + E3a + E3b):** GlobalSettings z masterplanu
= model CompanySettings w Prisma. Ustawienia systemu: /admin/config z
tabami (Rezerwacje / Płatności / Obiekt). Ustawienia globalne:
/admin/global-settings z 4 podstronami (Wygląd = WidgetConfig,
Powiadomienia = SMTP/sender/bank/reminder, Szablony = EmailTemplate,
Logi = EmailLog). Użytkownicy: /admin/users. /admin/settings
zarezerwowane na przyszłość (profil użytkownika). API: GET/PATCH
/api/settings (system), GET/PATCH /api/settings/widget (wygląd),
GET/PATCH /api/settings/email (email), CRUD /api/settings/email/
templates (szablony), GET /api/settings/email/logs (logi).

10.1. Ustawienia rezerwacji (front klienta)

  ------------------ ------------------------------------ ---------------
  **Ustawienie**     **Opis**                             **Domyślnie**

  Czas na wpłatę     Ile godzin klient ma na zapłatę od   24h
                     złożenia rezerwacji                  

  Akcja po braku     Opcja 1: Auto anuluj (CANCELLED)     Auto anuluj
  wpłaty             Opcja 2: Oznacz jako „Do             
                     wyjaśnienia" (requiresAttention)     

  Procent zaliczki   Jaki % całkowitej ceny (zasoby +     30%
                     dodatki obowiązkowe) wymagany do     
                     CONFIRMED                            

  Deadline           Ile godzin przed terminem płatności  12h
  powiadomienia      wysłać przypomnienie                 

  Min. kwota raty    Minimalna kwota jednej raty (dotyczy 100 zł
                     TYLKO płatności online)              
  ------------------ ------------------------------------ ---------------

*WAŻNE: Czas na wpłatę dotyczy TYLKO rezerwacji z frontu (klient).
Rezerwacje tworzone ręcznie przez admina NIE mają tego limitu.*

10.2. Ustawienia metod płatności

Możliwość włączenia/wyłączenia każdej metody płatności w dowolnym
momencie.

10.3. Godziny operacyjne (Faza D)

  ------------------ ------------------------------------ ---------------
  **Ustawienie**     **Opis**                             **Domyślnie**

  checkInTime        Godzina zameldowania dla noclegów    15:00
                     (ACCOMMODATION)                      

  checkOutTime       Godzina wymeldowania dla noclegów    11:00
                     (ACCOMMODATION)                      
  ------------------ ------------------------------------ ---------------

Opcjonalny override per ResourceCategory (nullable --- null = użyj
globalnych). Godziny służą do wyliczenia ReservationItem.startAt/endAt
przy tworzeniu rezerwacji. Patrz: Faza D w roadmapie.

11\. Frontend klienta (Widget)

Zaawansowany moduł rezerwacyjny (typu ProfitRoom/iDoBooking) osadzany w
dowolnym froncie.

11.1. Flow rezerwacji klienta

66. Klient widzi ceny od razu (na podstawie cennika)

67. Składa rezerwację → wpada na timeline jako PENDING → blokuje termin
    natychmiast

68. Klient otrzymuje link potwierdzający (/offer/:token)

69. Link NIE wygasa --- klient może wrócić w dowolnej chwili

70. Klient płaci minimum wymagany % → status zmienia się na CONFIRMED

71. Jeśli nie zapłaci w terminie → zgodnie z ustawieniami (anuluj lub do
    wyjaśnienia)

11.2. Płatności klienta

-   Pierwsza wpłata: minimum procentowa kwota (wyliczona automatycznie,
    zaokrąglona w górę)

-   Może od razu wpłacić całość

-   Raty (dopłata): możliwość wprowadzenia własnej kwoty (nie mniejszej
    niż ustawienie globalne min. raty)

-   Zasada min. raty dotyczy TYLKO płatności online --- przelew
    tradycyjny bez limitu

-   **Cena zamrożona:** klient płaci dokładnie tę kwotę, którą zobaczył
    przy rezerwacji. Zmiana cennika nie wpływa na istniejące rezerwacje.

11.3. Reguły frontu

-   Klient NIE może edytować złożonej rezerwacji

-   Overbooking: NIEMOŻLIWY --- blokada terminu pojawia się natychmiast
    po złożeniu

-   Status zmienia się na CONFIRMED automatycznie po zaksęgowaniu wpłaty
    (webhook), NIE po kliknięciu „zapłać"

-   Powiadomienia: email + infrastruktura pod SMS

-   Możliwość założenia konta (klient trzyma wszystkie rezerwacje w
    jednym miejscu)

12\. System użytkowników i uprawnień

Menu: Pozostałe → Użytkownicy (URL: /admin/users). OWNER only.

12.1. Dane użytkownika

-   Login

-   Hasło (generowane, zmiana przy pierwszym logowaniu)

-   Imię, Nazwisko

-   E-mail, Telefon

-   Aktywny dostęp do panelu (checkbox)

12.2. Uprawnienia do modułów

Każdy moduł ma 3 poziomy dostępu:

  ---------------------- ----------- ----------- --------------------------
  **Moduł**              **Pełny**   **Tylko     **Brak**
                                     odczyt**    

  Rezerwacje             TAK         TAK         TAK

  Sprzątanie             TAK         TAK         TAK

  Planowanie sprzątania  TAK         ---         TAK

  Drukowanie list        TAK         TAK         TAK

  Klienci                TAK         TAK         TAK

  Kreator ofert          TAK         TAK         TAK

  System cenowy          TAK         TAK         TAK

  Zarządzanie            TAK         TAK         TAK
  użytkownikami                                  
  ---------------------- ----------- ----------- --------------------------

*Lista modułów będzie rozszerzana w przyszłości.*

13\. System logów

Wszystkie zmiany statusów, płatności oraz kluczowych danych rezerwacji
są zapisywane w historii operacji.

**Każdy log zawiera:**

-   Data i godzina

-   Użytkownik (kto dokonał zmiany)

-   Zakres zmiany (co się zmieniło)

-   Wartości przed i po

-   Typ akcji (CREATED, STATUS_CHANGE, EDITED, CONVERTED, PAYMENT, itp.)

Logi widoczne w karcie rezerwacji jako historia operacji.

14\. Timeline --- specyfikacja wizualna

14.1. Kolory bloków

  -------------------- ------------------ -------------------------------
  **Status**           **Kolor**          **Styl linii**

  Oferta (OFFER)       Niebieski          Przerywana

  Oczekująca (PENDING) Pomarańczowy       Ciągła

  Przyjęta (CONFIRMED) Zielony            Ciągła

  Anulowana            ---                Znika z timeline
  (CANCELLED)                             

  Zrealizowana         Szary (wygaszony)  Ciągła
  (FINISHED)                              

  Blokada (BLOCK)      Szary              Ciągła

  Niestawienie         Ciemnoczerwony     Przerywana
  (NO_SHOW)                               
  -------------------- ------------------ -------------------------------

14.2. Badge'e na blokach

  ---------------- ------------------------ -------------------------------------
  **Badge**        **Kiedy**                **Wizualizacja**

  Płatność         BOOKING/OFFER            Opłacona (zielony) / Częściowo
                                            (żółty) / Brak (szary) / Po terminie
                                            (czerwony)

  Zameldowany      CONFIRMED + checkedIn    Ikonka check

  Do wyjaśnienia   requiresAttention=true   Mrugający wykrzyknik

  Multi-resource   Wiele zasobów w          Badge z liczbą (np. 3x)
                   rezerwacji               
  ---------------- ------------------------ -------------------------------------

14.3. Interakcje

-   Hover: rich tooltip (typ, numer, klient, daty, noce, zasoby)

-   Klik w blok: slide panel operacyjny (szczegóły + akcje +
    zameldowanie)

-   Klik na pustą komórkę: quick action (nowa rezerwacja/oferta/blokada
    z prefillem dat i zasobu)

-   Klik w wiersz listy (rezerwacje/oferty): slide panel (nie routing do
    podstrony)

-   Scroll: infinite scroll z lazy loading miesiącami

-   Legenda: filtrowanie typów (klik toggleuje widoczność)

14.4. Slide Panel --- operacyjne narzędzie recepcji

Slide panel to główne narzędzie obsługi rezerwacji. Otwiera się po
kliknięciu w blok na timeline lub wiersz na liście. Fetchuje PEŁNE dane
z GET /api/reservations/\[id\] --- nie polega na danych z timeline
entry.

**8 sekcji panelu (kolejność):**

72. Klient --- imię/firma, osoba kontaktowa, telefon (tel:), email
    (mailto:), link do karty klienta, dropdown „Powiadom klienta" (4
    opcje: Próśba o wpłatę, Próśba o dopłatę, Stan rezerwacji,
    Instrukcja dojazdu)

73. Status rezerwacji + Płatność --- dwa boxy obok siebie (bubble
    border-2, text-center) z badge'ami. Alert badges pod spodem
    (Zameldowany, Po terminie, Wymaga uwagi)

74. Zameldowanie --- ikonka statusu (emerald/red/muted) + opis + tooltip
    „Możliwe od: \[data\]"

75. Termin --- duże daty (26px bold), miesiąc + dzień tygodnia, strzałka
    z liczbą nocy (20px primary), godziny: od 15:00 (primary), do 11:00
    (destructive)

76. Zasoby --- expandable bubble cards per ReservationItem (rounded-2xl
    border-2, hover:border-primary/20). Po kliknięciu: CSS grid
    animation (grid-rows-\[0fr\] → grid-rows-\[1fr\]), szczegóły z
    ikonami: cena/jednostkę, noce, ilość, osoby, suma pozycji.
    Podsumowanie: suma noclegi + rabat (kolor primary) + razem

77. Sprzątanie --- placeholder (moduł wkrótce)

78. Rozliczenia --- progress bar (emerald/amber/gray), koszt całkowity,
    wymagana przedpłata (30%), wpłaty przyjęte, wpłaty oczekujące, saldo
    do zapłaty, alert „Termin płatności minął"

79. Pozostałe --- źródło (EMAIL/PHONE/WWW\...), uwagi gościa, notatka
    wewnętrzna (NORMALNY font, nie italic/thin)

**Akcje w panelu (przyciski):**

-   **Zamelduj gościa** --- bg-purple-600 hover:bg-purple-700 text-white
    rounded-full (identyczny kolor jak na karcie rezerwacji, NIE primary
    blue). Opacity-40 gdy przed datą przyjazdu, ale KLIKALNY (toast z
    komunikatem)

-   **Klient nie stawił się** --- btn-secondary-bubble (basic)

-   **Edytuj rezerwację** --- btn-secondary-bubble. NIE wywołuje
    onClose() --- detail panel zostaje otwarty pod unified edit panel.
    Zamknięcie edycji wraca do detail panelu

-   **Anuluj rezerwację** --- btn-danger-bubble z ConfirmDialog

-   **Otwórz kartę rezerwacji** --- btn-secondary-bubble (przejście na
    pełną podstronę)

**Dropdown „Powiadom klienta"** (w sekcji Klient):

-   Próśba o wpłatę

-   Próśba o dopłatę

-   Stan rezerwacji

-   Instrukcja dojazdu

*Placeholder --- pełna funkcjonalność w module komunikacji.*

**Animacja slide panelu:**

-   Wjazd: translateX(100%) → translateX(0), 250ms cubic-bezier(0.4, 0,
    0.2, 1)

-   Wyjazd: translateX(0) → translateX(100%), 250ms cubic-bezier +
    backdrop opacity fade

-   State: visible + closing, setTimeout 250ms przed unmount

14.5. Karta rezerwacji (pełna podstrona)

Karta rezerwacji to pełna podstrona /admin/reservations/\[id\]. Jest
rozszerzonym widokiem UI, NIE innym modelem danych.

+-----------------------------------------------------------------------+
| **ARCHITEKTURA: JEDNO ŸRÓDŁO DANYCH**                                 |
|                                                                       |
| Slide panel i karta rezerwacji korzystają z IDENTYCZNEGO endpointu    |
| GET /api/reservations/\[id\]. Ten sam response, zero osobnych         |
| endpointów, zero warunkowych pól, zero ?full=true.                    |
+-----------------------------------------------------------------------+

**Różnice wobec slide panelu:**

-   Więcej sekcji UI: historia statusów, logi operacji, zarządzanie
    płatnościami, dokumenty (w przyszłości)

-   Pełna strona (nie overlay) --- więcej miejsca na tabele i szczegóły

-   Dostępna przez przycisk „Otwórz kartę rezerwacji" w slide panelu

**Nazewnictwo (system-wide):**

-   „Otwórz pełne szczegóły" → „Otwórz kartę rezerwacji" --- wszędzie w
    systemie

-   „Akcje" dropdown → „Powiadom klienta" --- wszędzie w panelu

15\. API --- endpointy

Pełna lista endpointów systemu rezerwacyjnego:

15.1. Rezerwacje

  ------------------------------- ------------ -------------------------------------
  **Endpoint**                    **Metoda**   **Opis**

  POST /api/reservations          POST         Tworzenie (BOOKING/OFFER/BLOCK)

  GET /api/reservations           GET          Lista z filtrami

  GET /api/reservations/\[id\]    GET          Szczegóły

  PATCH /api/reservations/\[id\]  PATCH        Edycja danych + force

  POST                            POST         Ręczne potwierdzenie przez admina
  /reservations/\[id\]/confirm                 

  POST                            POST         Anuluj rezerwację
  /reservations/\[id\]/cancel                  

  POST                            POST         OFFER → BOOKING + BLOCK →
  /reservations/\[id\]/convert                 BOOKING/OFFER (lock, 1 transakcja)

  POST                            POST         Zameldowanie gościa
  /reservations/\[id\]/check-in                

  POST                            POST         Oznaczenie niestawienia
  /reservations/\[id\]/no-show                 

  POST                            POST         Przywróć anulowane (z check
  /reservations/\[id\]/restore                 availability)

  GET /api/timeline               GET          Timeline dane
  ------------------------------- ------------ -------------------------------------

+-----------------------------------------------------------------------+
| **UWAGA: Endpoint /confirm**                                          |
|                                                                       |
| Endpoint POST /reservations/\[id\]/confirm służy WYŁĄCZNIE do         |
| ręcznego ustawienia statusu CONFIRMED przez admina. NIE zastępuje     |
| logiki płatności. W normalnym flow status zmienia się automatycznie   |
| po zaksęgowaniu wpłaty (webhook). Admin używa tego endpointu tylko    |
| wtedy, gdy chce ręcznie potwierdzić rezerwację (np. płatność gotówką, |
| przelew tradycyjny, decyzja biznesowa).                               |
+-----------------------------------------------------------------------+

15.2. Płatności (Faza C)

  ----------------------------------- ------------ -------------------------------
  **Endpoint**                        **Metoda**   **Opis**

  POST                                POST         Rejestracja
  /api/reservations/\[id\]/payments                wpłaty/zwrotu/korekty
                                                   (PENDING/CONFIRMED)

  GET                                 GET          Lista płatności + summary
  /api/reservations/\[id\]/payments                finansowe

  POST /api/payments/\[id\]/confirm   POST         Zatwierdzenie PENDING →
                                                   CONFIRMED + recalc projekcji

  POST /api/payments/\[id\]/reject    POST         Odrzucenie PENDING → REJECTED
  ----------------------------------- ------------ -------------------------------

15.3. Dodatki (DONE)

  ------------------------- ------------ ------------------------- ------------
  **Endpoint**              **Metoda**   **Opis**                  **Status**

  GET /api/addons           GET          Lista z filtrami (search, DONE
                                         active, required)         

  POST /api/addons          POST         Utwórz dodatek (walidacja DONE
                                         nazwy, ceny, typu)        

  GET /api/addons/\[id\]    GET          Szczegóły dodatku         DONE

  PATCH /api/addons/\[id\]  PATCH        Edycja dowolnych pól      DONE

  DELETE /api/addons/\[id\] DELETE       Soft delete (jeśli        DONE
                                         używany) / hard delete    
  ------------------------- ------------ ------------------------- ------------

15.4. Publiczne API (E1 + E2 — DONE)

**E1 (availability + pricing):**
- GET /api/public/availability — Dostępność zasobów na daty, opcjonalne filtry (categoryType, adults, children). Rate limit: 60 req/min per IP.
- POST /api/public/quote-preview — Minimalna cena za noc per wariant (batch, max 50). Rate limit: 30 req/min per IP.
- POST /api/public/quote — Formalna wycena z pełnym rozbiciem per noc, sezonem, rabatem, deposit. Tworzy Quote w DB. Rate limit: 10 req/min per IP.

**E2 (booking + catalog + reservation view):**
- POST /api/public/book — Tworzenie rezerwacji z Quote. 13-krokowa transakcja z FOR UPDATE lock. Input: quoteId + quoteSecret + client data + consent. Output: reservationNumber + token. Rate limit: 5 req/min per IP.
- GET /api/public/resources-catalog — Katalog zasobów dla widgetu (trojna blokada: ACTIVE + visibleInWidget + ACCOMMODATION). Rate limit: 60 req/min per IP.
- GET /api/public/reservation/[token] — Publiczny widok rezerwacji po tokenie (read-only, zero PII). Bez rate limitu.

Wszystkie bez autoryzacji, chronione rate limiterem (in-memory, per IP, sliding window).

15.5. Użytkownicy (D0 — DONE)

- GET /api/users — Lista użytkowników (OWNER only)
- POST /api/users — Utwórz użytkownika (OWNER only)
- GET /api/users/[id] — Szczegóły użytkownika
- PATCH /api/users/[id] — Edycja użytkownika
- DELETE /api/users/[id] — Dezaktywacja użytkownika
- POST /api/users/[id]/reset-password — Reset hasła (generuje nowe)
- GET/POST /api/avatars/[...key] — Upload i streaming avatarów (LocalDiskStorage)

15.6. Ustawienia (D0 — DONE)

- GET /api/settings — Odczyt CompanySettings
- PATCH /api/settings — Edycja ustawień
- GET /api/settings/payment-methods — Lista metod płatności
- PATCH /api/settings/payment-methods — Edycja metod płatności

15.7. Zasoby, Cennik, Klienci, Tagi, Auth

- GET/POST /api/resources + GET/PATCH/DELETE /api/resources/[id] + PUT /api/resources/reorder
- GET /api/resource-categories + PATCH /api/resource-categories/[id]
- GET/POST /api/rate-plans + GET/PATCH/DELETE /api/rate-plans/[id]
- GET/POST /api/seasons + GET/PATCH/DELETE /api/seasons/[id]
- GET/POST /api/price-entries
- GET/POST /api/promo-codes + GET/PATCH/DELETE /api/promo-codes/[id]
- GET/POST /api/clients + GET/PATCH/DELETE /api/clients/[id]
- GET /api/tags
- POST /api/auth/login + POST /api/auth/logout + GET /api/auth/me

16\. Schema bazy danych (kluczowe modele)

Pełny schema w pliku prisma/schema.prisma. Poniżej kluczowe modele:

16.1. Reservation

  ---------------------- ------------------- -------------------------------------
  **Pole**               **Typ**             **Opis**

  id                     String (cuid)       Klucz główny

  number                 String (unique)     Numer: ZW-YYYY-NNNN / OF-YYYY-NNNN /
                                             BL-YYYY-NNNN

  type                   ReservationType     BOOKING \| OFFER \| BLOCK

  status                 ReservationStatus   PENDING \| CONFIRMED \| CANCELLED \|
                                             EXPIRED \| FINISHED \| NO_SHOW

  requiresAttention      Boolean             Flaga alarmowa (mrugający wykrzyknik)

  paymentStatus          ResPaymentStatus    UNPAID \| PARTIAL \| PAID

  overdue                Boolean             Flaga przekroczenia terminu płatności

  clientId               String?             FK do Client (nullable dla BLOCK)

  assignedUserId         String?             Odpowiedzialny za rezerwację

  checkIn / checkOut     Date                Daty pobytu

  nights                 Int                 Liczba nocy

  adults / children      Int                 Liczba gości

  subtotal / discount /  Decimal             Kwoty (LEGACY po C1a --- read-only)
  total                                      

  subtotalMinor /        Int                 Kwoty w groszach (source of truth od
  discountMinor /                            C1a, patrz 9.5)
  totalMinor                                 

  requiredDepositMinor   Int                 Snapshot progu potwierdzenia (grosze,
                                             patrz 9.7)
  ---------------------- ------------------- -------------------------------------

16.2. Status modeli dodatkowych

  ---------------------- ------------------------------------------------
  **Model**              **Status**

  PaymentSchedule        W schema (stub). Implementacja przy E4
                         (Przelewy24) — harmonogram rat.

  ReservationAddon       ✅ ZREALIZOWANY (Faza B). Snapshot z polami
  (snapshot)             calcPersons/calcNights/calcQuantity
                         (patrz rozdział 8).

  User + UserRole        ✅ ZREALIZOWANY (D0). RBAC: OWNER/MANAGER/
                         RECEPTION. Avatar upload. require-auth.ts.

  CompanySettings        ✅ ROZSZERZONY (D0 + D159-162). Zawiera
  (ustawienia globalne)  checkInTime/checkOutTime, deposit, payment
                         deadline, payment methods config.
                         ResourceCategory.checkInTimeOverride = per-
                         category override (D159-162).

  Quote                  ✅ ZREALIZOWANY (E1). Single-use, payloadHash
                         SHA-256, anti-enumeration (id + secret), 30min
                         expiry, DB storage.

  ResourceImage          ✅ ZREALIZOWANY (B1). storageKey/thumbnailKey/
                         mediumKey (3 rozmiary WebP), alt, position,
                         isCover (partial unique index), checksum SHA-256.

  ResourceBed            ✅ ZREALIZOWANY (B2). bedType (typed vocabulary
                         BED_TYPES, 7 typów), quantity (1-20).
                         @@unique([resourceId, bedType]).

  WidgetConfig           W schema (stub). Implementacja przy E2 —
                         konfiguracja widgetu rezerwacyjnego.
  ---------------------- ------------------------------------------------

17\. Plan implementacji (fazy)

FAZA A: Statusy + Zameldowanie + Timeline + Slide Panel --- ZREALIZOWANA
✅

**Status: ZREALIZOWANA** --- wdrożona 28 marca 2026

**Backend (zrealizowane):**

80. Schema v5.0: FINISHED + NO_SHOW w enum, ReservationItem zamiast
    ReservationResource, TimelineEntry z DateTime, Property model,
    ClientStats

81. 3 nowe endpointy: POST /check-in (zameldowanie), POST /no-show
    (niestawienie), POST /restore (przywrócenie anulowanej)

82. Pełna macierz przejść statusów w canTransition()

83. Race condition protection: SELECT FOR UPDATE na QUANTITY_TIME,
    exclusion constraint na ACCOMMODATION/TIME_SLOT

84. Shared timeline-service.ts: checkAvailability,
    checkQuantityAvailability, createTimelineEntry,
    cancelTimelineEntries

85. Structured error codes: VALIDATION/CONFLICT/NOT_FOUND/SERVER_ERROR

**Frontend (zrealizowane):**

86. Kolory timeline per status: CONFIRMED=zielona, PENDING=pomarańczowa,
    FINISHED=szara, NO_SHOW=czerwona przerywana, OFFER=niebieska
    przerywana, BLOCK=szara, CANCELLED=hidden

87. Badge'e na timeline (max 2, priorytet: overdue \> attention \>
    payment \> checkIn)

88. Operacyjny slide panel z 8 sekcjami (klient, statusy, zameldowanie,
    termin, zasoby, sprzątanie, rozliczenia, pozostałe)

89. Karta rezerwacji jako pełna podstrona /admin/reservations/\[id\]

90. Slide panel + karta rezerwacji = ten sam endpoint GET
    /api/reservations/\[id\]

91. Listy rezerwacji/ofert: klik w wiersz = slide panel (nie routing),
    onRefresh po akcji

92. Slide panel: animacja wjazdu/wyjazdu (translateX 250ms cubic-bezier)

93. Zasoby w expandable bubble cards z CSS grid animation i szczegółami
    ceny

94. Rozliczenia z progress bar + przedpłata 30% + saldo

95. Zamelduj gościa: bg-purple-600 (nie primary), Rabat: primary blue
    (nie emerald)

96. Edytuj rezerwację nie zamyka detail panelu --- wraca do niego po
    zamknięciu edycji

97. Nazewnictwo: „Otwórz kartę rezerwacji" (nie „pełne szczegóły"),
    „Powiadom klienta" (nie „Akcje")

**Brakuje (przeniesione do przyszłych faz):**

-   Auto-FINISHED: cron/scheduled task po północy checkout (Faza C/D)

-   Moduł komunikacji: „Powiadom klienta" placeholder (Faza C/D)

-   Moduł sprzątania: placeholder (osobna faza)

FAZA B: Dodatki + Konwersja blokady + Przebudowa edycji --- ZREALIZOWANA
✅

**Status: ZREALIZOWANA** --- wdrożona 28 marca 2026

**B1. Addons CRUD (katalog):**

98. Backend: GET/POST /api/addons + GET/PATCH/DELETE /api/addons/\[id\]

99. Soft delete jeśli addon używany w rezerwacjach, hard delete jeśli
    nie

100. Frontend: strona /admin/addons --- lista tabelowa + slide panel
     formularz

101. Sidebar: „Dodatki" z ikoną Package pod „Zasoby"

102. 5 typów rozliczenia (twardy enum): PER_BOOKING / PER_NIGHT /
     PER_PERSON / PER_PERSON_NIGHT / PER_UNIT

103. Nowy enum AddonScope: GLOBAL / PER_ITEM z polem scope na Addon

104. Blokada zmiany scope gdy addon używany w rezerwacjach

105. Tabela: 5 kolumn --- Nazwa (z badges), Typ, Zakres, Cena, Akcje

**B2. Konwersja blokady:**

106. POST /api/reservations/\[id\]/convert --- dwa flow-y:
     OFFER→BOOKING + BLOCK→BOOKING/OFFER

107. SELECT \... FOR UPDATE lock, jedna transakcja, create first →
     cancel block last

108. generateSecureToken() dla OfferDetails.token

109. Prefill z GET /api/reservations/\[id\], multi-resource,
     excludeReservationId

**B3. Przebudowa systemu dodatków (karty z edytowalnymi polami):**

110. Nowy plik addon-types.ts: type unions (AddonPricingType,
     AddonScope), computeAddonTotal(), createSelectedAddon(),
     getEditableFields()

111. SelectedAddon z edytowalnymi polami: unitPrice, calcPersons,
     calcNights, calcQuantity

112. total = derived (computeAddonTotal), nie w stanie

113. AddonCard: kompaktowa karta z ikonami (Users, Moon, Hash,
     DollarSign), inputy w-\[48px\]

114. AddonPickerPanel: SlidePanel z search, scope-aware, ukrywa dodane

115. AddonsSection: „Globalne opłaty i dodatki" z opisem + przycisk „+
     Dodaj" + karty + ConfirmDialog przy usuwaniu obowiązkowego

116. ItemAddonsSection: „Udogodnienia" pod każdym zasobem + przycisk „+
     Dodaj"

117. Auto-add required: GLOBAL po załadowaniu, PER_ITEM po zaznaczeniu
     zasobu

118. Prefill jednorazowy przy addAddon(), zmiana dat/osób NIE nadpisuje
     już dodanych

**B4. Schema --- nowe pola na ReservationAddon:**

-   calcPersons Int \@default(1), calcNights Int \@default(1),
    calcQuantity Int \@default(1)

-   Zapis 1:1 z formularza, odczyt 1:1 przy edycji --- zero
    reverse-engineeringu

**B5. PATCH /api/reservations/\[id\] --- pełna przebudowa (9 kroków):**

119. FETCH current

120. DETERMINE changes (needsTimelineRebuild = timelineChanged \|\|
     !!rawItems)

121. CANCEL old timeline entries

122. REPLACE ReservationItems --- deleteMany + create, zbieramy
     newItems\[\] z nowymi ID

123. CHECK availability + CREATE timeline entries z reservationItemId od
     razu (zero null, zero repair-step)

124. REPLACE addons --- deleteMany + create, mapuje po newItems z kroku
     4

125. RECALCULATE totals --- z DB (items + addons)

126. UPDATE core fields

127. STATUS LOG

Jedna transakcja. Timeline entries powstają z poprawnym
reservationItemId w jednym kroku.

**B6. Prefill edycji w UnifiedPanel:**

-   loadReservationForEdit prefilluje: daty, klienta, źródło, notatki,
    zasoby, globalne addony, per-item addony

-   Mapowanie reservationItemId → resourceId (per-item addony trafają
    pod właściwe zasoby)

-   Odczyt calcPersons/calcNights/calcQuantity bezpośrednio z API (1:1)

**B7. Slide panel --- wyświetlanie addonów:**

-   Per-item addony wewnątrz rozwinięcia zasobu (nagłówek
    „UDOGODNIENIA")

-   Globalne w podsumowaniu (nagłówek „GLOBALNE OPŁATY I DODATKI")

-   refreshKey prop --- panel refetchuje dane po edycji bez zamykania

**B8. Timeline --- fixy:**

-   Off-by-one dates: usunięty addDays(endCol, 1), selectionNights =
    endCol - startCol

-   Duplikaty po edycji: invalidateMonths czyści monthCache atomowo
    przed refetchem

-   PATCH response zwraca needsTimelineRebuild (nie timelineChanged) ---
    frontend zawsze invaliduje gdy items w payload

-   handleEdited zawsze invaliduje oldRange + newRange + widoczny
    viewport

FAZA C: Płatności --- Ledger finansowy

**Status: C1a, C1b, C1c, C2 --- ZREALIZOWANE** --- wdrożone 29--30 marca
2026

**Priorytet: WYSOKI** --- pełna specyfikacja w rozdziale 9

**C1a. Migracja na minor units (fundament): --- ZREALIZOWANA ✅
29.03.2026**

128. Nowe pola \*Minor (Int) na: Reservation, ReservationItem,
     ReservationAddon, BookingDetails, Addon

129. Backfill danych: UPDATE SET \*Minor = ROUND(\* \* 100) dla
     istniejących rekordów

130. Przełączenie pricing-service, computeAddonTotal, PATCH recalc na
     Int

131. Aktualizacja UI: fmtMoney(minor/100), inputy cen x100 przed
     wysłaniem

132. Stare Decimal = legacy/read-only, \*Minor = jedyne source of truth

**C1b. Payment ledger + endpointy: --- ZREALIZOWANA ✅ 29.03.2026**

133. Schema: Payment (kind, direction, status, method, amountMinor,
     actor fields, provider fields nullable)

134. Enumy: PaymentKind, PaymentDirection, PaymentStatus, PaymentMethod,
     PaymentSource

135. requiredDepositMinor snapshot na Reservation

136. GlobalSettings: paymentMethods config (isActive, kanały,
     requiresConfirmation)

137. POST /api/reservations/\[id\]/payments (create PENDING/CONFIRMED)

138. POST /api/payments/\[id\]/confirm + /reject

139. GET /api/reservations/\[id\]/payments + summary

140. recalculateFinancialProjection() --- liczy netPaid z CONFIRMED only

141. Policy layer (role checks gotowe na RBAC bez refaktoru)

142. Audit logging każdej operacji

**C1c. Integracja z istniejącym systemem: --- ZREALIZOWANA ✅ 29.03.2026
(w ramach C1b)**

143. PATCH recalc używa minor units

144. paymentStatus przeliczany z CONFIRMED payments

145. Slide panel progress bar z realnymi danymi

**C2. UI operacyjne (slide panele): --- ZREALIZOWANA ✅ 30.03.2026**

146. Sekcja Rozliczenia w slide panelu rezerwacji (skrót: total, saldo,
     progress, 3 ostatnie płatności)

147. Slide panel Rozliczenia (pełna historia + zatwierdzanie
     PENDING/CONFIRM/REJECT)

148. Slide panel Dodaj wpłatę/zwrot (formularz z metodą z
     GlobalSettings)

**C3. Karta rezerwacji = pełne centrum finansowe:**

149. Pełna historia z filtrami

150. Szczegóły operacji (drawer/modal)

151. Logi finansowe i statusy

152. Wspólne komponenty z slide panelami (PaymentHistory,
     PaymentSummary, PaymentActions)

**C4. Rozszerzenia finansowe (przyszłość):**

-   PaymentSchedule / raty / overdue (projekcja + cron + powiadomienia)

-   Online payments: Przelewy24 + webhook pipeline + idempotency

-   Dokumenty/faktury (wtedy deleteMany+create przestaje być OK ---
    pojawią się FK)

-   Zaawansowane korekty (reversals, chargebacks)

FAZA D: Użytkownicy + Ustawienia globalne

**D0 (wydzielone): Role + RBAC + CRUD użytkowników + Ustawienia ---
ZREALIZOWANA ✅ 30.03.2026**

**Realizacja D0 --- szczegóły implementacyjne:**

Backend: UserRole enum (OWNER/MANAGER/RECEPTION). require-auth.ts:
getAuthContext() + hasPermission() + hasMinRole(). Realne RBAC w
payment-service.ts (RECEPTION: create_pending; MANAGER:
+confirm/reject/refund/adjustment; OWNER: +force). Payment routes
wstrzykują createdByUserId/confirmedByUserId/rejectedByUserId z sesji.
ADJUSTMENT wymaga direction + note (backend walidacja). Users API: GET
list, POST create (temp password jednorazowy), PATCH edit, POST
deactivate (nie siebie, natychmiastowa utrata dostępu), POST
reset-password. Settings API: GET/PATCH z walidacją Zod-like
(paymentMethodsConfig schema, pusta lista zablokowana, min 1 aktywna dla
admina). Audit log:
USER_CREATED/UPDATED/DEACTIVATED/ACTIVATED/PASSWORD_RESET,
SETTINGS_UPDATED.

Avatar upload: POST /api/users/\[id\]/avatar (JPG/PNG/WebP, max 5MB,
OWNER only). Storage abstraction: src/lib/avatar-storage.ts ---
interfejs AvatarStorageProvider (save/delete/getStream),
LocalDiskStorage w data/avatars/{userId}/{randomId}.ext. Klucz
generowany serwerowo (12-znakowy losowy ID) --- klient nie wpływa na
nazwę. GET /api/avatars/\[\...key\] --- streaming z createReadStream +
Readable.toWeb(), Cache-Control: immutable (klucz zmienia się przy
każdym uploadzie). Walidacja key: regex + brak path traversal. Gotowe na
migrację S3/R2 (podmiana providera bez zmiany endpointów).

Nawigacja: Zarządzanie → Ustawienia (rozwijane, hash routing z pushState
interception jak pricing) → /admin/config#reservations, #payments,
#object. Pozostałe → Użytkownicy → /admin/users. Pozostałe →
Ustawienia globalne (rozwijane, 4 pozycje) →
/admin/global-settings/appearance (Wygląd widżetu),
/admin/global-settings/email (Powiadomienia e-mail),
/admin/global-settings/email-templates (Szablony e-mail),
/admin/global-settings/email-logs (Logi e-mail).
Na dole sidebara (separator): Design System → /admin/design-system.
/admin/settings zarezerwowane na przyszłość (profil).

Frontend config: SectionCard wzorzec z client-details-page (bubble + h-8
w-8 rounded-xl bg-primary/10 ikona + text-\[14px\] font-semibold +
chevron + opis pod tytułem). Tab Rezerwacje: BubbleSelect godziny
(00:00--23:00) + terminy w grid max-w-\[400px\]. Tab Płatności: metody w
rzędach z 3 toggleami (Aktywna/Admin/Potw.) + deposit w max-w-\[320px\].
Tab Obiekt: 2 SectionCards read-only + SlidePanel edycji.

Frontend users: karty w gridzie (sm:grid-cols-2 xl:grid-cols-3) z
bubble-interactive. Avatar h-12 w-12 rounded-2xl (zdjęcie lub inicjały).
Hover actions (Edytuj + Dezaktywuj). ConfirmDialog przy dezaktywacji.
SlidePanel edycji z avatar uploadem (hover overlay Camera + instant
preview). Reset hasła w SlidePanel z ConfirmDialog inline. Kopiowanie
hasła: HTTP fallback (document.execCommand). bubble-interactive:hover:
tylko border-color, bez translateY (globalna zmiana).

**Priorytet: ŚREDNI**

153. CRUD użytkowników (menu Pozostałe → Użytkownicy, URL: /admin/users)
     --- ZREALIZOWANE D0

154. System uprawnień per moduł (3 poziomy: pełny / odczyt / brak) ---
     CZĘŚCIOWO D0 (RBAC płatności wdrożone, per-moduł w przyszłości)

155. Generowanie haseł + wymuszenie zmiany przy pierwszym logowaniu ---
     ZREALIZOWANE D0 (temp password + mustChangePassword)

156. Ustawienia globalne rezerwacji (czas na wpłatę, procent, raty,
     deadline) --- ZREALIZOWANE D0 (/admin/config#reservations +
     /api/settings)

157. Pole „Odpowiedzialny za rezerwację" w formularzu (dropdown userów)
     --- ODŁOŻONE (przyszłość)

158. Godziny operacyjne (check-in / check-out) --- ZREALIZOWANE D0
     (global) + D 159-162 (per kategoria) ✅ 01.04.2026

**Godziny operacyjne --- model docelowy:**

Zasada: Reservation trzyma ramę biznesową (daty). Operacyjne source of
truth dla blokowania to ReservationItem.startAt/endAt i
TimelineEntry.startAt/endAt.

159. GlobalSettings.checkInTime (default: 15:00) + checkOutTime
     (default: 11:00) --- centralna definicja --- ZREALIZOWANE D0 ✅

160. ResourceCategory.checkInTimeOverride / checkOutTimeOverride
     (nullable) --- opcjonalny override per kategoria --- ZREALIZOWANE
     ✅ 01.04.2026

161. Przy tworzeniu ACCOMMODATION items: startAt = data + checkInTime
     (np. 2026-04-01T15:00), endAt = data + checkOutTime (np.
     2026-04-05T11:00) --- ZREALIZOWANE ✅ (POST + PATCH, DST-safe via
     date-fns-tz)

162. TimelineEntry kopiuje timestampy z ReservationItem --- source of
     truth dla availability --- ZREALIZOWANE ✅

**Realizacja D 159-162 --- szczegóły implementacyjne (01.04.2026):**
Nowy plik src/lib/operational-times.ts: resolveOperationalTimes(tx,
categoryId) --- pobiera override z ResourceCategory, fallback do
CompanySettings. combineDateAndTime(dateStr, timeStr) --- DST-safe
konwersja Warsaw local → UTC via date-fns-tz (fromZonedTime).
isValidTimeFormat() --- walidacja HH:MM. Zależności: date-fns +
date-fns-tz. POST /api/reservations: resolve times per category wewnątrz
transakcji, cache per categoryId, ACCOMMODATION = date + resolved time,
TIME_SLOT/QUANTITY_TIME bez zmian. PATCH /api/reservations/\[id\]:
analogicznie + update existing ReservationItem dates przy zmianie dat.
Nowy endpoint PATCH /api/resource-categories/\[id\] --- override z
walidacją, OWNER only. UI: /admin/config#reservations nowa SectionCard
„Godziny per kategoria\" --- lista ACCOMMODATION kategorii z
BubbleSelect, opcja „Globalne (HH:MM)\" = null. Migracja:
scripts/d-hours-migration.sql --- ONLY ACCOMMODATION + midnight pattern,
DST-safe AT TIME ZONE \'Europe/Warsaw\'. Wynik: 8 items zmigrowanych, 0
midnight remaining.

163. Reservation.checkInTime / checkOutTime = snapshot ustawień z
     momentu tworzenia (wyświetleniowe, nie operacyjne)

164. Availability check: overlap na timestampach (checkout 11:00,
     następny checkin 15:00 = brak konfliktu)

165. Zmiana GlobalSettings dotyczy NOWYCH rezerwacji --- brak retroakcji
     na istniejące

166. Różne typy zasobów = różne godziny: nocleg (15:00-11:00), sala
     (08:00-22:00), sprzęt (10:00-18:00)

FAZA E: Frontend klienta (Widget) --- podzielona na E1/E2/E3/E4

**Priorytet: WYSOKI. Status: E1 ZREALIZOWANA ✅ 02.04.2026**

Podział Fazy E na etapy: E1 = backend (availability + pricing + quote
API), E2 = frontend widget (publiczna strona pod /booking), E3 =
email minimum (potwierdzenie + reminder), E4 = Przelewy24 (online
payments).

167. Moduł rezerwacyjny osadzany w dowolnym froncie

168. Widok cennika + dostępności

169. Składanie rezerwacji (instant block + PENDING)

170. Płatności online (Przelewy24)

171. Strona rezerwacji klienta (/offer/:token)

172. Konto klienta (opcjonalne --- wszystkie rezerwacje w jednym
     miejscu)

173. Powiadomienia email + SMS

**═══ E1: Availability + Quote API --- ZREALIZOWANA ✅ 02.04.2026 ═══**

**Czym jest E1:** Backend do publicznego sprawdzania dostępności zasobów
i wyceny rezerwacji. Trzy endpointy API, które zasili przyszły widget
rezerwacyjny (E2). Nie wymaga logowania --- jest publiczny, ale
chroniony rate limiterem. Klient (lub widget) pyta: „co jest wolne?\" →
„ile to kosztuje?\" → „daj mi formalną wycenę z numerem\". System
odpowiada danymi z cenników, sezonów i planów cenowych.

**Trzy publiczne endpointy:**

1\) GET /api/public/availability --- „Co jest wolne?\" Przyjmuje daty
(checkIn, checkOut) i opcjonalne filtry (typ kategorii, pojemność).
Zwraca listę wszystkich zasobów z informacją czy są dostępne, ile mają
wariantów i jaką pojemność. NIE zwraca cen --- to celowe rozdzielenie
(wydajność). Plik: src/app/api/public/availability/route.ts. Rate limit:
60 req/min per IP.

2\) POST /api/public/quote-preview --- „Ile orientacyjnie kosztuje?\"
Przyjmuje listę wariantów (max 50) i daty. Zwraca minimalną cenę za noc
per wariant (fromPriceMinor). Używane w UI widgetu do wyświetlania „od X
zł/noc\" na liście wyników. Plik:
src/app/api/public/quote-preview/route.ts. Rate limit: 30 req/min per
IP.

3\) POST /api/public/quote --- „Daj formalną wycenę.\" Przyjmuje pełne
dane: warianty z liczbą osób, dodatki, kod rabatowy. Zwraca: rozbicie
ceny na każdą noc z nazwą sezonu, sumę, zaliczkę (% z ustawień),
politykę anulacji. Tworzy rekord Quote w bazie danych z unikalnym ID
(quoteId) i sekretem (quoteSecret) --- oba potrzebne do późniejszego
złożenia rezerwacji. Quote wygasa po 30 minutach. Plik:
src/app/api/public/quote/route.ts. Rate limit: 10 req/min per IP.

**Silnik wyceny (pricing engine):**

Plik: src/lib/pricing-engine.ts. Jedno źródło prawdy cen: tabela
PriceEntry (cena per wariant × plan cenowy × data). Dla każdej nocy
rezerwacji silnik szuka ceny w następującej kolejności (fallback
chain): 1) PriceEntry z konkretną datą, 2) PriceEntry bez daty (cena
domyślna), 3) basePriceMinor z wariantu, 4) brak ceny → błąd dla
ACCOMMODATION/TIME_SLOT, warning dla QUANTITY_TIME. Sezon służy TYLKO do
labelowania („Wysoki sezon\") i do generowania wpisów cennikowych ---
NIE steruje ceną w runtime. Plan cenowy (RatePlan) może dziedziczyć z
innego planu (parent → child z modyfikatorem PERCENTAGE w bps lub FIXED
w groszach). Maks głębokość dziedziczenia: 3. Wykrywanie cykli.
Wszystkie kwoty w groszach (Int), zero operacji na ułamkach. Procenty w
bps (basis points, np. -1000 = -10%). Wynik nigdy nie spada poniżej 0.

**Model Quote w bazie danych:**

Tabela: quotes. Pola: id (cuid, klucz główny), secret (32-znakowy hex
--- anti-enumeration, potrzebny razem z id do użycia quote), payload
(JSON --- dane wejściowe wyceny), payloadHash (SHA-256 z canonical JSON
--- weryfikacja integralności), result (JSON --- pełny wynik wyceny,
dokładnie to co widzi klient, snapshot), totalMinor (Int ---
zdenormalizowana suma w groszach), expiresAt (DateTime --- wygaśnięcie,
domyślnie 30 min), usedAt (DateTime nullable --- null = nieużyty,
ustawiane przy tworzeniu rezerwacji), reservationId (String nullable ---
FK do rezerwacji utworzonej z tego quote). Single-use: quote może być
użyty tylko raz. Przy tworzeniu rezerwacji (przyszły E2) backend
weryfikuje: quoteId + secret + payloadHash + expiresAt. Cleanup:
scripts/e1-cleanup-quotes.sql --- cron codziennie o 3:00, kasuje quotes
starsze niż 30 dni po wygaśnięciu.

**Kod rabatowy (PromoCode) w quote:**

Walidacja w quote jest READ-ONLY --- sprawdza aktywność, daty ważności,
maxUses, minBookingValue, ale NIE inkrementuje usedCount. Konsumpcja
(usedCount++) nastąpi dopiero w E2 (book endpoint), wewnątrz transakcji
z tworzeniem rezerwacji. Quotes mogą być porzucone --- nie wolno
„zużywać\" kodu na etapie wyceny.

**Rate limiter (ochrona przed nadużyciami):**

Plik: src/lib/rate-limiter.ts. In-memory (w pamięci procesu Node.js),
per IP, sliding window. Trzy instancje: availability 60/min,
quote-preview 30/min, quote 10/min. Zwraca HTTP 429 z nagłówkami
Retry-After i X-RateLimit. Resetuje się przy restarcie PM2. Docelowo do
wymiany na Redis (bez zmiany API). Automatyczny cleanup stale IP co 5
minut.

**Walidacje i reguły bezpieczeństwa:**

Maks 60 nocy (dłuższe zakresy odrzucane). Maks 50 wariantów w
quote-preview, 10 w quote. Data wyjazdu musi być po dacie przyjazdu.
Brak ceny dla ACCOMMODATION/TIME_SLOT = error (nie 0 zł) --- quote nie
jest tworzony w DB gdy są errory. QUANTITY_TIME: brak ceny = warning
(dopuszczalne). Quote nie zwraca danych osobowych (PII) --- tylko ceny,
warianty, daty. Anti-enumeration: quoteId + secret wymagane razem.

**Migracja: domyślne warianty zasobów:**

Skrypt: scripts/e1-default-variants.sql (idempotent, ON CONFLICT DO
NOTHING). Pricing engine wymaga wariantów (ResourceVariant) ---
PriceEntry jest per wariant. Zasoby bez wariantów dostały domyślny
wariant z: name = nazwa zasobu, capacity z resource.maxCapacity,
basePriceMinor = 0, isDefault = true. Wynik: 17 wariantów (domki
capacity=7, pokoje 2--4, sala 50, restauracja 80, kajak 4).

**Pliki E1:**

src/lib/pricing-engine.ts (NOWY --- calculateQuote, getMinPrices,
hashPayload, canonicalJson, getNightDates). src/lib/rate-limiter.ts
(NOWY --- createRateLimiter, 3 instancje).
src/app/api/public/availability/route.ts (NOWY --- GET).
src/app/api/public/quote-preview/route.ts (NOWY --- POST batch).
src/app/api/public/quote/route.ts (NOWY --- POST full).
scripts/e1-cleanup-quotes.sql (NOWY --- cron).
scripts/e1-default-variants.sql (NOWY --- migracja wariantów).
prisma/schema.prisma (ZMIENIONY --- model Quote + relacja
Reservation.quotes). Zależność: date-fns + date-fns-tz (dodane w D
159-162, używane przez availability via operational-times.ts).

**Testy E1 (12/12 przeszło):**

T1: 17 zasobów dostępnych. T2: maks 60 nocy → error. T3: złe daty →
error. T4b: quote-preview → 250.00 zł/noc z price_entry. T5b: full quote
→ 1250.00 zł (5 × 250), deposit 375.00 zł (30%), sezon „Wysoki sezon\",
errors=\[\], source=price_entry. T5: brak cennika → error „Uzupełnij
cennik\" + quoteId=none (nie zapisano do DB). T6: złe daty w quote →
error. T7: nieistniejący wariant → error. T8: fałszywy kod rabatowy →
discount=None. T9: quote w DB z secret i expiresAt. T10: rate limit
burst → HTTP 429 po 6 requestach (limit 10/min, zapas na retry).

**Decyzje architektoniczne E1 (ważne na przyszłość):**

PriceEntry per-day = source of truth. Season = label + generator, NIE
selektor ceny. RatePlan inheritance: max depth 3, cycle detection,
PERCENTAGE w bps (10000 = 100%), FIXED w groszach, wynik min 0.
PromoCode: walidacja w quote (read-only), konsumpcja (usedCount++)
dopiero w book (E2). Quote: single-use, payloadHash SHA-256,
anti-enumeration (id + secret), DB storage (nie Redis), cleanup cron.
Rate limiter: in-memory per process, do wymiany na Redis. Availability
bez cen (osobny endpoint). Prisma migrate deploy na produkcji (od S3; wcześniej db push).

**S2b: Drop legacy Payment columns --- ZREALIZOWANE ✅ 01.04.2026**

Usunięte z DB: kolumny type, status, transactionId, paidAt z tabeli
payments. Usunięte enumy: PaymentType, PaymentConfirmStatus. Usunięty
kod: legacy sync w POST /api/reservations/\[id\]/payments (4 linie) i
POST /api/payments/\[id\]/confirm (1 linia). Skrypt:
scripts/s2b-drop-legacy.sql. Backup przed migracją. Zero długu
technicznego w płatnościach --- kolumna amount (Decimal, LEGACY z C1a)
pozostaje jako read-only backup.

**Co dalej: E3 (Email), E4 (Przelewy24), E2b (Konto klienta)**

E3: Email minimum (potwierdzenie rezerwacji + link /reservation/[token]
+ reminder wpłaty, callback pattern). E4: Przelewy24 (online payments +
webhook pipeline). E2b: Konto klienta (ClientAccount: rejestracja,
logowanie, lista rezerwacji).

**═══ E2: Widget rezerwacyjny --- ZREALIZOWANA ✅ 03.04.2026 ═══**

**Czym jest E2:** Publiczny booking engine pod /booking --- osobna strona
(nie iframe, nie modal) w route group (engine). Klient wchodzi z
przycisku „Rezerwuj online" na stronie WordPress (link do
https://dev.zielonewzgorza.eu/booking). 5-krokowy flow: wybór dat →
lista wyników → wycena → dane klienta → potwierdzenie. Rezerwacja
natychmiast blokuje termin na timeline (PENDING, source=FRONT).
Inspiracja: Profitroom. Mobile-first (80%+ klientów na telefonie).

**Scope E2:** Tylko noclegi (ACCOMMODATION). Bez logowania klienta. Bez
sali, kajaków, restauracji. Bez PER_ITEM addonów. Tylko GLOBAL addons.

**Decyzje architektoniczne E2 (recenzja ChatGPT):**

- iframe = fallback, nie default. /booking jako samodzielna strona.
  WordPress dostaje link, zero iframe.
- POST /api/public/book NIE przyjmuje promoCode z inputu. Rabat
  pochodzi WYŁĄCZNIE z Quote.payload/result. Klient nie może
  manipulować ceną.
- Client match tylko po email (nie phone). Telefon = dane pomocnicze.
  Jeśli email istnieje → podpinamy klienta. Jeśli nie → tworzymy
  nowego.
- resources-catalog zwraca TYLKO: status=ACTIVE AND visibleInWidget=true
  AND category.type=ACCOMMODATION. Trojna blokada.
- Idempotency guard per quoteId. Jeśli quote.usedAt != null → HTTP 200
  z istniejącą rezerwacją (nie error, nie duplikat).
- E2 addons = tylko GLOBAL. PER_ITEM odłożone.
- Routing: /booking = widget, /offer/[token] = oferta klienta (istniejące),
  /reservation/[token] = strona rezerwacji klienta (nowe, read-only).
- Consent RODO zapisywany w BookingDetails (timestamp, wersja regulaminu,
  IP, userAgent).

**Nowe endpointy API (E2):**

POST /api/public/book --- Tworzenie rezerwacji z Quote. 13-krokowa
transakcja z SELECT ... FOR UPDATE lock na Quote: (1) Lock Quote +
walidacja (secret, payloadHash diagnostic, expiresAt), (2) Idempotency:
usedAt != null → zwróć istniejącą rezerwację HTTP 200, (3) Check
availability per item (exclusion constraint + FOR UPDATE), (4) Znajdź
lub utwórz Client (match po email), (5) Create Reservation (BOOKING,
PENDING, source=FRONT), (6) Create ReservationItem[] z quote.payload,
(7) Create TimelineEntry per item (instant block), (8) Create
BookingDetails (token + consent), (9) Create ReservationAddon[] (GLOBAL
z quote.result), (10) Totals + deposit snapshot, (11) Consume PromoCode
(usedCount++), (12) Mark Quote used (usedAt + reservationId), (13)
StatusLog. Rate limit: 5 req/min per IP. Błędy: 409 CONFLICT (termin
zajęty), 400 QUOTE_EXPIRED/QUOTE_INVALID/QUOTE_TAMPERED, 422 VALIDATION.

GET /api/public/resources-catalog --- Katalog zasobów do wyświetlenia w
widgecie. Trojna blokada: status=ACTIVE AND visibleInWidget=true AND
category.type=ACCOMMODATION AND min 1 aktywny wariant. Include: nazwa,
opis, zdjęcia, pojemność, warianty, amenities. Rate limit: 60 req/min.

GET /api/public/reservation/[token] --- Publiczna strona rezerwacji po
tokenie (read-only). Zwraca: numer, status, daty, zasoby, kwoty, dane
do przelewu. NIE zwraca: clientId, email, phone, internalNotes,
assignedUserId, promoCodeId, wewnętrzne ID. Token: 64-char hex z
BookingDetails.token (generateSecureToken).

**Schema zmienione (E2):**

Resource: dodane pole visibleInWidget Boolean @default(false). Admin
włącza per zasób w panelu (toggle „Widoczny w widgecie rezerwacyjnym").

BookingDetails: dodane 4 pola consent RODO --- consentAcceptedAt
(DateTime), consentTermsVersion (String, np. „v1.0-2026-04"),
consentIpAddress (String), consentUserAgent (String). Brak nowego
modelu --- zgody w istniejącym BookingDetails.

**Frontend (E2) --- 5-krokowy flow pod /booking:**

Krok 1 (StepDates): Jeden BubbleRangePicker (range calendar) ---
zaznaczasz przyjazd, potem wyjazd, zakres podświetlony. Licznik
gości (dorośli, dzieci). Walidacja: min 1 noc, max 60.
Przycisk: „Szukaj dostępnych". API: GET /api/public/availability.

Krok 2 (StepResults): Karty zasobów z resources-catalog. Progressive
loading: najpierw availability (dostępne/niedostępne), potem ceny z
quote-preview (skeleton na cenach). Cena „od X zł/noc". Klient zaznacza
zasób(y). Przycisk: „Dalej --- wycena".

Krok 3 (StepQuote): API: POST /api/public/quote. Rozbicie per noc z
sezonem, subtotal, rabat, total, deposit (30%). Input kod rabatowy
(walidacja → nowy quote). Timer 30 minut (odliczanie). Możliwość
cofnięcia. Przycisk: „Dalej --- dane kontaktowe".

Krok 4 (StepClient): Formularz: imię*, nazwisko*, email*, telefon*.
Sekcja „Dane do faktury" (opcjonalna, collapsible): firma, NIP, adres,
kod, miasto. Uwagi do rezerwacji. Toggle zgody RODO (wymagany).
Podsumowanie: łączna kwota + zaliczka. Przycisk: „Rezerwuję". API:
POST /api/public/book.

Krok 5 (StepConfirmation): Numer rezerwacji, status „Oczekuje na
wpłatę", szczegóły pobytu, dane do przelewu z przyciskami kopiowania
(odbiorca, nr konta, tytuł, kwota). Link do /reservation/[token].

Strona /reservation/[token]: Publiczna, read-only. Nagłówek z logo.
Numer + status. Termin + goście + zakwaterowanie + dodatki. Rozliczenia
(kwota, wpłacono, pozostało). Dane do przelewu (jeśli PENDING). Kontakt
(telefon, email). NIE jest to panel klienta --- to strona jednej
rezerwacji po tokenie.

**Pliki E2 (12 nowych, 5 zmienionych):**

NOWE: src/app/api/public/book/route.ts (POST book, 530 linii),
src/app/api/public/resources-catalog/route.ts (GET catalog),
src/app/api/public/reservation/[token]/route.ts (GET reservation),
src/app/(engine)/booking/layout.tsx (layout widgetu),
src/app/(engine)/booking/page.tsx (strona widgetu),
src/app/(engine)/reservation/[token]/page.tsx (strona rezerwacji),
src/components/booking/BookingWidget.tsx (state machine + stepper),
src/components/booking/StepDates.tsx (krok 1),
src/components/booking/StepResults.tsx (krok 2),
src/components/booking/StepQuote.tsx (krok 3),
src/components/booking/StepClient.tsx (krok 4),
src/components/booking/StepConfirmation.tsx (krok 5).

ZMIENIONE: prisma/schema.prisma (visibleInWidget + consent fields),
src/lib/rate-limiter.ts (bookLimiter 5/min, catalogLimiter 60/min,
hotfix race condition w cleanup), src/middleware.ts (/booking +
/reservation/ jako public routes), src/app/api/resources/[id]/route.ts
(visibleInWidget w PUT), src/components/resources/resources-list.tsx
(toggle „Widoczny w widgecie").

**Testy E2 (6/6 przeszło, recenzja ChatGPT zaakceptowana 03.04.2026):**

T1: Happy path --- quote → book → ZW-2026-0008 PENDING + timeline block.
T2: Book z quoteId+secret → rezerwacja na timeline. T3: Ponowny book
tym samym quote (idempotency) → HTTP 200, ta sama rezerwacja, idempotent:
true. T4: Book wygasłym quote → QUOTE_EXPIRED. T5: Book z błędnym
secret → QUOTE_INVALID. T6: Availability po book → Pokój Płatnerza
available: false (instant block działa).

**Bug znaleziony i naprawiony w E2:**

Rate limiter race condition: cleanup co 5 min usuwał puste mapy IP z
ipMap. Następny request próbował .get() na undefined → crash „Cannot
read properties of undefined (reading 'get')". Naprawione: auto-
recreate mapy przy braku. Hotfix: e2-hotfix-ratelimiter.tar.gz.

**Bezpieczeństwo E2 (potwierdzone):**

- Book wymaga quoteId + quoteSecret (oba obowiązkowe)
- FOR UPDATE lock na Quote --- race condition proof
- payloadHash weryfikowany (diagnostic --- book nie przyjmuje payloadu
  cenowego z frontu, więc hash chroni przed uszkodzeniem DB)
- expiresAt sprawdzany (30 min window)
- usedAt + reservationId ustawiane w tej samej transakcji (single-use)
- Zero kwot z frontu --- totals wyłącznie z quote.result
- PromoCode wyłącznie z quote.payload (nie z request body)
- Client match po email only (nie phone)
- /reservation/[token] --- zero PII ponad minimum
- Token: 64-char hex (generateSecureToken, cryptographically secure)
- Rate limit: book 5/min, catalog 60/min per IP
- XSS: sanityzacja guestNotes (strip HTML tags, max 2000 chars)
- Exclusion constraint + 23P01 catch = zero overbooking

**Kontrakty E2 — request/response (dev reference):**

POST /api/public/book --- Request body:
{ quoteId: string, quoteSecret: string, client: { firstName: string,
lastName: string, email: string, phone: string, companyName?: string,
nip?: string, address?: string, city?: string, postalCode?: string },
guestNotes?: string, consentAccepted: true }
NIE zawiera: dat, wariantów, kwot, promoCode, addonów. Cena pochodzi
w 100% z Quote w DB.

POST /api/public/book --- Response (success):
{ success: true, data: { idempotent: false, reservationNumber:
"ZW-2026-XXXX", token: "64-char-hex", totalMinor: 50000, depositMinor:
15000, status: "PENDING" } }

POST /api/public/book --- Response (idempotent, quote already used):
{ success: true, data: { idempotent: true, reservationNumber:
"ZW-2026-XXXX", token: "64-char-hex", totalMinor: 50000, depositMinor:
15000, status: "PENDING" } }
HTTP 200, identyczny format --- klient nie widzi różnicy.

POST /api/public/book --- Kody błędów:
- 400 QUOTE_NOT_FOUND --- quoteId nie istnieje w DB
- 400 QUOTE_INVALID --- quoteSecret nie pasuje
- 400 QUOTE_EXPIRED --- expiresAt < now (wycena wygasła)
- 400 QUOTE_TAMPERED --- payloadHash się nie zgadza (diagnostic, DB
  corruption)
- 409 CONFLICT --- zasób zajęty (exclusion constraint lub
  checkAvailability)
- 422 VALIDATION --- brakujące/nieprawidłowe pola (email, telefon,
  consent)
- 429 RATE_LIMITED --- przekroczono 5 req/min

GET /api/public/resources-catalog --- Response:
{ success: true, data: { resources: [{ id, name, slug, unitNumber,
shortDescription, maxCapacity, areaSqm, bedroomCount, bathroomCount,
categoryId, category: { id, name, slug, type },
variants: [{ id, name, capacity, isDefault, unitNumber }],
images: [{ id, alt, position, isCover, urls: { original, medium,
thumbnail } }], beds: [{ bedType, quantity, label }],
amenities: [{ id, name, icon }] }], count: number } }
Tylko: status=ACTIVE AND visibleInWidget=true AND category.type=
ACCOMMODATION AND min 1 aktywny wariant.
Katalog NIE zwraca longDescription — to pole jest tylko w detail
endpoint (GET /api/public/resources/[id]).

GET /api/public/reservation/[token] --- Response:
{ success: true, data: { reservation: { number, status, paymentStatus,
checkIn, checkOut, nights, adults, children, totalMinor, subtotalMinor,
discountMinor, requiredDepositMinor, guestNotes, currency, items: [{
adults, children, totalPriceMinor, resource: { name } }], addons: [{
snapshotName, quantity, totalMinor }], bookingDetails: {
paidAmountMinor, balanceDueMinor, overpaidAmountMinor } } } }
NIE zwraca: clientId, email, phone, internalNotes, assignedUserId,
promoCodeId, cancelledBy, wewnętrzne ID, historii płatności, consent
fields. Token: 64-char hex --- jedyny sposób dostępu.

GET /api/public/reservation/[token] --- Kody błędów:
- 404 NOT_FOUND --- token nie istnieje lub za krótki (<32 znaków)

**E2 Schema changes (pola dodane w E2):**

Model Resource --- nowe pole:
visibleInWidget Boolean @default(false) --- admin włącza per zasób
w panelu (toggle „Widoczny w widgecie rezerwacyjnym"). Endpoint
resources-catalog filtruje po tym polu.

Model BookingDetails --- nowe pola (consent RODO):
consentAcceptedAt DateTime? --- timestamp akceptacji regulaminu
consentTermsVersion String? --- wersja regulaminu (np. „v1.0-2026-04")
consentIpAddress String? --- IP klienta z request headers
consentUserAgent String? --- przeglądarka klienta (max 500 znaków)
Zapisywane automatycznie przy POST /api/public/book. Nie wymagają
osobnego modelu --- 4 pola na istniejącym BookingDetails.

**E2 Rate Limitery (osobne instancje):**

bookLimiter: 5 req/min per IP (najcięższa operacja --- transakcja DB)
catalogLimiter: 60 req/min per IP (read-only, cacheable)
Istniejące z E1: availabilityLimiter 60/min, quotePreviewLimiter
30/min, quoteLimiter 10/min.

**E2 Deploy checklist (krok po kroku):**

1. Backup: tar czf /root/backup-pre-e2.tar.gz src/ prisma/schema.prisma
2. Backup DB: pg_dump -Fc -U zwadmin -h localhost zielone_wzgorza_admin
   > /root/backup-pre-e2.dump
3. Upload tar.gz przez FileZilla do /var/www/admin/
4. tar xzf paczka.tar.gz
5. npx prisma@5.22.0 migrate deploy (schemat: visibleInWidget + consent fields)
6. ./node_modules/.bin/next build
7. pm2 restart zw-admin
8. rm paczka.tar.gz
9. Włącz visibleInWidget na zasobach w panelu admina
10. Test: curl http://localhost:3000/api/public/resources-catalog
11. Test: otwórz /booking w przeglądarce

**E2 Test checklist (6 must-pass po deploy):**

T1: POST /api/public/quote → quoteId + secret (E1, wymagane przez book)
T2: POST /api/public/book z quoteId+secret → reservationNumber +
PENDING + blok na timeline
T3: Ponowny book tym samym quote → HTTP 200, idempotent: true, ta sama
rezerwacja (NIE error, NIE duplikat)
T4: Book z wygasłym quote → 400 QUOTE_EXPIRED
T5: Book z błędnym secret → 400 QUOTE_INVALID
T6: GET /api/public/availability po book → zasób available: false

GOTCHA: Testowanie expiresAt przez psql wymaga uwzględnienia timezone
(patrz sekcja 28.5). Używaj interval '5 hours' lub NOW() AT TIME ZONE
'UTC'.

**═══ E2-UI: System wyglądu widgetu --- ZREALIZOWANA ✅ 04.04.2026 ═══**

**Czym jest:** System pozwalający administratorowi sterować wyglądem
publicznych stron (/booking, /reservation/[token]) z poziomu panelu
admina (Ustawienia → Wygląd). Obejmuje: upload logo (SVG/PNG/WebP),
10 tokenów kolorystycznych (CSS variables), wybór fontu (Google Fonts),
presety rozmiaru logo. Zmiany widoczne natychmiast po odświeżeniu
strony publicznej --- zero cache.

**Model danych:** WidgetConfig (singleton, tabela widget_config,
id="default"). Upsert przy pierwszym odczycie.

Pola kolorów (hex #RRGGBB, walidacja na endpoincie):
- primaryColor (#2563EB) --- przyciski, linki, stepper, ring
- primaryForeground (#FFFFFF) --- tekst na przyciskach
- backgroundColor (#F8FAFC) --- tło strony → CSS --background
- foregroundColor (#1E293B) --- nagłówki, tekst → CSS --foreground
- cardColor (#FFFFFF) --- tło kart/sekcji → CSS --card
- mutedColor (#64748B) --- tekst pomocniczy → CSS --muted-foreground
- borderColor (#E2E8F0) --- ramki → CSS --border, --input
- successColor (#16A34A) --- potwierdzenia, checkmarki
- warningColor (#D97706) --- oczekujące, ostrzeżenia
- dangerColor (#DC2626) --- błędy, wymagane pola

Zasada: tokeny (CSS variables), nie "kolor każdego elementu". Skalowalnie
--- dodanie nowego elementu UI nie wymaga nowego tokenu.

Pozostałe pola:
- logoUrl (String?) --- /api/public/widget-logo/logo-{hex}.{ext}
- logoHeight (Int, default 40) --- px, zakres 24-80
- fontFamily (String, default "Plus Jakarta Sans") --- Google Fonts name
- showPrices (Boolean, default true)
- showAvailability (Boolean, default true)
- termsUrl, privacyUrl (String?) --- linki do regulaminu/polityki

Konwersja hex → HSL (hexToHSL w BookingWidget) bo Tailwind CSS
variables używają formatu "H S% L%" bez hsl() wrapper.

**Endpointy API:**

GET /api/settings/widget --- admin read config (auth OWNER+)
PATCH /api/settings/widget --- admin update config (JSON, walidacja hex)
POST /api/settings/widget --- logo upload (FormData) lub delete
(action=delete). Dozwolone: SVG/PNG/WebP/JPG, max 5 MB. Storage:
data/widget/logo-{randomHex16}.{ext}.

GET /api/public/widget-config --- public theme read. KRYTYCZNE:
export const dynamic = "force-dynamic" + Cache-Control: no-store.
Bez tego Next.js cache'uje GET i zmiany admina nie propagują się.

GET /api/public/widget-logo/[...path] --- logo streaming. Filename
regex-walidowany. Cache-Control: immutable (key zmienia się per upload).

**Admin UI (Ustawienia → Wygląd):**

Plik: src/components/config/appearance-config-tab.tsx. Trzy sekcje:

Logo: podgląd (120×80 dashed box) + „Wgraj logo" + „Usuń" + presety
S(28)/M(40)/L(56)/XL(72). Responsive: stackuje pionowo na mobile.
Fallback bez logo → tekst „Zielone Wzgórza".

Kolorystyka: 10 kwadratów (56×56, rounded-2xl). Klik → BubbleColorPicker
(bubble dropdown: 50 kuratorowanych kolorów + przycisk „Własny" z
natywnym pełnym pickerem + hex input). Pod kwadratem: „Zmień kolor" +
opis na co wpływa. Grid: 2/3/5 col responsive. Auto-save po wyborze.
Przycisk „Domyślne" → reset.

Czcionka: grid 12 fontów Google Fonts (Plus Jakarta Sans, Inter, DM
Sans, Outfit, Poppins, Montserrat, Lato, Open Sans, Nunito, Raleway,
Rubik, Source Sans 3). Klik → auto-save.

**Nowy komponent DS: BubbleColorPicker**

Plik: src/components/ui/bubble-color-picker.tsx. Ten sam wzorzec co
BubbleRangePicker i BubbleSelect (portal, pozycjonowanie, click outside → close,
animacja scaleIn). Trigger: kwadrat 56×56. Dropdown: siatka 50 kolorów
+ „Własny" (natywny picker) + hex input.

**Nowy komponent DS: BubbleRangePicker**

Plik: src/components/ui/bubble-range-picker.tsx. Kalendarz zakresowy
(range picker) --- jeden input, jeden kalendarz, zaznaczasz przyjazd
(checkIn) a potem wyjazd (checkOut). Zakres podświetlony bg-primary/10.
Portal dropdown (320px). Faza selekcji: pill „Przyjazd/Wyjazd"
wskazuje co teraz zaznaczasz. Hover preview zakresu przy wyborze
checkOut. Trigger wyświetla pełne daty (dzień tygodnia + data) + badge
z liczbą nocy. Polski locale (MONTHS_PL, DAYS_PL). Min date support.
Props: checkIn (string), checkOut (string), onChange(ci, co), min?.
Zastąpił dwa osobne BubbleDatePickery w StepDates.

**Frontend: dynamiczny theme na /booking**

Szerokość content area: max-w-4xl (896px), padding px-5 sm:px-8.
BookingWidget ładuje GET /api/public/widget-config na mount (no-store).
Konwersja hex → HSL (hexToHSL). CSS variables nakładane na
.engine-root div (NIE na document.documentElement). Font ładowany jako
dynamiczny <link> Google Fonts, nakładany na .engine-root.

Layout nawigacji (zero shadows, zero layout jump):
1. NAVBAR: logo (lewa) + „Zaloguj się" placeholder (prawa). Sticky.
   Height: Math.max(56, logoH + 24). Padding px-5 sm:px-8.
2. STEPPER: w content area (NIE sticky pod navbar). Z mb-8 oddechu
   do treści. Zero shadows na krokach.
3. BACK BUTTON: poniżej steppera. btn-secondary-bubble + „Wróć".
   Stała zarezerwowana wysokość (minHeight: 44px na krokach 2-4,
   0 na kroku 1 i 5). Zero layout jump.
4. CONTENT: kroki 1-5 poniżej.
5. FOOTER: copyright.

Krok 1: BubbleRangePicker (jeden kalendarz, zaznaczasz zakres
przyjazd→wyjazd, range podświetlony). Zastąpił dwa osobne
BubbleDatePickery.

Zero shadows na przyciskach CTA, kartach zasobów, sticky buttons.
Scroll: window.scrollTo({ top: 0, behavior: "smooth" }) na każdym
przejściu między krokami.

**Dark mode izolacja (Opcja B z recenzji ChatGPT):**

Problem: admin i engine dzielą <html>. Admin ma .dark na html →
wpływa na /booking.

Rozwiązanie: .engine-root wrapper w (engine)/layout.tsx z
bg-background text-foreground data-theme="light" colorScheme: light.
CSS w globals.css: .dark .engine-root { pełna re-deklaracja WSZYSTKICH
light mode variables }. ZERO klas Tailwind dark: w komponentach engine
(usunięte ze WSZYSTKICH plików: BookingSkeleton, StepConfirmation,
reservation page). BookingWidget nakłada theme na .engine-root, zero
manipulacji classList na html. Zero migotania, zero efektów ubocznych.

**Skeletony (BookingSkeleton.tsx):**

BookingPageSkeleton (pełna strona, initial load), ResultsSkeleton
(krok 2 karty), QuoteSkeleton (krok 3 wycena), PriceSkeleton (inline
cena). DS: shimmer only, zero fade-in/stagger.

**Pliki E2-UI (6 nowych, 12 zmodyfikowanych):**

NOWE: src/app/api/settings/widget/route.ts, src/app/api/public/
widget-config/route.ts, src/app/api/public/widget-logo/[...path]/
route.ts, src/components/config/appearance-config-tab.tsx,
src/components/ui/bubble-color-picker.tsx, src/components/ui/
bubble-range-picker.tsx, src/components/booking/BookingSkeleton.tsx.

ZMODYFIKOWANE: prisma/schema.prisma, src/styles/globals.css,
src/app/(engine)/layout.tsx, src/app/(engine)/booking/layout.tsx,
src/components/booking/BookingWidget.tsx, StepDates.tsx (BubbleRangePicker),
StepResults.tsx (skeletony), StepQuote.tsx (skeletony),
StepConfirmation.tsx (usunięte dark:), reservation/[token]/page.tsx
(usunięte dark:), config-content.tsx (tab Wygląd --- dodany w E2-UI,
przeniesiony do global-settings w E3a), sidebar.tsx (link).

**Bugi znalezione i naprawione w E2-UI:**

(1) Next.js cache GET widget-config → fix: force-dynamic.
(2) dark: klasy w engine → fix: usunięte + .engine-root CSS override.
(3) Font nie działał → fix: nakładany na .engine-root, nie html.
(4) Logo XL ucięte → fix: navHeight = logoH + 24, padding zwiększony.
(5) Layout kolorów overflow → fix: uproszczony do kwadrat + opis.
(6) Logo sekcja mobile overflow → fix: flex-col sm:flex-row.
(7) Syntax error duplikat → fix: usunięty duplikat.

**Testy UI (10 checklist po deploy):**

T1: dark mode admin → /booking jasny. T2: zmiana koloru → efekt po
odświeżeniu. T3: zmiana fontu → efekt. T4: upload logo → widoczne.
T5: XL → navbar rośnie. T6: usuń logo → fallback tekst. T7: mobile
admin → logo sekcja mieści się. T8: mobile /booking → zero layout jump.
T9: klik kwadrat → bubble dropdown. T10: „Domyślne" → reset.

**═══ E3a: System e-mail (core) --- ZREALIZOWANA ✅ 06.04.2026 ═══**

**Czym jest:** Warstwa wysyłki emaili transakcyjnych do klientów
rezerwujących przez /booking. Potwierdzenie rezerwacji, powiadomienie
o zmianie statusu (CONFIRMED/CANCELLED), email testowy. Best-effort
async delivery (fire-and-forget z retry, nie durable queue). SMTP
przez Nodemailer, credentials w .env, konfiguracja biznesowa w DB.

**Architektura:** Trzy warstwy:
- email-service.ts --- transport SMTP, send, retry 3x, fire-and-forget,
  guard na brak emaila, EmailLog audit trail
- email-renderer.ts --- bezpieczna interpolacja placeholderów.
  {{name}} = text escaped (HTML entities), {{name_html}} = trusted
  HTML z serwera. Nigdy eval, nigdy Handlebars.
- email-templates-default.ts --- 5 szablonów HTML (booking confirmation,
  payment reminder, status confirmed, status cancelled, test).
  Responsive, inline CSS, logo/kolory z WidgetConfig (fallback na
  domyślne). Footer z danymi kontaktowymi.

**Best-effort async delivery (NIE durable queue):**
- Request kończy się natychmiast (void, fire-and-forget)
- Retry max 3 próby, 5s delay, w tym samym procesie Node
- Po restarcie PM2 pending maile giną (akceptowalne na tym etapie)
- Jeden rekord EmailLog per logiczną wysyłkę (create PENDING → update
  SENT/FAILED, inkrementacja attempts). Nigdy nowy rekord per retry.
- Przyszłościowo: queue/provider abstraction (Bull/Redis) bez
  przebudowy API

**EMAIL_DRY_RUN** (flaga środowiskowa, nie DB/UI):
- true → loguje do konsoli + zapisuje EmailLog (status SENT,
  errorMessage "DRY_RUN"), NIE wysyła
- false → realny SMTP send
- Ten sam flow, ten sam renderer, ten sam log — jedyna różnica
  to provider execution

**Model danych:**

Nowe enumy: EmailLogType (BOOKING_CONFIRMATION, PAYMENT_REMINDER,
STATUS_CONFIRMED, STATUS_CANCELLED, TEST), EmailDeliveryStatus
(PENDING, SENT, FAILED).

Nowy model EmailLog: id, type (EmailLogType), status
(EmailDeliveryStatus), recipientEmail, recipientName, subject,
reservationId (FK → Reservation), templateType, triggerSource
(SYSTEM/ADMIN_TEST/CRON), attempts, sentAt, lastAttemptAt,
errorMessage, createdAt. Indeksy: [reservationId, type],
[status, createdAt]. Relacja: Reservation.emailLogs.

CompanySettings rozszerzone: senderEmail (String?), senderName
(String, default "Zielone Wzgórza"), replyToEmail (String?),
bankAccountName (String, default "Grupa Truszkowscy sp. z o.o."),
bankAccountIban (String, default "89 1090 1102 0000 0001 5948 7356"),
bankName (String, default "Santander Bank Polska"), reminderEnabled
(Boolean, default true), reminderDays (Int, default 3), maxReminders
(Int, default 2).

BookingDetails rozszerzone: paymentReminderCount (Int, default 0),
lastPaymentReminderAt (DateTime?) --- idempotencja reminderów (E3b).

**Endpointy API:**

GET /api/settings/email --- konfiguracja email + SMTP diagnostyka
per pole (host, port, secure, user, password z ok/value). Auth:
dowolny admin.

PATCH /api/settings/email --- aktualizacja sender/bank/reminder.
Auth: OWNER. Walidacja: email regex, reminderDays 1-30, maxReminders
1-10.

POST /api/settings/email/test --- wysyłka test email. Auth: OWNER.
Bierze toAddress z body lub email aktualnego usera. Log type TEST,
triggerSource ADMIN_TEST. Nie wymaga istnienia rezerwacji.

POST /api/settings/email/test-connection --- realny SMTP handshake
(EHLO + AUTH) przez nodemailer.verify(). Auth: OWNER. Nie wysyła
żadnego maila. Zwraca success/failure z polskim opisem błędu
(Błąd logowania, Nie znaleziono serwera, Przekroczono czas,
Problem z SSL).

**Integracja z istniejącymi endpointami:**

POST /api/public/book --- po transakcji (po STEP 12):
emailService.sendBookingConfirmation() fire-and-forget. Dane do
emaila przekazywane przez _email w transaction result (usuwane
z response przed wysłaniem do klienta). Tylko jeśli !idempotent.

POST /api/reservations/[id]/confirm --- po transakcji:
emailService.sendStatusChange(..., "CONFIRMED") fire-and-forget.
Guard: result.reservation.client?.email. Shared RESERVATION_INCLUDE
(as const) w obu branchach → jeden typ TypeScript, zero as any.

POST /api/reservations/[id]/cancel --- identyczny pattern jak
confirm. Shared RESERVATION_INCLUDE (as const).

**Middleware /api/internal/*:**
- Dodane przed ogólnym /api/ checkiem (bardziej specyficzny first)
- Sprawdza x-cron-secret z CRON_SECRET env vs nagłówek
- Groundwork pod E3b (reminder cron endpoint)
- Brak/niepoprawny secret → 401

**Nawigacja (stan po E3b):**

Sidebar sekcja Zarządzanie → Ustawienia → taby: Rezerwacje, Płatności,
Obiekt (/admin/config). Sidebar sekcja Pozostałe → Ustawienia globalne
→ dropdown 4 pozycje: „Wygląd widżetu" (/admin/global-settings/
appearance), „Powiadomienia e-mail" (/email), „Szablony e-mail"
(/email-templates), „Logi e-mail" (/email-logs). Ikony: Palette,
MailOpen, FileCode, ListChecks.

Sidebar osobna pozycja na dole (separator + link): „Design System"
→ /admin/design-system. Ikona Palette. Nie należy do żadnej grupy.

/admin/global-settings → redirect do /admin/global-settings/appearance.
GlobalSettingsLayout: nagłówek text-xl font-bold + 4 taby nawigacyjne.

**Admin UI — Powiadomienia e-mail:**

Panel diagnostyczny SMTP (zwijany): ikona z kolorowym tłem, 5 pól
ze statusem (host, port, szyfrowanie, login, hasło --- zielona/
czerwona kropka + wartość, hasło jako ••••••••), ostrzeżenie dry-run,
przycisk „Testuj połączenie" (realny SMTP handshake), wynik testu.

Nadawca (zwijany): nazwa nadawcy, adres email, adres do odpowiedzi.
Auto-save na blur.

Dane do przelewu (zwijany): odbiorca, IBAN (font mono), bank.
Auto-save na blur.

Przypomnienia o wpłacie (zwijany): toggle + dni + max. Widoczne
jeśli włączone.

E-mail testowy (zwijany): input adresu + „Wyślij test". Wynik
jako toast (nie inline).

**Collapsible SectionCard --- DS §25 (standard globalny):**

Zmiana globalna: WSZYSTKIE zwijane boxy w panelu admina używają
animacji CSS Grid (0fr → 1fr, 300ms easing). Klasy:
.section-collapse, .section-open, .section-collapse-inner.
Zawartość ZAWSZE w DOM (nigdy {open && ...}). Ikona w kółku +
tytuł + opis + chevron. Hover na nagłówku. Ten sam wzorzec we
WSZYSTKICH modułach, bez wyjątków.

Zmienione pliki: reservations-config-tab (3 sekcje),
payments-config-tab (2), object-config-tab (2 + opisy),
appearance-config-tab (3, nowododane zwijanie), email-settings-content
(5), client-details-page (9 sekcji + opisy + unicode fix),
client-form-page (6 sekcji + ikony + opisy).

**Konfiguracja środowiskowa (.env --- nowe zmienne):**

SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD ---
sekrety SMTP, nigdy w DB/UI.
EMAIL_DRY_RUN=true|false --- flaga środowiskowa, nie DB.
CRON_SECRET --- secret dla /api/internal/*.
BASE_URL --- bazowy URL do linków w emailach.

**Zależności npm:** nodemailer, @types/nodemailer.

**Pliki E3a (10 nowych, 15 zmodyfikowanych):**

NOWE: src/lib/email-service.ts, src/lib/email-renderer.ts,
src/lib/email-templates-default.ts, src/app/api/settings/email/
route.ts, src/app/api/settings/email/test/route.ts,
src/app/api/settings/email/test-connection/route.ts,
src/app/admin/(panel)/global-settings/appearance/page.tsx,
src/app/admin/(panel)/global-settings/email/page.tsx,
src/components/global-settings/global-settings-layout.tsx,
src/components/global-settings/email-settings-content.tsx.

ZMODYFIKOWANE: prisma/schema.prisma, src/app/api/public/book/route.ts,
src/app/api/reservations/[id]/confirm/route.ts,
src/app/api/reservations/[id]/cancel/route.ts,
src/app/admin/(panel)/global-settings/page.tsx, src/middleware.ts,
src/components/layout/sidebar.tsx, src/components/config/
config-content.tsx, src/styles/globals.css, src/components/config/
reservations-config-tab.tsx, payments-config-tab.tsx,
object-config-tab.tsx, appearance-config-tab.tsx,
src/components/clients/client-details-page.tsx, client-form-page.tsx.

**Testy E3a (9/9 zaliczone 06.04.2026):**

T1: Email testowy dry-run → log DRY_RUN w PM2 + EmailLog SENT.
T2: Email testowy real SMTP → mail przyszedł na skrzynkę.
T3: Booking → BOOKING_CONFIRMATION email z danymi pobytu + przelewu.
T4: Link w emailu → otwiera /reservation/[token].
T5: Confirm → STATUS_CONFIRMED email.
T6: Cancel → STATUS_CANCELLED email.
T7: EmailLog w bazie: 6 wpisów, typy i statusy poprawne.
T8: /api/internal/ → 401 bez x-cron-secret.
T9: Nawigacja global-settings + config bez Wyglądu.

**Granica E3a / E3b:**

E3a = wysyłka emaili transakcyjnych (booking/status/test SMTP).
E3b = reminder cron runtime + edytor szablonów + widok logów.

**Ograniczenia E3a (rozwiązane w E3b ✅):**
- ~~Brak edytora szablonów HTML~~ → E3b: EmailTemplate model + edytor
- ~~Brak reminder runtime~~ → E3b: /api/internal/email/reminders/run
- ~~Brak widoku EmailLog~~ → E3b: /admin/global-settings/email-logs
- Brak durable queue → pozostaje (akceptowalne na tym etapie)

**═══ E3b: Email rozszerzony --- ZREALIZOWANA ✅ 07.04.2026 ═══**

**Czym jest:** Rozszerzenie systemu email o: automatyczne przypomnienia
o wpłacie (cron), edytor szablonów HTML z podglądem na żywo, widok
logów email w panelu admina. Plus poprawki UI (statusy dark mode,
tabele, BubbleRangePicker).

**Model danych:**

Nowy enum EmailTemplateType (BOOKING_CONFIRMATION, PAYMENT_REMINDER,
STATUS_CONFIRMED, STATUS_CANCELLED) --- osobny od EmailLogType.

Nowy model EmailTemplate: id, type (EmailTemplateType, unique),
subject (String), bodyHtml (String @db.Text), updatedAt, updatedByUserId
(FK → User, relacja EmailTemplateUpdatedBy). Tabela email_templates.
Brak rekordu = fallback na default z kodu (email-templates-default.ts).
Admin tworzy rekord dopiero przy pierwszej edycji (upsert).

**Integracja email-service.ts:** Zmieniony renderEmail() ---
sprawdza DB (EmailTemplate.findUnique) → fallback na DEFAULT_TEMPLATES.
Zero zmian w email-renderer.ts ani email-templates-default.ts.

**Endpointy API (5 nowych):**

GET /api/settings/email/templates --- lista 4 szablonów ze statusem
custom/default. Auth: OWNER+.

GET /api/settings/email/templates/[type] --- pojedynczy szablon
(custom z DB lub default z kodu, + defaultSubject/defaultBodyHtml
do resetu). Auth: OWNER+.

PUT /api/settings/email/templates/[type] --- upsert (subject +
bodyHtml). Walidacja: niepuste, max 100KB. Auth: OWNER.

DELETE /api/settings/email/templates/[type] --- reset do domyślnego
(usunięcie rekordu z DB → fallback na kod). Auth: OWNER.

POST /api/settings/email/preview --- renderuje szablon z demo danymi.
Dwa tryby: draft (subject + bodyHtml z body) lub saved (z DB/default).
Auth: OWNER+. Brak zapisu, brak wysyłki, max 100KB bodyHtml.
Demo dane: ZW-2026-DEMO, Jan Kowalski, 3 noce, Domek Hobbitów nr 3.

GET /api/settings/email/logs --- lista z filtrowaniem i paginacją.
Query: type, status, triggerSource, page, limit. Auth: OWNER+.

POST /api/internal/email/reminders/run --- cron endpoint.

**Reminder cron (architektura --- zatwierdzona przez ChatGPT):**

Zabezpieczenie: podwójna warstwa auth (middleware x-cron-secret +
route handler re-check CRON_SECRET).

Strategia: mark-then-send (wariant 1 per ChatGPT).

Flow:
1. Pobierz CompanySettings (reminderEnabled, reminderDays, maxReminders)
2. Jeśli !reminderEnabled → return { sent: 0, reason: "disabled" }
3. Znajdź kandydatów (PENDING + BOOKING + client.email):
   - Pierwszy reminder: paymentReminderCount = 0, createdAt <= cutoff
   - Kolejny: paymentReminderCount > 0 < max, lastPaymentReminderAt <= cutoff
4. Dla każdej rezerwacji: $transaction z FOR UPDATE lock na booking_details
5. Re-check warunków pod lockiem (count, timing)
6. UPDATE paymentReminderCount++, lastPaymentReminderAt
7. Transaction commit
8. DOPIERO POTEM: emailService.sendPaymentReminder() (poza transakcją)
9. Return JSON: { sent, skipped, errors, total, timestamp }

Cron na VPS: crontab, codziennie o 9:00.
CRON_SECRET: wygenerowany openssl rand -hex 32, nigdy w kodzie/czacie.
Log: >> /var/log/zw-reminders.log 2>&1.

**Nawigacja (rozszerzenie):**

GlobalSettingsLayout: 4 taby (było 2):
- Wygląd widżetu (/admin/global-settings/appearance)
- Powiadomienia e-mail (/admin/global-settings/email)
- Szablony e-mail (/admin/global-settings/email-templates) --- NOWY
- Logi e-mail (/admin/global-settings/email-logs) --- NOWY

Sidebar dropdown „Ustawienia globalne": 4 pozycje (ikony: Palette,
MailOpen, FileCode, ListChecks).

**Admin UI — Szablony e-mail:**

Lista (/admin/global-settings/email-templates): 4 belki w stylu
planów cenowych (bubble p-5). Tytuł + opis + badge (DOMYŚLNY/WŁASNY)
+ pill z tematem + data edycji. Cała karta klikalna → edytor.
Ikona oka → SlidePanel z podglądem wyrenderowanego HTML (iframe).

Edytor (/admin/global-settings/email-templates/[type]): przycisk
Wróć + tytuł. Dwa panele: lewy (textarea monospace + legenda
zmiennych TEXT/HTML z klik-to-insert) + prawy (iframe live preview,
debounce 600ms + AbortController cancel stale requests). Przyciski:
Zapisz, Podgląd pełnoekranowy, Wyślij testowy, Przywróć domyślny
(ConfirmDialog).

**Admin UI — Logi e-mail:**

/admin/global-settings/email-logs: Tabela z filtrowaniem (BubbleSelect:
typ, status, triggerSource), paginacją (30/stronę), klik → SlidePanel
ze szczegółami (typ, odbiorca, temat, daty, próby, errorMessage,
link do rezerwacji).

**Poprawki UI wdrożone razem z E3b:**

Status badge dark mode: bg-emerald-50/bg-amber-50 (stałe jasne)
→ bg-emerald-500/15, bg-amber-500/15, bg-destructive/15 (opacity ---
adaptuje się do light i dark mode). Zasada DS: NIGDY stałe jasne
tła na badge, ZAWSZE opacity.

table-bubble CSS: header bg-muted/60 (było /30), border-bottom 2px,
hover primary/0.05, pierwsza kolumna text-foreground font-medium.

BubbleRangePicker trigger: zawsze dwukolumnowy layout (Przyjazd →
Wyjazd), placeholder "Wybierz datę", ikona h-4 (było h-5),
hover:border-primary (pełna, była /40).

SMTP panel mobile: pola stackowane pionowo, break-all na font-mono.

E-mail testowy: wynik jako toast (nie inline pod inputem).

**Pliki E3b (12 nowych, 5 zmodyfikowanych):**

NOWE: src/app/api/settings/email/templates/route.ts,
src/app/api/settings/email/templates/[type]/route.ts,
src/app/api/settings/email/preview/route.ts,
src/app/api/settings/email/logs/route.ts,
src/app/api/internal/email/reminders/run/route.ts,
src/app/admin/(panel)/global-settings/email-templates/page.tsx,
src/app/admin/(panel)/global-settings/email-templates/[type]/page.tsx,
src/app/admin/(panel)/global-settings/email-logs/page.tsx,
src/components/global-settings/email-templates-list.tsx,
src/components/global-settings/email-template-editor.tsx,
src/components/global-settings/email-logs-content.tsx,
prisma/schema.prisma (EmailTemplate + EmailTemplateType).

ZMODYFIKOWANE: src/lib/email-service.ts (DB template lookup),
src/components/global-settings/global-settings-layout.tsx (4 taby),
src/components/layout/sidebar.tsx (4 pozycje dropdown + Design System),
src/components/ui/bubble-range-picker.tsx (trigger redesign),
src/styles/globals.css (table-bubble improved).

**Testy E3b (12/12 zaliczone 07.04.2026):**

T1: Lista szablonów: 4 belki ze statusem Domyślny.
T2: Edytor: zmiana HTML, live preview odświeża się (~600ms).
T3: Zapisz szablon → status Własny, email używa custom.
T4: Reset do domyślnego → fallback na kod.
T5: Wyślij testowy z edytora → mail przychodzi.
T6: Reminder cron: curl → { sent: 2, skipped: 0, errors: 0 }.
T7: Reminder idempotencja: drugie wywołanie → { sent: 0 }.
T8: /api/internal bez secret → 401.
T9: /api/internal z secret → 200 + JSON.
T10: Logi: wpisy widoczne, filtry działają.
T11: Logi: klik → SlidePanel ze szczegółami.
T12: Crontab zapisany i działa (crontab -l).

**═══ Design System page --- ZREALIZOWANA ✅ 07.04.2026 ═══**

**Czym jest:** Żywa strona referencyjna UI w panelu admina.
Wizualny podgląd wszystkich komponentów, tokenów, wzorców i zasad.
Źródło prawdy dla UI przy dalszym rozwoju projektu. Oparta o
realne komponenty z kodu (nie osobny „świat demo").

**Routing:** /admin/design-system. Osobna pozycja w sidebarze na
dole (separator + link „Design System" z ikoną Palette).

**6 tabów (osobny plik per sekcja):**
1. Typography — Plus Jakarta Sans, skala 9–20px, wagi, kolory tekstu,
   font-mono
2. Colors & Tokens — 12 CSS variables (light/dark), kolory semantyczne,
   tokeny layoutu (radius, sidebar, topbar)
3. Buttons & Inputs — primary/secondary/destructive/icon buttony,
   input-bubble, search, toggle, checkbox, radio
4. Selects & Pickers — BubbleSelect (live), SearchableSelect,
   BubbleDatePicker, BubbleRangePicker, BubbleColorPicker (wszystkie
   interaktywne), Tooltip, badge, pills, count-bubble, kropki statusu
5. Panels & Feedback — SlidePanel (live demo), ConfirmDialog (live),
   Toast (live), sekcja zwijana §25 (live), skeleton shimmer, spinner,
   empty state, alert/info boxy (amber/red/green)
6. Layout & Patterns — bubble/bubble-interactive, belki statyczne,
   nagłówek strony, taby, pasek filtrów, tabela danych (wzorzec z
   Klientów/Rezerwacji z badge opacity), sekcja zwijana, empty state,
   lista klikalna, detail row, spacing, paginacja

**Struktura każdej sekcji:** Tytuł + opis → live preview komponentów
→ „Zastosowanie" (niebieska etykieta + linia) → ReferenceBox
(komponent, plik, usage) → RulesBlock (ZAWSZE/NIGDY).

**Pliki (10):**
src/app/admin/(panel)/design-system/page.tsx,
src/components/design-system/design-system-content.tsx,
src/components/design-system/shared.tsx,
src/components/design-system/sections/typography.tsx,
src/components/design-system/sections/colors.tsx,
src/components/design-system/sections/buttons-inputs.tsx,
src/components/design-system/sections/selects-pickers.tsx,
src/components/design-system/sections/panels-feedback.tsx,
src/components/design-system/sections/layout-patterns.tsx,
src/components/layout/sidebar.tsx (link Design System na dole).

18\. Warunki i reguły biznesowe

18.1. Rezerwacje

174. Cena zamrażana (snapshot) w momencie utworzenia --- zmiana cennika
     nie wpływa na istniejące

175. Ustawienia globalne stosowane w momencie założenia rezerwacji ---
     zmiana ustawień dotyczy tylko przyszłych

176. Klient płaci tylko i wyłącznie kwotę, którą zarezerwował --- cena
     niezmieniana pod żadnym kątem

177. Klient NIE może edytować złożonej rezerwacji

178. Overbooking: NIEMOŻLIWY --- blokada natychmiastowa po złożeniu

179. Edycja po CONFIRMED: ponowna walidacja + korekta ceny (nie zmiana
     wartości)

180. Edycja dat/osób rezerwacji NIE nadpisuje istniejących snapshotów
     addonów --- chyba że admin jawnie edytuje sam addon w formularzu

18.2. Oferty

181. Oferta blokuje timeline identycznie jak rezerwacja

182. Oferta NIE może być nadpisana przez admina --- musi być anulowana

183. Akceptacja oferty przez klienta = type OFFER→BOOKING, status →
     PENDING

184. Akceptacja NIE oznacza CONFIRMED --- wymaga wpłaty

185. Admin może ręcznie ustawić ofertę jako CONFIRMED (pomija klienta)

18.3. Płatności

186. Płatności immutable --- nie edytujemy, tylko korekty

187. Status rezerwacji zmienia się po zaksęgowaniu (webhook/confirmed),
     nie po kliknięciu

188. Wpłata \< próg: paymentStatus = PARTIAL, status rezerwacji bez
     zmian (PENDING)

189. Wpłata \>= próg: paymentStatus = PAID lub PARTIAL, status →
     CONFIRMED

190. Przelew tradycyjny: admin wprowadza ręcznie, bez limitu min. raty

191. Anulowana → przywrócenie na timeline wymaga sprawdzenia
     availability (zasób zajęty = niemożliwe)

18.4. Timeline i slide panel

192. Wszystkie akcje na timeline i listach odbywają się na slide
     panelach (operacyjne narzędzie recepcji)

193. Slide panel fetchuje pełne dane z GET /api/reservations/\[id\] ---
     nie polega na danych z timeline entry

194. Karta rezerwacji (pełna podstrona) korzysta z tego samego endpointu
     --- zero osobnych endpointów

195. Klik w wiersz listy = slide panel (nie routing do podstrony)

196. Badge płatności aktualizuje się w czasie rzeczywistym

197. Kolory pozycji na timeline = statusy rezerwacji (nie badge
     płatności)

198. Edytuj rezerwację w slide panelu NIE zamyka detail panelu --- po
     zamknięciu edycji wraca do detail

199. Zamelduj gościa: bg-purple-600 (matching karta rezerwacji, nie
     primary blue)

200. Rabat kolor: primary blue (nie emerald) --- kolor informacyjny

201. Notatki wyświetlane normalnym fontem (nie italic/thin/wychudzone)

202. Nazewnictwo: „Otwórz kartę rezerwacji" i „Powiadom klienta" w całym
     systemie

19\. Ograniczenia bazy danych (DB Constraints)

19.1. Unikalność (UNIQUE)

  ------------------ --------------------- ----------------------------------
  **Pole**           **Tabela**            **Opis**

  number             reservations          Numer rezerwacji
                                           (ZW-/OF-/BL-YYYY-NNNN)

  clientNumber       clients               Numer klienta (KL-NNNN)

  token              offer_details         Publiczny token dostępu do oferty

  email              users                 Login użytkownika panelu

  slug               resources             Slug zasobu (URL-friendly)

  slug               resource_categories   Slug kategorii

  code               promo_codes           Kod rabatowy
  ------------------ --------------------- ----------------------------------

19.2. Indeksy

  ------------------ ------------------------- --------------------------
  **Tabela**         **Pola**                  **Powód**

  reservations       type + status             Filtrowanie listy po typie
                                               i statusie

  reservations       checkIn + checkOut        Zapytania zakresowe
                                               (timeline)

  reservations       clientId                  Rezerwacje klienta

  reservations       createdAt                 Sortowanie chronologiczne

  timeline_entries   resourceId + startAt +    Sprawdzanie dostępności
                     endAt                     

  timeline_entries   type + status             Filtrowanie aktywnych
                                               wpisów

  timeline_entries   reservationId             Wpisy per rezerwacja

  payments           reservationId             Płatności per rezerwacja

  payments           status                    Filtrowanie potwierdzonych
  ------------------ ------------------------- --------------------------

19.3. Exclusion Constraint (btree_gist)

Constraint no_resource_overlap na tabeli timeline_entries:

```sql
EXCLUDE USING gist (
  "resourceId" WITH =,
  tsrange("startAt", "endAt", '[)') WITH &&
) WHERE (status = 'ACTIVE')
```

Zapobiega nakładaniu się aktywnych wpisów dla tego samego zasobu.
Semantyka [) = start inclusive, end exclusive (checkout A = checkin B
→ brak konfliktu). Dodany w S3.1 (08.04.2026) z poprawnymi nazwami
kolumn Prisma (camelCase).

Dotyczy ACCOMMODATION i TIME_SLOT (zasoby blokowane 1:1). Dla
QUANTITY_TIME ochrona przez FOR UPDATE na resource row + SUM check
w timeline-service.ts.

19.4. Brakujące constrainty (do dodania)

  ---------------------- ------------------ ------------------------------
  **Constraint**         **Tabela**         **Reguła**

  CHECK nights \> 0      reservations       Liczba nocy musi być dodatnia

  CHECK total \>= 0      reservations       Kwota nie może być ujemna

  CHECK amount \> 0      payments           Kwota płatności musi być
                                            dodatnia

  CHECK startAt \< endAt timeline_entries   Data końca po dacie początku

  CHECK checkIn \<       reservations       Data wyjazdu po dacie
  checkOut                                  przyjazdu
  ---------------------- ------------------ ------------------------------

20\. Edge cases i reguły synchronizacji

20.1. Edycja rezerwacji z częściową płatnością

Scenariusz: rezerwacja CONFIRMED, paymentStatus=PARTIAL, admin zmienia
daty lub zasoby.

203. PATCH wymaga force: true (soft lock)

204. System sprawdza availability dla nowych dat/zasobów (w transakcji)

205. Jeśli dostępne: timeline entries są wymieniane (check → cancel →
     create)

206. System generuje automatyczną korektę cenową (różnica między starą a
     nową wartością)

207. Pierwotna wartość rezerwacji NIE zmienia się --- korekta jest
     osobnym wpisem

208. balanceDue jest przeliczane: total + korekty - sum(confirmed
     payments)

209. paymentStatus aktualizuje się automatycznie na podstawie nowego
     balanceDue

20.2. Usunięcie dodatku po wpłacie

Scenariusz: rezerwacja CONFIRMED z dodatkiem, klient już wpłacił.

210. Dodatek NIE jest fizycznie usuwany --- jest dezaktywowany (soft
     delete)

211. System generuje korektę finansową (ujemna wartość = zwrot)

212. balanceDue przeliczane: może wyjść ujemne (nadpłata)

213. Nadpłata widoczna w karcie rezerwacji --- admin decyduje o zwrocie

214. Historia operacji zachowana (log: dezaktywacja dodatku + korekta)

20.3. Model współbieżności (Concurrency Model)

System chroni się przed race conditions na 4 poziomach, każdy z osobnym
mechanizmem lockowania (per ChatGPT architecture review, S3.1):

  ---------------------- ----------------------- -----------------------
  **Operacja**           **Mechanizm**           **Plik**

  Rezerwacja (booking)   FOR UPDATE na quote     book/route.ts
                         row + exclusion
                         constraint na timeline

  Status rezerwacji      FOR UPDATE na           reservation-
  (confirm/cancel/...)   reservation row +       transition.ts
                         typed state machine

  Status płatności       FOR UPDATE na payment   payment-
  (confirm/reject)       row → potem reservation transition.ts
                         row (lock order)

  Dostępność zasobu      DB exclusion constraint timeline_entries
  (ACCOMMODATION/        no_resource_overlap     (PostgreSQL)
  TIME_SLOT)             (btree_gist, tsrange)

  Dostępność zasobu      FOR UPDATE na resource  timeline-service.ts
  (QUANTITY_TIME)        row + SUM check         checkQuantity
                                                 Availability()
  ---------------------- ----------------------- -----------------------

**Lock order (prevents deadlocks):** payment row → reservation row
(nigdy odwrotnie).

**Exclusion constraint (no_resource_overlap):**

```sql
EXCLUDE USING gist (
  "resourceId" WITH =,
  tsrange("startAt", "endAt", '[)') WITH &&
) WHERE (status = 'ACTIVE')
```

Dotyczy ACCOMMODATION i TIME_SLOT. Dla QUANTITY_TIME — ochrona na
poziomie aplikacji (SUM + FOR UPDATE na resource row).

**Error mapping:** Postgres 23P01 (exclusion violation) → HTTP 409
CONFLICT. ConflictError z timeline-service → 409. TransitionError
z reservation-transition → 409. PaymentTransitionError → 409.

**Side effects:** email NIGDY w transakcji. Zawsze fire-and-forget
PO commit. Tylko dla zwycięzcy (if !result.idempotent).

**Testy współbieżności S3.1 (5/5 PASS, 08.04.2026):**

C1: Ten sam quote 2x book → idempotent (ten sam numer rezerwacji).
C2: Dwa quote'y, ten sam zasób/termin → 1 sukces + 1 CONFLICT 409.
C3: Public book vs admin create → 1 sukces + 1 CONFLICT 409.
C4: Confirm + cancel równolegle → deterministic final state (cancel).
C5: 2x payment confirm → 1 confirm + 1 idempotent.
Integrity: 0 orphanów, 0 overlapów, timeline = items.

20.4. Invarianty systemu (reguły zawsze prawdziwe)

Poniższe reguły MUSZĄ być prawdziwe w każdym momencie. Złamanie
którejkolwiek oznacza bug krytyczny.

**Availability:**
- Nie może istnieć overlap ACTIVE timeline entries dla tego samego
  resourceId (chronione przez exclusion constraint no_resource_overlap)
- Każdy ACTIVE timeline entry musi mieć odpowiadający reservation_item
  z rezerwacją w statusie PENDING lub CONFIRMED

**Status transitions:**
- Reservation status change ZAWSZE przechodzi przez
  transitionReservationStatus() (reservation-transition.ts)
- Payment status change ZAWSZE przechodzi przez
  transitionPaymentStatus() (payment-transition.ts)
- Check-in NIE zmienia ReservationStatus — ustawia TYLKO checkedInAt
- Przegrany request NIGDY nie tworzy side effects (audit log, email)

**Finansowe:**
- Payment ledger jest immutable (CONFIRMED payments nie są edytowane)
- paidAmountMinor na booking_details = SUM(amountMinor) CONFIRMED
  payments z direction=IN
- balanceDueMinor = totalMinor - paidAmountMinor
- Wszystkie kwoty w groszach (amountMinor, Int). Zero floatów.

**Email:**
- Email NIGDY nie jest wysyłany wewnątrz transakcji DB
- Email wysyłany TYLKO po udanym commit
- Email wysyłany TYLKO dla zwycięzcy (if !result.idempotent)
- Quote może być użyty tylko raz (usedAt + reservationId idempotent)

**Rola checkAvailability():**
- checkAvailability() jest pre-checkiem aplikacyjnym służącym do
  szybkiego wykrycia oczywistego konfliktu i lepszego UX.
- checkAvailability() NIE jest gwarancją spójności przy współbieżności.
- Jedyną twardą gwarancję braku overlapów zapewnia transakcja DB
  + PostgreSQL EXCLUDE USING gist na timeline_entries.
- W przypadku wyścigu dwóch requestów finalną ochroną jest constraint
  DB, a nie wynik wcześniejszego checku aplikacyjnego.

20.5. Synchronizacja paymentStatus

paymentStatus na rezerwacji to CACHE wyliczany z tabeli Payment. Reguły:

  ------------------------- ------------------- ------------------------------
  **Warunek**               **paymentStatus**   **Efekt na status rezerwacji**

  sum(confirmed) = 0        UNPAID              Brak zmiany

  0 \< sum(confirmed) \<    PARTIAL             Brak zmiany (PENDING zostaje
  total                                         PENDING)

  sum(confirmed) \>=        PARTIAL lub PAID    PENDING → CONFIRMED (auto)
  wymagany_procent                              

  sum(confirmed) \>= total  PAID                Brak zmiany (już CONFIRMED)
  ------------------------- ------------------- ------------------------------

**Kiedy się przelicza:**

-   Po dodaniu nowej płatności (Payment.status = CONFIRMED)

-   Po dodaniu korekty

-   Po dodaniu/usunięciu dodatku

-   Po edycji rezerwacji (zmiana total przez korektę)

20.6. Flaga overdue --- synchronizacja

Flaga overdue = true gdy:

-   Istnieje PaymentSchedule z terminem \< NOW() i kwota nie została
    wpłacona

-   Rezerwacja z frontu: czas na wpłatę (z ustawień globalnych)
    przekroczony

**Kiedy się sprawdza:**

-   Cron job (co godzinę lub co 15 minut)

-   Przy każdym renderowaniu timeline (frontend sprawdza datę vs
    deadline)

-   Po dodaniu płatności (może usunąć flagę overdue)

20.6. Automatyczne przejścia statusów

System wykonuje następujące automatyczne zmiany (cron/scheduled task):

  ---------------------- ----------------------- -------------------------
  **Przejście**          **Kiedy**               **Warunek**

  CONFIRMED → FINISHED   Po północy (checkOut +  Status = CONFIRMED, NIE
                         1 dzień)                NO_SHOW

  PENDING → CANCELLED    Po przekroczeniu czasu  Tylko rezerwacje z
                         na wpłatę               frontu + ustawienie „Auto
                                                 anuluj"

  PENDING →              Po przekroczeniu czasu  Tylko rezerwacje z
  requiresAttention      na wpłatę               frontu + ustawienie „Do
                                                 wyjaśnienia"

  OFFER → CANCELLED      Po przekroczeniu        expiryAction = CANCEL
                         ważności oferty         

  OFFER →                Po przekroczeniu        expiryAction = NOTHING
  requiresAttention      ważności oferty         (do wyjaśnienia)

  overdue = true         Po przekroczeniu        PaymentSchedule.dueDate
                         terminu raty            \< NOW()
  ---------------------- ----------------------- -------------------------

*Wszystkie automatyczne przejścia są logowane w ReservationStatusLog z
changedBy = „SYSTEM".*

20.8. Failure Model (zachowanie przy awariach)

System zakłada, że awarie częściowe są możliwe i muszą być obsługiwane
w sposób przewidywalny.

**Awaria w trakcie transakcji DB:**
Cała transakcja jest rollbackowana. System nie zapisuje częściowego
stanu. Klient otrzymuje błąd (4xx lub 5xx). Żaden side effect
zewnętrzny nie może zostać wykonany przed commitem.

**Awaria po commicie, przed side effectem:**
Dane biznesowe pozostają poprawne. Operacja główna jest uznana za
skuteczną. Błąd side effectu jest logowany. Brak retry automation
na tym etapie jest świadomym ograniczeniem MVP.

**Awaria email:**
Status rezerwacji/płatności nie jest cofany. Timeline i ledger
pozostają prawidłowe. System loguje błąd w EmailLog. Retry/outbox
są planowanym rozszerzeniem (nie częścią MVP).

**Awaria cron / reminder:**
Nie wpływa na spójność rezerwacji ani płatności. Wpływa na terminowość
komunikacji. Monitoring wykonania cronów — przyszłe rozszerzenie.

**Awaria public API przy bookingu:**
Konflikt → klient otrzymuje 409, nie powstaje częściowa rezerwacja.
Błąd serwera → rollback transakcji, brak częściowego stanu.

**Awaria payment confirm (race condition):**
Tylko pierwszy skuteczny request wykonuje transition. Kolejne requesty
otrzymują wynik idempotentny. Projekcje przeliczane dokładnie raz.

**Retry / idempotency policy (stan MVP):**
- Email: fire-and-forget, brak retry. Błąd logowany w EmailLog.
  Świadome ograniczenie MVP.
- Webhook (przyszłe E4): externalCorrelationId przygotowane w schemacie
  Payment, ale idempotency nie jest jeszcze globalnie egzekwowane.
  Przed E4 wymagany twardy kontrakt.
- Cron: brak monitoringu wykonania w MVP. Awaria cron = cichy brak
  przypomnień, bez wpływu na spójność danych.

20.9. Observability / Monitoring (outline — do rozbudowy)

Docelowy model operacyjny:
1. Structured logs z requestId / correlationId
2. Logowanie krytycznych flow po reservationId, paymentId, quoteId
3. Monitoring cronów (wykonanie, błędy)
4. Monitoring błędów public booking flow (success/fail ratio)
5. Monitoring skuteczności emaili
6. Health model: DB, SMTP, storage, background jobs

Stan obecny (po OPS, 08.04.2026): requestId na każdym request
(X-Request-Id header + error body), start/end logi z duration,
GET /api/health (DB + SMTP cached + cron heartbeat), PM2 logs,
EmailLog, diagnostyka SMTP. Brak centralnego error trackingu,
brak alertingu.
To jest świadome ograniczenie obecnego etapu, nie docelowy model.
Stan docelowy: produkcyjne observability z korelacją i alertowaniem.

20.10. Public API Security (outline — do rozbudowy)

Zasady public API:
1. Endpointy publiczne bez autoryzacji, chronione rate limiterem
2. Tokeny rezerwacji i sekrety quote z wysoką entropią (UUID v4 / hex32)
3. Publiczny widok rezerwacji nie ujawnia danych administracyjnych
4. Odpowiedzi auditowane pod kątem data exposure
5. Testy: brute-force tokenów, replay prób bookingu, enumeracja quote
6. Docelowo: formalna polityka replay protection i abuse handling

Stan obecny (MVP): rate limiter na publicznych endpointach, quote
używa sekretu anty-enumeracyjnego (hex32), reservation token z wysoką
entropią (UUID v4), public reservation view nie ujawnia danych
administracyjnych. Egzekwowane w kodzie od E1.
Stan docelowy: pełny audit security + abuse handling.

20.11. Widget Integration Model (outline — do rozbudowy)

Osadzenie widgetu na zewnętrznym froncie wymaga modelu integracyjnego:
1. iframe / embed behavior
2. Cross-domain constraints
3. Cookie/session behavior w iframe
4. CSP / mixed content
5. Mobile rendering
6. Wpływ cache pluginów i optymalizatorów WordPressa
7. Poprawność linków powrotnych i URL-i w emailach

Stan obecny: widget działa jako public frontend z własnym API.
Sekcja opisuje docelowy model integracyjny. Pełna walidacja zachowania
iframe / cookies / CSP / cache pluginów WordPressa jest częścią
GO-LIVE readiness, nie zamkniętą właściwością systemu na dziś.
Stan docelowy: formalnie opisana architektura integracyjna.

20.12. Known Limitations & Deferred Decisions

Poniższe ograniczenia są ŚWIADOME i UDOKUMENTOWANE. Nie są bugami
ani przeoczeniami. Każde ma plan rozwiązania w odpowiedniej warstwie.

**── Ograniczenia operacyjne ──**

⚠️ Email: Brak retry / outbox. Fire-and-forget po commit.
  Plan: outbox queue w przyszłości.

⚠️ Monitoring: Brak Sentry / centralnego error trackingu / alertowania.
  Wdrożone: requestId + health endpoint.
  Plan: structured logs + Sentry w Warstwie E.

⚠️ Infrastruktura: Single VPS. Brak replikacji, brak failover.
  Backup DB co noc. Plan: akceptowalne na obecną skalę.

⚠️ Email deliverability: SPF ✅, DKIM ✅ (panel home.pl), DMARC ✅ (p=none).
  Plan: DMARC p=quarantine + weryfikacja DKIM w DNS przed GO-LIVE.

⚠️ Branching: Jeden branch (master). Świadoma decyzja (ADR-08).
  Plan: dev + feature/* gdy dojdzie drugi developer.

**── Ograniczenia produktowe (warstwy do zbudowania) ──**

🟢 Warstwa B (częściowo): B1 Media ✅, B2 Content ✅. Pozostało:
  B3 Amenities, B4 Property Content, B5 Widget detail UI.
  Widget powinien docelowo preferować isCover=true, fallback: position ASC.

🔵 Warstwa C: Brak modułu sprzątania / operacyjności obiektu.
  Brak statusów DIRTY/CLEANING/READY. Brak dashboardu operacyjnego.

🔵 Warstwa D: Brak revenue engine (restrykcje, pakiety, dynamic pricing).
  Brak min/max stay, closed days, gap rules. Brak Przelewy24.

🔵 Warstwa E: Brak channel managera, panelu klienta, raportów,
  dokumentów, CRM, multi-property.

**── Blokery (muszą być zamknięte przed konkretnym krokiem) ──**

⛔ Webhook idempotency: externalCorrelationId w schemacie, brak enforcement.
  BLOCKER przed E4 (Przelewy24). Nie bloker obecnego rozwoju.

✅ Storage/media kontrakt: B0 zaakceptowany (09.04.2026), B1 wdrożony
  (10.04.2026). Model ResourceImage, MediaStorageProvider (local + R2-ready),
  runtime URLs (ADR-11), partial unique index isCover, two-phase reorder,
  image processing (sharp, 3 rozmiary WebP, SHA-256, max 5MB).

✅ ADR-14: Rename pól Resource (B2, 10.04.2026). shortDesc → shortDescription,
  description → longDescription, area (Decimal) → areaSqm (Int).
  PATCH zamiast PUT na /api/resources/[id].

**── Testy ──**

✅ 18 testów regresyjnych (scripts/test-critical.sh). Wynik: 18/18 PASS.
  Grupy: booking core (T1-T4), lifecycle (T5-T10), payments (T11-T14),
  integrity (T15-T18). Cleanup automatyczny.
✅ 6 testów B1 media (scripts/test-b1-media.sh). Wynik: 6/6 PASS.
  Upload, MIME validation, cover, reorder, delete, public streaming.
✅ 7 testów B2 content (scripts/test-b2-content.sh). Wynik: 7/7 PASS.
  Beds CRUD, validation, PATCH content, GET z B2 polami, catalog bez longDescription.
⚠️ test-critical.sh ma hardcoded daty (fragile). Plan: dynamiczne daty.
⚠️ Brak unit testów. Brak CI/CD. Plan: rozbudowa przy Warstwie D.

21\. Sekwencje i numeracja

21.1. Numery rezerwacji

  ------------------ ---------------- -------------- ------------------------
  **Typ**            **Format**       **Przykład**   **Sekwencja DB**

  Rezerwacja         ZW-YYYY-NNNN     ZW-2026-0042   reservation_number_seq
  (BOOKING)                                          

  Oferta (OFFER)     OF-YYYY-NNNN     OF-2026-0015   reservation_number_seq

  Blokada (BLOCK)    BL-YYYY-NNNN     BL-2026-0003   reservation_number_seq

  Klient             KL-NNNN          KL-0127        client_number_seq
  ------------------ ---------------- -------------- ------------------------

Wszystkie typy rezerwacji współdzielą jedną sekwencję
(reservation_number_seq). Gwarantuje to unikalność numerów globalnie.
Przy konwersji OFFER → BOOKING generowany jest NOWY numer z prefixem ZW-
(stary OF- zostaje w logach).

21.2. Sekwencje a seed data

Po seedowaniu bazy, sekwencje muszą być ustawione na wartość wyższą niż
najwyższy użyty numer. Seed ustawia to automatycznie (CREATE SEQUENCE
\... START WITH N).

22\. Typy zasobów i logika dostępności

System obsługuje trzy fundamentalnie różne typy zasobów. Typ zasobu
(ResourceCategory.type) definiuje całą logikę systemu: dostępność, UI,
pricing, timeline.

+-----------------------------------------------------------------------+
| **JEDNO ŸRÓDŁO PRAWDY**                                               |
|                                                                       |
| System posiada WYŁĄCZNIE 3 typy zasobów. Nie ma podwójnego systemu    |
| typów. Stare typy (VENUE, GASTRONOMY, EQUIPMENT, ATTRACTION, SERVICE) |
| są zastępowane nowymi.                                                |
+-----------------------------------------------------------------------+

**Mapowanie starych typów na nowe:**

  ---------------- ---------------- --------------------------------------
  **Stary typ**    **Nowy typ**     **Przykłady**

  ACCOMMODATION    ACCOMMODATION    Domki, pokoje

  VENUE            TIME_SLOT        Sale konferencyjne

  GASTRONOMY       TIME_SLOT        Restauracja (przyjęcia, komunie)

  EQUIPMENT        QUANTITY_TIME    Kajaki, rowery wodne, SUP

  ATTRACTION       TIME_SLOT        Paintball, plac zabaw (domyślnie)

  SERVICE          --- (usunięty)   Wyżywienie, sprzątanie → to są Addony,
                                    nie zasoby
  ---------------- ---------------- --------------------------------------

*SERVICE nie jest typem zasobu --- usługi typu wyżywienie, sprzątanie,
parking są modelowane jako Addony (rozdział 8), nie jako Resource.*

22.1. ACCOMMODATION (noclegi)

Domki, pokoje --- rezerwacje na noclegi.

  ------------------ ----------------------------------------------------
  **Cecha**          **Wartość**

  Jednostka czasu    Dni (checkIn / checkOut) --- rama biznesowa

  Dostępność         Zasób zajęty 1:1 (exclusion constraint)

  Timeline           Blokuje zakres timestampów (startAt/endAt z
                     godzinami operacyjnymi)

  Pricing            Cena za noc (pricePerNight)

  Przykłady          Domek 1, Pokój 3

  Capacity           maxCapacity = max osób
  ------------------ ----------------------------------------------------

UI i logika biznesowa operują na datach przyjazdu/wyjazdu. Operacyjne
source of truth blokowania to ReservationItem.startAt/endAt i
TimelineEntry.startAt/endAt jako pełne timestampy (z godzinami
check-in/check-out z GlobalSettings lub override per kategoria).

22.2. TIME_SLOT (rezerwacje godzinowe)

Sale konferencyjne, restauracja --- rezerwacje na konkretne godziny.

  ------------------ ----------------------------------------------------
  **Cecha**          **Wartość**

  Jednostka czasu    Godziny (startAt / endAt jako timestamp)

  Dostępność         Zasób zajęty 1:1 w danym przedziale godzinowym

  Timeline           Blokuje konkretne godziny

  Pricing            Cena za godzinę lub za wydarzenie

  Przykłady          Sala konferencyjna, Restauracja (komunie, przyjęcia)

  Capacity           maxCapacity = max osób
  ------------------ ----------------------------------------------------

+-----------------------------------------------------------------------+
| **WAŻNE: Zasoby w ramach TIME_SLOT**                                  |
|                                                                       |
| Różne instancje zasobów w ramach tej samej kategorii (np. sala        |
| konferencyjna, restauracja, sala bankietowa) są reprezentowane jako   |
| osobne rekordy w tabeli Resource. System rozróżnia je wyłącznie po    |
| resourceId, a nie po typie kategorii. Oznacza to, że wiele zasobów    |
| typu TIME_SLOT może działać równolegle, o ile nie są tym samym        |
| Resource.                                                             |
+-----------------------------------------------------------------------+

22.3. QUANTITY_TIME (zasoby ilościowe)

Sprzęt wodny, rowery --- zasoby, których jest wiele sztuk i rezerwuje
się określoną ilość na określone godziny.

  ------------------ ----------------------------------------------------
  **Cecha**          **Wartość**

  Jednostka czasu    Godziny (startAt / endAt jako timestamp)

  Dostępność         NIE blokuje 1:1 --- zmniejsza dostępną ilość

  Timeline           quantityReserved na TimelineEntry

  Pricing            Cena za sztukę za godzinę / za dzień

  Przykłady          Kajak (20 szt.), Rower wodny (10 szt.), SUP (15
                     szt.)

  Quantity           Resource.totalUnits = całkowita ilość (np. 20)
  ------------------ ----------------------------------------------------

22.4. Logika dostępności per typ

**ACCOMMODATION + TIME_SLOT:**

-   Exclusion constraint (btree_gist) na timeline_entries --- zasób
    zajęty 1:1

-   checkAvailability(): szukaj ACTIVE entries z overlapem → jeśli
    znaleziono = konflikt

-   To samo co teraz mamy dla domków

**QUANTITY_TIME:**

-   NIE używamy exclusion constraint

-   Logika aplikacyjna w transakcji:

-   **1.** Znajdź wszystkie TimelineEntry z overlapem czasowym dla
    danego zasobu

-   **2.** Policz SUM(quantityReserved)

-   **3.** Sprawdź: suma + nowa ilość \<= Resource.totalUnits

-   **4.** Jeśli OK → utwórz TimelineEntry z quantityReserved = żądana
    ilość

-   Całość w jednej transakcji DB (zapobiega race conditions)

22.5. Timeline --- jeden backend, wiele widoków

System posiada JEDEN wspólny timeline (TimelineEntry jako source of
truth). Różne widoki to tylko filtrowanie danych:

  -------------- ------------------------- ----------------------------------
  **Widok**      **Filtr**                 **Przykład zapytania**

  Noclegi        category.type =           /api/timeline?type=ACCOMMODATION
                 ACCOMMODATION             

  Sale           category.type = TIME_SLOT /api/timeline?type=TIME_SLOT

  Restauracja    categoryId = konkretny ID /api/timeline?categoryId=xyz

  Sprzęt         category.type =           /api/timeline?type=QUANTITY_TIME
                 QUANTITY_TIME             

  Wszystko       brak filtra               /api/timeline
  -------------- ------------------------- ----------------------------------

+-----------------------------------------------------------------------+
| **ZASADA ARCHITEKTONICZNA**                                           |
|                                                                       |
| 1 backend timeline → wiele logicznych widoków danych. NIE tworzymy    |
| osobnych tabeli/endpointów per typ. Filtrujemy po category.type lub   |
| categoryId.                                                           |
+-----------------------------------------------------------------------+

22.6. Daty i godziny --- jeden format DateTime

Wszystkie pola czasowe w TimelineEntry i ReservationItem używają pełnego
DateTime (timestamp), NIE osobnych typów Date vs DateTime.

  ---------------- --------------------- --------------------- -----------------
  **Typ zasobu**   **startAt**           **endAt**             **Przykład**

  ACCOMMODATION    2026-07-01T15:00:00   2026-07-06T11:00:00   Domek na 5 nocy
                                                               (check-in 15:00,
                                                               check-out 11:00)

  TIME_SLOT        2026-07-02T09:00:00   2026-07-02T17:00:00   Sala 9:00-17:00

  QUANTITY_TIME    2026-07-03T10:00:00   2026-07-03T12:00:00   3 kajaki
                                                               10:00-12:00
  ---------------- --------------------- --------------------- -----------------

+-----------------------------------------------------------------------+
| **ZASADA: Jeden typ danych**                                          |
|                                                                       |
| NIE mieszamy \@db.Date z DateTime. Wszystko to DateTime. Dla          |
| ACCOMMODATION godziny operacyjne (check-in/check-out) są wyliczane z  |
| GlobalSettings lub override per ResourceCategory. Dzięki temu jeden   |
| spójny model obsługuje wszystkie typy zasobów.                        |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
| **ZASADA: Strefy czasowe**                                            |
|                                                                       |
| Składanie daty i godziny do operacyjnych pól                          |
| ReservationItem.startAt/endAt oraz TimelineEntry.startAt/endAt odbywa |
| się w strefie czasowej property (np. Europe/Warsaw). System           |
| przechowuje wynik jako pełny timestamp. Obsługa czasu                 |
| letniego/zimowego (DST) musi być realizowana przez bibliotekę         |
| dat/czasu wspierającą IANA time zones. Logika dostępności, overlapów  |
| i blokowania zasobów operuje na tych timestampach, nie na gołych      |
| datach. Reservation.checkIn/checkOut pozostają ramą biznesową na      |
| poziomie daty.                                                        |
+-----------------------------------------------------------------------+

23\. ReservationItem --- model elementów rezerwacji

ReservationItem zastępuje ReservationResource. Każdy element rezerwacji
to osobny wiersz z własnymi datami/godzinami, ilością i snapshotem ceny.

23.1. Model ReservationItem

  ------------------- ---------------------- ----------------------------------
  **Pole**            **Typ**                **Opis**

  id                  String (cuid)          Klucz główny

  reservationId       String (FK)            Powiązanie z Reservation

  resourceId          String (FK)            Powiązanie z Resource

  categoryType        ResourceCategoryType   ACCOMMODATION / TIME_SLOT /
                                             QUANTITY_TIME

  startAt             DateTime               Początek (data lub timestamp
                                             zależnie od typu)

  endAt               DateTime               Koniec

  quantity            Int (default: 1)       Ilość (dla QUANTITY_TIME, np. 3
                                             kajaki)

  pricePerUnit        Decimal                Cena za jednostkę (LEGACY po C1a)

  totalPrice          Decimal                Wyliczona cena za element (LEGACY
                                             po C1a)

  pricePerUnitMinor / Int                    Kwoty w groszach (source of truth
  totalPriceMinor                            od C1a)

  adults              Int                    Dorośli (dla ACCOMMODATION)

  children            Int                    Dzieci (dla ACCOMMODATION)

  priceSnapshot       Json?                  Zamrożone dane cenowe

  sortOrder           Int                    Kolejność wyświetlania
  ------------------- ---------------------- ----------------------------------

23.2. Reservation.checkIn/checkOut vs ReservationItem.startAt/endAt

Reservation ma własne pola checkIn/checkOut jako RAMA całej rezerwacji:

-   **checkIn** = najwcześniejszy startAt ze wszystkich ReservationItem

-   **checkOut** = najpóźniejszy endAt ze wszystkich ReservationItem

-   Aktualizowane automatycznie przy dodawaniu/usuwaniu itemów

**Przykład rezerwacji pakietowej:**

  ---------------- -------------- -------------- --------------- -----------
  **Element**      **startAt**    **endAt**      **Typ**         **Ilość**

  Domek 3          2026-07-01     2026-07-06     ACCOMMODATION   1

  Sala             2026-07-02     2026-07-02     TIME_SLOT       1
  konferencyjna    09:00          17:00                          

  Kajaki           2026-07-03     2026-07-03     QUANTITY_TIME   5
                   10:00          12:00                          
  ---------------- -------------- -------------- --------------- -----------

Reservation.checkIn = 2026-07-01, Reservation.checkOut = 2026-07-06
(rama całości).

23.3. TimelineEntry per ReservationItem

Każdy ReservationItem generuje własne TimelineEntry:

  ---------------------- ------------------------------------------------
  **Pole TimelineEntry** **Opis**

  reservationId          FK do Reservation (dla grupowania)

  reservationItemId      FK do ReservationItem (dla precyzji)

  resourceId             FK do Resource

  startAt / endAt        Daty/godziny z ReservationItem

  quantityReserved       Ilość (1 dla ACCOMMODATION/TIME_SLOT, N dla
                         QUANTITY_TIME)

  type                   BOOKING / OFFER / BLOCK

  status                 ACTIVE / CANCELLED
  ---------------------- ------------------------------------------------

+-----------------------------------------------------------------------+
| **KLUCZOWA ZASADA**                                                   |
|                                                                       |
| TimelineEntry jest ZAWSZE generowany automatycznie na podstawie       |
| ReservationItem. Nigdy ręcznie. Flow: Reservation → ReservationItem → |
| check availability → create TimelineEntry.                            |
+-----------------------------------------------------------------------+

23.4. Flow tworzenia rezerwacji (API)

Tworzenie rezerwacji odbywa się atomowo --- jeden POST z pełnym
payloadem:

**POST /api/reservations** (jedna transakcja DB):

220. Walidacja inputu (typ, daty, zasoby, klient)

221. Utworzenie Reservation (rama: checkIn/checkOut wyliczone z items)

222. Utworzenie ReservationItem\[\] (każdy element z własnymi datami)

223. Check availability per item (per typ: exclusion vs SUM query)

224. Generowanie TimelineEntry per item

225. Utworzenie BookingDetails / OfferDetails (jeśli dotyczy)

226. Status log

+-----------------------------------------------------------------------+
| **ATOMOWOŚĆ**                                                         |
|                                                                       |
| NIE ma osobnych endpointów do dodawania itemów. Cała rezerwacja (z    |
| wszystkimi elementami) jest tworzona w jednym POST, w jednej          |
| transakcji. Brak stanów pośrednich = brak bugów typu pół rezerwacji.  |
+-----------------------------------------------------------------------+

24\. Multi-property

System jest przygotowany pod obsługę wielu ośrodków (properties) w
jednej instancji panelu.

24.1. Model Property

  -------------- -------------- -----------------------------------------
  **Pole**       **Typ**        **Opis**

  id             String (cuid)  Klucz główny

  name           String         Nazwa ośrodka (np. Zielone Wzgórza)

  address        String?        Adres

  settings       Json?          Ustawienia per ośrodek

  isActive       Boolean        Czy aktywny
  -------------- -------------- -----------------------------------------

24.2. Pole propertyId

Dodawane do następujących modeli:

  ------------------ ----------------------------------------------------
  **Model**          **Powód**

  Resource           Zasób należy do ośrodka

  Reservation        Rezerwacja dotyczy ośrodka

  RatePlan           Plan cenowy per ośrodek

  Season             Sezon per ośrodek

  User               Opcjonalnie --- użytkownik może mieć dostęp do
                     wybranych ośrodków
  ------------------ ----------------------------------------------------

*Na początku istnieje tylko jedna Property (Zielone Wzgórza). Pole
propertyId jest dodane teraz, aby uniknąć refaktoru w przyszłości.
Logika multi-property (filtrowanie, switching) zostanie zaimplementowana
później.*

25\. Panel klienta (ClientAccount)

25.1. Model ClientAccount (auth)

Osobny model 1:1 z Client. Pozwala klientowi logować się do panelu
klienta.

+-----------------------------------------------------------------------+
| **ZMIANA NAZEWNICTWA**                                                |
|                                                                       |
| Poprzedni model ClientAccount (statystyki: totalSpent, totalBookings, |
| loyaltyPoints) zostaje PRZEMIANOWANY na ClientStats. Nowy             |
| ClientAccount to model autoryzacyjny (email, hasło, login).           |
+-----------------------------------------------------------------------+

  -------------------- ------------------ ----------------------------------
  **Pole**             **Typ**            **Opis**

  id                   String (cuid)      Klucz główny

  clientId             String (unique,    Powiązanie z Client
                       FK)                

  email                String (unique)    Login klienta (email)

  passwordHash         String             Zahashowane hasło (bcrypt)

  isActive             Boolean            Czy konto aktywne

  lastLoginAt          DateTime?          Ostatnie logowanie

  emailVerifiedAt      DateTime?          Weryfikacja emaila

  resetPasswordToken   String?            Token resetu hasła
  -------------------- ------------------ ----------------------------------

25.2. Funkcje panelu klienta

227. **Rezerwacje:** lista wszystkich rezerwacji, statusy, daty, zasoby,
     dodatki

228. **Płatności:** historia wpłat, status (PAID/PARTIAL/UNPAID),
     harmonogram rat, zaległości

229. **Akcje:** opłać rezerwację, zaakceptuj ofertę, pobierz faktury

230. **Profil:** edycja danych osobowych, dane do faktury

25.3. Tokeny publiczne

Niezależnie od konta klienta, dostęp do ofert i rezerwacji jest możliwy
przez token:

-   /offer/:token --- widok oferty + akceptacja

-   /reservation/:token --- widok rezerwacji + płatność

*Schema ClientAccount dodawana teraz. Implementacja panelu klienta w
Fazie E.*

26\. System powiadomień (Notifications)

Architektura event-driven: akcja w systemie → event → worker tworzy
Notification → worker wysyła wiadomość.

26.1. Model Notification

  ------------------ --------------------- ----------------------------------
  **Pole**           **Typ**               **Opis**

  id                 String (cuid)         Klucz główny

  type               String (enum)         Typ: PAYMENT_REMINDER,
                                           BOOKING_CONFIRMED, OFFER_EXPIRED,
                                           itp.

  channel            NotificationChannel   EMAIL / SMS / IN_APP

  recipientType      String                CLIENT / ADMIN

  recipientId        String                ID klienta lub użytkownika

  status             NotificationStatus    PENDING / SENT / FAILED

  scheduledAt        DateTime?             Zaplanowany czas wysłania

  sentAt             DateTime?             Faktyczny czas wysłania

  payload            Json                  Dane do wypełnienia szablonu

  retriesCount       Int                   Liczba prób wysłania

  templateId         String?               FK do MessageTemplate
  ------------------ --------------------- ----------------------------------

26.2. Model NotificationEvent

  -------------- -------------- -----------------------------------------
  **Pole**       **Typ**        **Opis**

  id             String (cuid)  Klucz główny

  eventType      String         BOOKING_CREATED, PAYMENT_OVERDUE,
                                OFFER_EXPIRED, itp.

  entityId       String         ID encji (np. reservationId)

  triggeredAt    DateTime       Kiedy zdarzenie wystąpiło
  -------------- -------------- -----------------------------------------

26.3. Kanały

  ----------- ---------------------- -------------------------------------
  **Kanał**   **Odbiorca**           **Status**

  EMAIL       Klient + Admin         Priorytet --- pierwsza implementacja

  IN_APP      Admin (panel)          Powiadomienia w panelu
                                     administracyjnym

  SMS         Klient                 Opcjonalnie --- infrastruktura
                                     przygotowana
  ----------- ---------------------- -------------------------------------

*Schema Notification + NotificationEvent dodawana teraz. Worker/queue
system implementowany później.*

27\. Storage (pliki i media)

27.1. Decyzja architektoniczna (ADR-11, ADR-12) — ✅ B1 wdrożone

Pliki przechowywane w object storage (Cloudflare R2 — produkcja,
LocalMediaStorage — dev/fallback). W bazie danych przechowujemy TYLKO
storageKey (pełny object key). URL NIE jest persystowany — generowany
runtime przez MediaStorageProvider.getPublicUrl(storageKey).

Interfejs MediaStorageProvider:
- save(file, key, mimeType) → void
- delete(key) → void
- getPublicUrl(key) → string (direct public URL z R2 CDN)
- exists(key) → boolean

Implementacje:
- R2StorageProvider (produkcja): Cloudflare R2 public read bucket
- LocalMediaStorage (dev): filesystem + GET /api/public/media/{key}

Config: STORAGE_PROVIDER=r2|local w .env.

Media delivery: frontend pobiera zdjęcia bezpośrednio z R2 URL.
Zero proxy przez VPS (zero obciążenia serwera).

27.2. Modele z plikami

  ------------------ --------------------- ----------------------------------
  **Model**          **Pole klucza**       **Typ pliku**

  ResourceImage      storageKey: String    Zdjęcia zasobów (JPG/PNG/WebP)
                     thumbnailKey: String  + thumbnail (400px)
                     mediumKey: String     + medium (800px)

  Invoice            storageKey: String?   PDF faktury (przyszłość)

  Property           logoKey: String?      Logo ośrodka (przyszłość)

  User               avatar: String?       Awatar (istniejący LocalDisk
                                           pattern w avatar-storage.ts)
  ------------------ --------------------- ----------------------------------

Key format: properties/{propertyId}/resources/{resourceId}/original/{uuid}.ext

27.3. Gwarancje storage

- W DB NIGDY surowy URL — tylko storageKey (object key)
- URL generowany runtime = migracja storage (R2 → inny) bez migracji DB
- Istniejący avatar-storage.ts (User.avatar) zachowuje swój LocalDisk
  pattern — migracja do wspólnego MediaStorageProvider w przyszłości
- Upload: walidacja MIME po magic bytes, max 5MB, EXIF normalizacja
- 3 rozmiary generowane przy uploadzie (sharp): thumbnail, medium, original

28\. Pułapki techniczne (OBOWIĄZKOWA LEKTURA)

Te błędy już wystąpiły w produkcji. Każdy nowy programista (lub nowa
sesja Claude) MUSI je znać zanim zacznie cokolwiek robić.

**28.1. Wersje Prisma i Next.js --- NIGDY bare npx**

Komenda „npx prisma migrate deploy" (bez wersji) ściągnie Prisma 7,
która jest NIEKOMPATYBILNA z naszym schematem (wymaga prisma.config.ts
zamiast url w datasource). ZAWSZE używaj: npx prisma@5.22.0 migrate
deploy. To samo dotyczy innych komend Prisma (db pull, migrate diff).
Komenda „npx next build" (bez wersji) ściągnie Next.js 16 z
Turbopackiem, który nie rozpoznaje naszej struktury. ZAWSZE używaj:
./node_modules/.bin/next build (lokalna wersja 14.2.x). Wersje w
package.json: next@^14.2.0,
\@prisma/client@^5.14.0 (caret ranges). Na serwerze zainstalowane wersje
mogą być wyższe (npm resolve), ale w ramach 14.x / 5.x. NIGDY nie
aktualizuj major versions (next 15+, prisma 6+) bez świadomej decyzji.

**28.2. NIGDY nie pakuj package.json do tar.gz**

Incident z 01.04.2026: paczka tar.gz nadpisała package.json na serwerze
okrojoną wersją (3 deps zamiast \~420). „npm install\" usunęło 421
paczek, next build przestał działać. Naprawione przez wyciągnięcie z
backupu. ZASADA: paczki tar.gz zawierają TYLKO pliki źródłowe (src/,
prisma/schema.prisma, scripts/). NIGDY: package.json, package-lock.json,
node_modules/, .env, .next/. Jeśli trzeba dodać nową zależność: osobna
komenda „npm install X \--save\" na serwerze.

**28.3. Polskie znaki --- encoding check**

Claude czasem generuje polskie znaki jako escapes Unicode (\\u0142
zamiast ł). Po KAŻDYM create_file sprawdzaj: grep -rP
\'\\\\u0\[01\]\[0-9a-f\]{2}\' plik.tsx --- jeśli coś znajdzie, przepisz
plik. Przed pakowaniem tar.gz: uruchom scripts/check-polish.sh. Polskie
znaki zawsze normalne: ą, ę, ó, ś, ł, ż, ź, ć, ń --- nigdy \\uXXXX.

**28.4. TypeScript strict --- Prisma typy**

Prisma Json pola wymagają „as any\" przy zapisie typowanych obiektów
(np. payload as any). Prisma findMany zwraca typy, ale Map/Set z nich
wymaga explicit cast: new Map((rawData as any\[\]).map(\...)). Resource
NIE ma pola isActive --- ma status: ResourceStatus (enum:
ACTIVE/INACTIVE/MAINTENANCE). Zawsze sprawdzaj schemat przed pisaniem
query.

**28.5. Timestamp i strefy czasowe --- NIGDY psql NOW() do porównań z aplikacją**

Prisma przechowuje DateTime jako timestamp(3) without time zone. Aplikacja
(JavaScript) ustawia i porównuje daty w UTC (new Date()). PostgreSQL NOW()
w psql zwraca czas LOKALNY serwera (Europe/Warsaw = UTC+2). Prisma
przy odczycie interpretuje wartość jako UTC.

Efekt: jeśli ustawisz expiresAt = NOW() - interval '1 hour' przez psql
na serwerze w Warsaw, Prisma odczyta to jako UTC i wartość może być
W PRZYSZŁOŚCI (bo 21:30 Warsaw = 21:30 "UTC" z perspektywy Prisma, ale
realny UTC to 19:30).

Zasady:
- expiresAt, createdAt, confirmedAt --- zawsze ustawiaj z poziomu
  aplikacji (new Date()), NIGDY ręcznie przez psql NOW()
- Jeśli MUSISZ ustawić ręcznie w psql, użyj: NOW() AT TIME ZONE 'UTC'
  lub jawny timestamp: '2026-04-03T18:00:00Z'
- Testy przez psql: używaj dużego offsetu (interval '5 hours') aby
  wyeliminować rozbieżność timezone
- Bug znaleziony w testach E2 (03.04.2026) --- kod produkcyjny NIE ma
  tego problemu (JavaScript Date jest spójny z odczytem Prisma)

29\. Struktura plików projektu

Katalog główny na serwerze: /var/www/admin/. Architektura: modular
monolith z domain-based code separation.

prisma/schema.prisma --- JEDYNY plik schematu bazy danych. Wszystkie
modele, enumy, relacje. Źródło prawdy dla DB. src/lib/ --- serwisy i
helpery backendowe: pricing-engine.ts (silnik wyceny),
payment-service.ts (ledger finansowy), timeline-service.ts (dostępność
zasobów), operational-times.ts (godziny check-in/out z DST),
rate-limiter.ts (ochrona API), pricing-service.ts (kalkulacja totali),
reservation-validation.ts (walidacja rezerwacji), api-response.ts
(format odpowiedzi API), api-fetch.ts (frontend fetch helper), format.ts
(formatowanie kwot), dates.ts (daty), crypto.ts (tokeny, hashowanie),
require-auth.ts (RBAC), avatar-storage.ts (upload avatarów), urls.ts
(ENV-driven URL helpers: getAdminUrl, getEngineUrl, getApiUrl,
getFrontUrl).
src/app/api/ --- wszystkie endpointy API (Next.js App Router).
Podkatalogi per domena: reservations/, clients/, resources/, payments/,
users/, settings/, public/ (bez auth). src/app/api/public/ --- endpointy
publiczne (E1 + E2): availability/, quote-preview/, quote/, book/,
resources-catalog/, reservation/[token]/. src/components/
--- komponenty React per moduł: calendar/ (timeline), config/
(ustawienia), settings/ (użytkownicy), payments/ (płatności), clients/
(klienci), booking/ (publiczny widget rezerwacyjny --- E2: BookingWidget,
StepDates, StepResults, StepQuote, StepClient, StepConfirmation),
engine/ (publiczny frontend — offer-view), global-settings/
(ustawienia globalne: email-settings-content, global-settings-layout),
ui/ (wspólne: toast,
bubble-select, bubble-date-picker, bubble-range-picker,
bubble-color-picker, slide-panel, confirm-dialog, skeleton, tooltip).
src/app/admin/ --- strony panelu admina (Next.js pages). Route groups:
(auth) dla login, (panel) dla chronionych stron.
src/app/(engine)/ --- publiczny frontend (route group bez /admin prefix).
engine-root wrapper z dark mode izolacją (bg-background text-foreground
data-theme="light"). booking/ --- widget rezerwacyjny (E2, 5-krokowy
flow). offer/[token] --- strona oferty dla klienta.
reservation/[token] --- publiczna strona rezerwacji (E2, read-only,
dane do przelewu).
scripts/ --- aktywne skrypty: testy (test-critical.sh, test-b1-media.sh,
test-b2-content.sh), narzędzia (rebuild-timeline.ts, check-polish.sh),
maintenance (e1-cleanup-quotes.sql), constraint (add-overlap-constraint.sql).
Jednorazowe migracje SQL przeniesione do scripts/archive/.
docs/ --- dokumentacja: master-plan-v2_3.md (MP, źródło prawdy systemu),
DESIGN_SYSTEM.md (DS v1.3, 27 sekcji, źródło prawdy UI),
TIMELINE_SPEC.md, TIMELINE_TODO.md, UNIFIED_PANEL_SPEC.md,
BOOKING_EDIT_DESIGN.md (wszystkie ze statusem ✅ ZREALIZOWANE),
nginx-engine.conf (konfiguracja referencyjna — aktualna config na VPS).
data/avatars/ --- upload avatarów
użytkowników (LocalDiskStorage, gotowe na S3). data/widget/ --- upload
logo widgetu (pliki logo-{hex}.{ext}, zarządzane przez POST
/api/settings/widget). next.config.js ---
konfiguracja Next.js (basePath USUNIĘTY — routing obsługiwany przez
middleware.ts + nginx). src/middleware.ts --- routing: /admin/* wymaga
auth, /api/public/* i /api/auth/* bez auth, /api/internal/* wymaga
x-cron-secret (E3a), /offer/ /booking/ /pay/ /reservation/ bez auth
(publiczny frontend).

**Znane dead code (niski priorytet, do posprzątania przy okazji):**
- src/lib/navigation.ts — nie importowany nigdzie (sidebar ma własne menu)
- prisma/schema.backup.prisma, prisma/schema.new.prisma — stare kopie schema
- src/components/engine/offer-view.tsx — wywołuje /api/public/offers/:token
  który jeszcze nie istnieje (dead code, endpoint do implementacji
  w przyszłości)

**Posprzątane (kwiecień 2026):**
- ✅ Usunięte: docs/DESIGN_SYSTEM_ADDENDUM_C2.md (duplikat, wciągnięty do DS)
- ✅ Usunięte: docs/SCHEMA_CHANGES_v3.md (przestarzałe instrukcje migracji)
- ✅ Usunięte: 206, seed-categories.js, tailwind.config.ts.bak, *.tar.gz
- ✅ Zarchiwizowane: 8 jednorazowych skryptów SQL → scripts/archive/

30\. Design System --- referencja

Plik: docs/DESIGN_SYSTEM.md (v1.3, ~860 linii, 27 sekcji). Jest to ŹRÓDŁO
PRAWDY dla całego UI panelu. Każdy komponent, kolor, spacing, animacja,
wzorzec --- wszystko jest tam opisane. PRZED tworzeniem jakiegokolwiek
komponentu UI przeczytaj odpowiednią sekcję DS.

Sekcje DS: §1 Fundament (kolory, zmienne CSS), §2 Hierarchia ramek
(border), §3 Typografia, §4 Spacing, §5 Komponenty (btn-bubble,
input-bubble, bubble, slide-panel), §6 Szukajka + filtry, §7 Paginacja,
§8 Responsywność, §9 Animacje, §10 Empty states, §11 Placeholder modułu,
§12 Nawigacja (sidebar), §12.1 Form states, §12.2 Loading pattern, §13
Polskie znaki, §14 Znane rozbieżności, §15 Konwencje kodu, §16 TODO,
§12(bis) Nowe wzorce (Kalendarz), §17 Nagłówki sekcji (icon +
text-\[14px\] font-semibold), §18 Nawigacja wstecz (btn-icon-bubble h-10
w-10), §19 SlidePanel (ZAWSZE renderowany, nigdy &&), §20 Toggle switch
(nigdy native checkbox), §21 bubble-interactive hover (TYLKO
border-color, bez translateY), §22 Avatar upload (rozmiary, overlay,
storage), §23 Confirm Dialog (modal + inline), §24 Godziny operacyjne
(resolving, DST, BubbleSelect), §25 Publiczne API (rate limiter, error
model).

Kluczowe zasady UI (non-negotiable): Wszystkie niebieskie bordy: pełna
intensywność hsl(var(\--primary)), NIGDY z opacity. SlidePanel ZAWSZE
renderowany (nie warunkowo z &&) --- inaczej animacja zamknięcia nie
zagra. Skeletony: natychmiastowe, shimmer only, bez fade-in/stagger.
Search input: paddingLeft: 40 inline (nie \@apply). Każdy moduł ma
dedykowany skeleton.tsx. bubble-interactive:hover zmienia TYLKO
border-color. Status badge: ZAWSZE bg-COLOR/15 (opacity) dla
kompatybilności light/dark mode --- NIGDY bg-emerald-50, bg-amber-50
(stałe jasne tła nie działają w dark mode). Tabele danych: table-bubble
w bubble wrapper, wzorzec z Klientów/Rezerwacji (avatar, badge, akcje).

Żywa referencja: /admin/design-system (6 tabów, realne komponenty,
zasady ZAWSZE/NIGDY, reference boxy z nazwami plików).

31\. Workflow pracy i deployment

**31.1. Deployment na VPS (krok po kroku)**

1\) Claude pakuje pliki do tar.gz (BEZ package.json). 2) Robert pobiera
plik i wgrywa FileZillą (SFTP) na /var/www/admin/. 3) SSH: ssh zw (alias
do VPS 185.25.150.237). 4) cd /var/www/admin && tar xzf paczka.tar.gz.
5) Jeśli zmiana schematu: npx prisma@5.22.0 migrate deploy. 6) Jeśli nowa
zależność: npm install X \--save. 7) Jeśli migracja SQL: psql -U zwadmin
-d zielone_wzgorza_admin -h localhost -f scripts/xxx.sql. 8) Build:
./node_modules/.bin/next build (NIGDY bare npx next build --- patrz 28.1). 9) Restart: pm2 restart zw-admin. 10) Usunięcie paczki: rm
paczka.tar.gz. 11) Git commit: git add -A && git commit -m "[moduł] opis".
12) Zapisz commit hash: git rev-parse --short HEAD > VERSION &&
git add VERSION && git commit --amend --no-edit.
13) Git push: git push origin master (backup na GitHub).
ZAWSZE backup DB przed migracjami: pg_dump -Fc -U zwadmin
-h localhost zielone_wzgorza_admin \> /root/backup-pre-XXX.dump.

**Pełna sekwencja deploy (komendy do kopiowania):**

```
cd /var/www/admin
tar xzf PACZKA.tar.gz
./node_modules/.bin/next build
pm2 restart zw-admin
rm PACZKA.tar.gz
git add -A && git commit -m "[moduł] opis zmiany"
git rev-parse --short HEAD > VERSION
git add VERSION && git commit --amend --no-edit
git push origin master
```

UWAGA: VERSION jest zapisywany PO commit (żeby zawierał hash nowego
commita, nie poprzedniego). --amend dopisuje VERSION do tego samego
commita.

Jeśli zmiana schematu DB — PRZED buildem dodaj:
npx prisma@5.22.0 migrate deploy
Jeśli nowa zależność — PRZED buildem dodaj:
npm install NAZWA --save

**31.1.1. Git — kontrola wersji (od 08.04.2026)**

Repozytorium git zainicjalizowane na serwerze produkcyjnym.
Lokalizacja: /var/www/admin/.git
Pierwszy commit: 4e5ac29 (v2.0, 262 plików, 51666 linii).
Branch: master.

**Zasady codzienne:**
- Po KAŻDYM udanym deployu: git add -A && git commit -m "[moduł] opis"
- .gitignore: node_modules/, .next/, .env, *.tar.gz, data/
- NIGDY deploy z brudnym repo — przed deploy: git status musi być clean.
  Jeśli są niezacommitowane zmiany, najpierw commit albo stash.

**Konwencja commit message:**
Format: [MODUŁ] krótki opis zmiany. Przykłady:
- [payments] add transition lock for confirm
- [timeline] fix rebuild atomicity
- [api] add requestId to error response
- [ops] add health endpoint
- [mp] master plan v2.0 update

**Tagowanie wersji:**
- NIE każdy deploy dostaje tag. Deploy = commit + push.
- Tag tworzony TYLKO przy stabilnych punktach:
  - zamknięcie modułu/warstwy: git tag v2.1.0 -m "Warstwa B zamknięta"
  - safety snapshot przed dużą zmianą: git tag v2.0-pre-catalog
  - bugfix po incydencie: git tag v2.0.1 -m "SMTP fix"
- Semver: vX.0.0 milestone, vX.Y.0 moduł, vX.Y.Z bugfix.
- Lista tagów: git tag -l

**Identyfikacja wersji produkcyjnej:**
Aktualna wersja produkcyjna jest identyfikowana przez ostatni udany
deploy commit w repo /var/www/admin. Jeśli istnieje — przez
odpowiadający mu tag. VERSION jest wskaźnikiem pomocniczym widocznym
w GET /api/health, nie źródłem prawdy. Źródło prawdy = git log -1.

**Diagnostyka:**
- git log --oneline: lista wszystkich deployów z datami
- git log --oneline -10: ostatnie 10 commitów
- git diff: podgląd niezacommitowanych zmian
- git diff HEAD~1: co zmieniło się w ostatnim deployu
- git show <commit>: szczegóły konkretnego commita

**Rollback (awaryjny):**
- Cofnięcie niezacommitowanych zmian: git checkout .
- Cofnięcie do konkretnego commita: git reset --hard <commit>
  (UWAGA: kasuje wszystko po tym commicie — upewnij się że to właściwy)
- Znajdź właściwy commit: git log --oneline, wybierz hash
- Po rollback: ./node_modules/.bin/next build && pm2 restart zw-admin

**Branching (świadoma decyzja):**
- master = produkcja (jedyny branch na tym etapie)
- DECYZJA: przy jednym deweloperze (Claude) i sekwencyjnym workflow
  (tar.gz → deploy → commit) branches nie dają wartości i zwiększają
  ryzyko pomyłki. Gdy dojdzie drugi deweloper → dodajemy dev + feature/*.
- To jest świadoma decyzja architektoniczna, nie przeoczenie.

**Wersjonowanie (semver):**
- vX.0.0 → duży milestone / nowa warstwa (v2.0.0 = Warstwa A)
- vX.Y.0 → nowy moduł w warstwie (v2.1.0 = katalog zasobów)
- vX.Y.Z → bugfix / hotfix (v2.0.1 = naprawa SMTP w health)
- Tagi semver tworzone przy zamknięciu modułu, nie przy każdym deployu.
- Powiązanie z MP: tag = wersja MP (v2.0.0 = MP v2.0).

**Environment / sekrety:**
- .env NIGDY w repo (w .gitignore od pierwszego commita)
- .env.example w repo (template bez wartości)
- Sekrety: SMTP_PASSWORD, CRON_SECRET, JWT_SECRET — tylko na serwerze

Repo zdalne: github.com/Robsiorek/zielone-wzgorza (public).
Po każdym deployu: git push origin master (backup offsite + dostęp
dla Claude w nowych sesjach czatu).

**31.2. ChatGPT jako recenzent architektury**

Każda nowa faza przechodzi przez ChatGPT przed implementacją. Flow: 1)
Claude rozpisuje mapę (scope, pliki, testy, DoD). 2) Robert przekazuje
mapę do ChatGPT. 3) ChatGPT daje korekty (zwykle 4--8 punktów). 4)
Claude odnosi się do korekt. 5) ChatGPT akceptuje → GO. 6) Deploy +
testy. 7) Wyniki testów do ChatGPT. 8) Akceptacja → masterplan update.
Robert przekazuje wiadomości między Claude a ChatGPT dosłownie
(kopiuj-wklej). ChatGPT NIE widzi kodu --- widzi tylko opisy
architektoniczne i wyniki testów.

**31.2.1. Operational Run Cadence (rytm pracy)**

Kiedy co robimy — stały rytm, nie ad-hoc:

- **Po każdym deployu (mała zmiana):** git commit → VERSION → push.
- **Po każdym deployu (duża zmiana / nowy moduł):** NAJPIERW
  test-critical.sh. Jeśli 18/18 PASS → git commit → VERSION → push.
  Jeśli FAIL → napraw → ponowny test → dopiero commit.
- **Przed nową warstwą/modułem:** git tag vX.Y-pre-NAZWA (safety
  snapshot). Spec warstwy → review ChatGPT → akceptacja → implementacja.
- **Po zamknięciu modułu:** testy regresyjne 18/18. Tag vX.Y.0.
  Aktualizacja MP (Current Production State + sekcje modułowe).
  Raport do ChatGPT.
- **Codziennie automatycznie:** backup DB (cron 3:00), reminder cron
  (9:00 + heartbeat).
- **Kiedy MP jest aktualizowany:** przy każdym zamkniętym module,
  przy zmianach architektonicznych, przy nowych decyzjach ADR.
  NIE przy drobnych bugfixach.
- **Deploy dozwolony gdy:** git status clean, build przechodzi,
  test-critical.sh PASS (po dużych zmianach).

**31.3. Routing i basePath — ZREALIZOWANY REFAKTOR**

basePath: '/admin' został USUNIĘTY z next.config.js. Routing jest teraz
obsługiwany przez middleware.ts + nginx.

**Middleware (src/middleware.ts):**
- Ingress layer: generuje/waliduje X-Request-Id na KAŻDYM request
  (UUID v4, propagacja do route handlers i response header)
- /admin/* — wymaga auth cookie (zw_admin_token), brak → redirect do /admin/login
- /api/public/*, /api/auth/*, /api/health — bez autoryzacji (publiczne)
- /api/internal/* — wymaga x-cron-secret header (cron jobs)
- /api/* (reszta) — wymaga auth cookie, brak → 401
- /offer/*, /booking/*, /pay/* — bez auth (publiczny frontend klienta)
- /_next/*, favicon, pliki statyczne — passthrough

**App access layer (src/lib/request-context.ts):**
- getRequestId() — odczytuje z Next.js headers()
- getRequestIdFromRequest(request) — z NextRequest
- logRequestStart() / logRequestEnd() — strukturalne logi z rid, method, path, status, duration

**Route groups w Next.js App Router:**
- src/app/admin/(auth)/ — strona logowania (/admin/login)
- src/app/admin/(panel)/ — chronione strony panelu (/admin/dashboard, /admin/calendar, etc.)
- src/app/(engine)/ — publiczny frontend (/offer/[token])

**URL helpers (src/lib/urls.ts):**
ENV-driven URL building z 4 helperami: getAdminUrl(path),
getEngineUrl(path), getApiUrl(path), getFrontUrl(path). Konfiguracja
przez zmienne env: NEXT_PUBLIC_ADMIN_BASE_URL,
NEXT_PUBLIC_ENGINE_BASE_URL, NEXT_PUBLIC_API_BASE_URL,
NEXT_PUBLIC_FRONT_BASE_URL.

**Nginx na VPS:**
Nginx proxyuje: /admin/ → localhost:3000/admin/, /offer/ →
localhost:3000/offer/, /_next/ → localhost:3000/_next/, /api/ →
localhost:3000/api/. docs/nginx-engine.conf w repo jest konfiguracją
referencyjną — aktualna produkcyjna konfiguracja jest bezpośrednio
na VPS w /etc/nginx/sites-available/.

**Konsekwencje dla developmentu:**
- Sidebar używa pełnych ścieżek: /admin/dashboard, /admin/calendar etc.
- Publiczne API: /api/public/* (bez /admin prefix)
- Publiczny frontend: /offer/:token (bez /admin prefix)
- apiFetch() w komponentach: używa relative paths (/api/...)

**31.4. Dane dostępowe**

VPS: 185.25.150.237 (cyber_Folks, vroot_RUN, Ubuntu 24.04). SSH alias:
ssh zw. Panel admin: http://185.25.150.237:3000/admin/login. Login
testowy: admin@zielonewzgorza.eu / Admin123!. Baza: PostgreSQL, nazwa:
zielone_wzgorza_admin, user: zwadmin, host: localhost:5432. PM2 process
name: zw-admin (NIGDY „admin"). Domena dev: dev.zielonewzgorza.eu
(wskazuje Hetzner, serwer deweloperski). Domena prod: zielonewzgorza.eu
(WordPress na home.pl, panel admin na VPS). Backupy DB:
/root/backup-\*.dump. Publiczne API: /api/public/* (bez /admin prefix,
bez auth). Publiczny frontend klienta: /offer/:token (bez /admin prefix).

32\. Aktualny stan systemu (kwiecień 2026)

**Zrealizowane fazy:**

FAZA A ✅ 28.03 --- Statusy + Zameldowanie + Timeline + Slide Panel.
FAZA B ✅ 28.03 --- Dodatki + Konwersja blokady + Przebudowa edycji. C1a
✅ 29.03 --- Minor units migration (wszystkie kwoty w groszach). C1b ✅
29.03 --- Payment ledger (immutable, CONFIRMED-only, FOR UPDATE lock).
C2 ✅ 30.03 --- Payment UI (3-level SlidePanel stack, PaymentForm,
PaymentList). D0 ✅ 30.03 --- Users + Roles (OWNER/MANAGER/RECEPTION) +
RBAC + Settings + Avatar upload + Config UI. D 159-162 ✅ 01.04 ---
Godziny operacyjne per kategoria (DST-safe via date-fns-tz). S2b ✅
01.04 --- Drop legacy Payment columns (type, status, transactionId,
paidAt + 2 enumy). E1 ✅ 02.04 --- Availability + Quote API (pricing
engine, rate limiter, Quote model). basePath refaktor ✅ --- usunięcie
basePath: '/admin' z next.config.js, middleware.ts obsługuje routing,
urls.ts ENV-driven URL helpers, route group (engine) dla publicznego
frontendu. E2 ✅ 03.04 --- Widget rezerwacyjny (publiczny booking engine
pod /booking, 5-krokowy flow, POST /api/public/book z 13-krokową
transakcją, FOR UPDATE lock na Quote, instant block, idempotency guard,
strona /reservation/[token], visibleInWidget na Resource, consent RODO,
rate limiter hotfix). Szczegóły implementacji: patrz E2 poniżej.
E2-UI ✅ 04.04 --- System wyglądu widgetu (WidgetConfig: 10 tokenów
kolorów + logo upload SVG/PNG/WebP + font Google Fonts + presety
rozmiaru logo, BubbleColorPicker i BubbleRangePicker DS komponenty,
dark mode izolacja engine-root, BookingSkeleton per-step, szerokość
max-w-4xl, stepper w content area, zero shadows).
E3a ✅ 06.04 --- System e-mail core (SMTP Nodemailer, EmailLog z
enumami, email-renderer z escaped/trusted placeholderami, 5 szablonów
HTML, booking confirmation po book, auto email po confirm/cancel,
test email, SMTP connection test, CompanySettings bank/sender/reminder,
BookingDetails reminder tracking, nawigacja global-settings z
Wygląd widżetu + Powiadomienia e-mail, panel diagnostyczny SMTP,
DS §25 collapsible SectionCard z animacją CSS Grid w całym panelu).

**Kolejność realizacji (zaktualizowana 08.04.2026):**

Fazy A–E1 ✅ → S3 ✅ → S3.1 ✅ → OPS ✅ → dalsze warstwy produktu.

Szczegółowa mapa warstw i kolejność: patrz §17.2.

**═══ S3 — Bramka release'owa — ZAMKNIĘTA ✅ 07.04.2026 ═══**

S3 = twarda bramka techniczna. 12/12 exit criteria zaliczone.
Kluczowe: Prisma baseline migration, migrate deploy, backup cron
(3:00 + rotacja 7d), testy integracyjne T1-T19, security checklist,
czyszczenie danych testowych. Prisma db push zastąpione przez
migrate deploy (patrz §33.4 — decyzja historyczna).

**═══ S3.1 — Concurrency & Consistency Hardening — ZAMKNIĘTE ✅ 08.04.2026 ═══**

Problemy przed S3.1: brak exclusion constraint w produkcji, brak
wspólnego mechanizmu transition, confirm/cancel bez FOR UPDATE lock,
payment confirm read przed lockiem. Wdrożone: reservation-transition.ts,
payment-transition.ts, exclusion constraint, check-in jako operacja
domenowa, restore→PENDING, NO_SHOW odwracalny. Testy C1-C5: 5/5 PASS.
Integrity: 0 orphanów, 0 overlapów. Od S3.1 obowiązują System
Guarantees z §2.2.1.

**═══ OPS — Mechanizmy operacyjne — ZAMKNIĘTE ✅ 08.04.2026 ═══**

Trzy mechanizmy operacyjne wdrożone po S3.1, per spec zaakceptowany
przez ChatGPT:

1. requestId middleware — UUID na każdy request (ingress: middleware.ts,
   app access: request-context.ts). X-Request-Id w response header,
   requestId w error body, start+end log z duration.
2. GET /api/health — DB ping + SMTP verify (cached 5min TTL) + cron
   heartbeat. Status: healthy/degraded/unhealthy. Publiczny: minimal.
   Admin+detail: pełna diagnostyka.
3. Timeline rebuild CLI — scripts/rebuild-timeline.ts. Dry-run domyślny,
   --apply jawny. Atomic (albo wszystko albo nic). ACTIVE state only.
   Audit log do DB.

Pliki OPS (7): src/lib/request-context.ts, src/middleware.ts (update),
src/lib/api-response.ts (update), src/app/api/health/route.ts,
src/app/api/internal/email/reminders/route.ts (heartbeat update),
scripts/rebuild-timeline.ts, scripts/test-critical.sh.

Smoke testy: 5/5 PASS (requestId header, health public, health admin
detail, cron heartbeat, rebuild dry-run).

**═══ PRODUCT ROADMAP — Docelowy plan budowy produktu ═══**

Ten system NIE jest budowany jako MVP pod szybki start. Jest budowany
jako docelowy produkt klasy iDoBooking / ProfitRoom — krok po kroku,
bez presji czasu, z pełną kontrolą architektury.

GO-LIVE jest ostatnim etapem, po przejściu przez wszystkie kluczowe
warstwy systemu i testy wewnętrzne. Każda decyzja jest docelowa,
skalowalna, zgodna z architekturą. Zero „na szybko, potem przepiszemy."

17.2. Warstwy produktu

System jest podzielony na 5 warstw architektonicznych. Każda warstwa
buduje na poprzedniej. Kolejność jest architektonicznie uzasadniona.

**WARSTWA A: Core booking engine**
Status: ✅ ZREALIZOWANA (fazy A–E1, S3, S3.1, OPS)

Fundament systemu — rezerwacje, dostępność, płatności, email, timeline.
Bez tej warstwy nic innego nie może istnieć.

Zrealizowane moduły:
- Zasoby i kategorie (CRUD, 3 typy: ACCOMMODATION/TIME_SLOT/QUANTITY_TIME, warianty cenowe)
- Kalendarz i timeline (unified Reservation, TimelineEntry = source of truth)
- System cenowy (sezony, plany cenowe, kody rabatowe, PriceEntry per-day)
- Silnik rezerwacyjny (quote → book, availability, pricing engine)
- Klienci (CRUD, segmenty, tagi)
- Płatności (immutable ledger, RBAC, deposit, projekcje)
- Email (szablony HTML, przypomnienia cron, logi)
- Widget publiczny (pełny flow: wybór → wycena → dane → rezerwacja)
- Users/RBAC (OWNER/MANAGER/RECEPTION, avatar, config)
- Godziny operacyjne (DST-safe, per kategoria)
- Publiczne API (availability, quote-preview, quote)
- Concurrency hardening (transition services, exclusion constraint, C1-C5)
- Mechanizmy operacyjne (requestId, health, timeline rebuild)

**WARSTWA B: Katalog zasobów (zdjęcia, opisy, udogodnienia)**
Status: B0 ✅ KONTRAKT ZAAKCEPTOWANY (09.04.2026) — B1 do implementacji

Cel: zasoby przestają być „technicznym ID" i stają się pełnymi kartami
produktowymi — ze zdjęciami, opisami, udogodnieniami, regulaminem.
Widget i przyszła strona korzystają z tych danych. Klient widzi domek
jak na Booking.com, nie jak w Excelu.

Zależności: Resource model (A), Widget (A), CompanySettings (A).
Czego nie wolno robić: dynamic pricing, opinie, ulubione, kalendarz
z cenami, zmiany w quote→book flow, zmiany w transition services.

**B0 — Kontrakt architektoniczny (zaakceptowany przez ChatGPT):**

B0.1 — Storage: MediaStorageProvider interface (save/delete/getPublicUrl/
exists). Produkcja: Cloudflare R2 (public read bucket). Dev: LocalMedia
Storage + streaming endpoint. Config: STORAGE_PROVIDER=r2|local.
W DB: storageKey (pełny object key), NIE url. URL generowany runtime.
Key format: properties/{propId}/resources/{resId}/original/{uuid}.webp.

B0.2 — Media delivery: Direct R2 public URL (nie proxy przez VPS).
getPublicUrl(key) → https://{R2_PUBLIC_DOMAIN}/{key}. Dev fallback:
GET /api/public/media/{key}.

B0.3 — Content model: CompanySettings = ustawienia techniczne systemu.
PropertyContent (z propertyId) = treści katalogowe (zasady pobytu,
ważne informacje). FaqItem (z propertyId) = FAQ. PropertyTrustBadge
(z propertyId, zamknięta lista badgeKey) = ikony zaufania.

B0.4 — Public API: rozszerzenie GET /api/public/resources-catalog
(images, shortDescription, beds, areaSqm, bedroomCount, bathroomCount).
Katalog NIE zwraca longDescription. ✅ B1/B2 wdrożone.
Nowy GET /api/public/resources/{id} (pełne dane incl. longDescription).
✅ B2 backend wdrożony, UI w B5.

B0.5 — DB constraints: @@unique([resourceId, position]) na images,
@@unique([propertyId, position]) na FAQ, @unique storageKey, partial
unique index na isCover=true (raw SQL migration), max 20 images
i max 50 FAQ (application validation), MIME validation po magic bytes.

B0.6 — Typed vocabularies: badgeKey i iconKey to app-enforced typed
vocabularies (source of truth w kodzie, runtime validation, versioned).

**Kolejność implementacji Warstwy B:**

B0 ✅ Kontrakt architektoniczny (zaakceptowany 09.04.2026)
B1 ✅ Media: storage abstraction + upload + processing + API (wdrożone 10.04.2026)
B2 ✅ Resource content: opisy, dane techniczne, łóżka, ADR-14 rename (wdrożone 11.04.2026)
B3 🔵 Amenities: model, seed 50-60 ikon, panel admin
B4 🔵 Property content: zasady, FAQ, info, trust badges
B5 🔵 Widget: detail page + karty ze swipe zdjęć

**B1 — Media Storage (✅ wdrożone)**

Architektura: wzorzec Provider z interfejsem MediaStorageProvider
(save, delete, getPublicUrl, exists). Dwie implementacje:
R2StorageProvider (Cloudflare R2, produkcja) i LocalMediaStorage
(filesystem, dev). Wybór przez env STORAGE_PROVIDER (r2|local).
Przełączenie na R2 = konfiguracja env, zero zmian kodu.
Aktualnie: STORAGE_PROVIDER=local, LOCAL_MEDIA_DIR=data/media.

Przetwarzanie obrazów: walidacja MIME po magic bytes (JPEG/PNG/WebP),
normalizacja EXIF, konwersja do WebP, 3 rozmiary (thumbnail 400px,
medium 800px, original 1600px). SHA-256 checksum. Max upload: 5MB.
Max 20 zdjęć per zasób. Zależność: sharp@0.34.5.

URL runtime: storageKey w DB, URL generowany runtime przez provider
(ADR-11). Nigdy nie persystowany.

Kontrakt kompensacyjny: Upload = storage → DB (cleanup storage jeśli
DB fail). Delete = DB first → storage after commit. Side effects
NIGDY wewnątrz transakcji DB.

Reorder: two-phase — offset do negatywnych → target positions.
Omija unique constraint na [resourceId, position].

Cover: partial unique index w raw SQL (WHERE isCover = true).
Max 1 okładka per zasób. Frontend widgetu powinien docelowo
preferować isCover=true, fallback: position ASC.

Admin UI: ImageUpload komponent — drag & drop upload, podgląd
thumbnails w gridzie, drag & drop reorder, ustawienie okładki,
edycja alt text, usuwanie.

Pliki: src/lib/storage/ (media-storage.ts, r2-storage.ts,
local-storage.ts, image-processor.ts, image-urls.ts),
src/app/api/resources/[id]/images/ (route.ts, [imageId]/route.ts,
reorder/route.ts), src/app/api/public/media/[...key]/route.ts,
src/components/resources/image-upload.tsx.

**B2 — Resource Content (✅ wdrożone)**

ADR-14: Ujednolicenie nazw pól Resource. Rename 3 kolumn DB:
shortDesc → shortDescription, description → longDescription,
area (Decimal) → areaSqm (Int). Wykonane atomowo w B2 zanim
dane i integracje się rozrosną.

Nowe pola Resource: shortDescription (String?, max 200, plain text),
longDescription (String?, max 10000, Markdown), areaSqm (Int?, 1-9999),
bedroomCount (Int?, 0-50), bathroomCount (Int?, 0-50).

ResourceBed: nowy model. bedType (String, typed vocabulary),
quantity (Int, 1-20). @@unique([resourceId, bedType]). CASCADE
on delete. Max 10 typów per zasób.

BED_TYPES typed vocabulary: source of truth w kodzie
(src/lib/bed-types.ts). 7 typów: SINGLE, DOUBLE, QUEEN, KING,
BUNK, SOFA_BED, BABY_COT. Runtime walidacja isValidBedType().
Dodanie typu = zmiana kodu, nie migracja. Pattern z B0.6.

Beds replace: PUT /api/resources/[id]/beds — full replace pattern
(deleteMany + createMany w transakcji, pattern z §2.6).

PATCH zamiast PUT: PATCH /api/resources/[id] — partial update,
zgodny z kontraktem MP.

Public detail: GET /api/public/resources/[id] — backend gotowy
(B2), UI w B5. Zwraca longDescription, images, beds, variants,
amenities. Rate limited.

Kontrakt katalogu: resources-catalog zwraca pola listingowe
(shortDescription, areaSqm, bedroomCount, bathroomCount, beds).
NIE zwraca longDescription — to pole jest tylko w detail endpoint.

Pliki: src/lib/bed-types.ts, src/app/api/resources/[id]/beds/route.ts,
src/app/api/public/resources/[id]/route.ts.

Migracje: 20260409120000_b1_resource_images,
20260410120000_b2_resource_content.

**B2 — Panel zasobu — docelowy wzorzec admin UI**

Panel zasobu (SlidePanel "Właściwości zasobu") nie ma osobnego
trybu edycji. panelMode: "create" | "view" — dwa tryby zamiast
trzech. Create = prosty formularz (nazwa + kategoria). View = panel
z rozwijalnymi sekcjami SectionCard, każda edytowalna inline.

Hero zasobu: bez bordera. Tytuł zasobu (h2, bold) z UnitBadge.
Badges statusu i widoczności widgetu (niebieski gdy widoczny,
czerwony "Niewidoczny w widgecie" gdy wyłączony). Grid 2×2 stats
(pojemność, metraż, sypialnie, łazienki) z ikonami.

6 sekcji SectionCard (wszystkie domyślnie zwinięte):
1. Ustawienia zasobu — nazwa, kategoria, numer, sztuk, lokalizacja,
   status, widoczność → PATCH /resources/[id]
2. Treści — krótki opis (200 zn.), pełny opis (Markdown, 10000 zn.)
   → PATCH /resources/[id]
3. Dane techniczne — metraż, pojemność, sypialnie, łazienki
   → PATCH /resources/[id]
4. Łóżka — BubbleSelect typ + ilość, full replace
   → PUT /resources/[id]/beds
5. Zdjęcia — upload, reorder, cover, alt → images endpoints
6. Warianty sprzedażowe — CRUD → variants endpoints

Izolacja stref zapisu: każda sekcja ma własny lokalny state, własny
przycisk save, własny toast. Żadna sekcja nie nadpisuje pól innej.
Przycisk "Dodaj wariant" wewnątrz sekcji (nie na belce accordion).
Edytowany wariant ukryty z listy (brak iluzji duplikatu).

**Definition of Done Warstwy B:**
1. ✅ Storage abstraction z R2 jako produkcyjnym targetem
2. ✅ Upload zdjęć z panelu (do 20, drag&drop, reorder, cover, 3 rozmiary)
3. ✅ MIME po sygnaturze, EXIF normalizacja, DB constraints
4. 🔵 Karta zasobu w widgecie: swipe zdjęć, krótki opis, dane techniczne
5. 🔵 Detail page: galeria, Markdown opisy, amenities, zasady, FAQ, addons read-only
6. 🔵 Wszystkie treści property-scoped (propertyId)
7. ✅ Public API rozszerza istniejący resources-catalog
8. ✅ Markdown jako jedyny format treści
9. Partial: 18/18 core + 6/6 B1 + 7/7 B2 = 31 PASS. Docelowo: + B3-B5 testy.
10. 🔵 Mobile responsive (B5)
11. ✅ Prisma migration + raw SQL partial unique index
12. ✅ Git commit + push (B1, B2)

**WARSTWA C: Operacyjność obiektu**
Status: ZAPLANOWANA

Cel: system wspiera codzienną pracę ośrodka — nie tylko rezerwacje,
ale też obsługę fizyczną obiektu.

Moduły:
- Statusy sprzątania per zasób (DIRTY/CLEANING/READY)
- Check-out workflow (auto FINISHED + trigger sprzątania)
- Notatki operacyjne per rezerwacja (widoczne dla personelu)
- Dashboard operacyjny (dzisiejsze przyjazdy, wyjazdy, sprzątanie)
- Rozszerzone role operacyjne (np. HOUSEKEEPER — widzi tylko sprzątanie)

Dlaczego po Warstwie B: wymaga pełnych kart zasobów. Dashboard
potrzebuje wizualnych danych z katalogu.
Zależności: Resource catalog (B), RBAC (A).

**WARSTWA D: Reguły biznesowe i revenue**
Status: ZAPLANOWANA

Cel: zaawansowane reguły cenowe, restrykcje, pakiety — narzędzia
do maksymalizacji przychodu.

Moduły:
- Restrykcje rezerwacji (min/max nocy, zamknięte dni, gap rules)
- Pakiety pobytowe (domki + wyżywienie + sala + sprzęt wodny)
- Dynamic pricing (weekendy, last-minute, early-bird)
- Przelewy24 / online payments (E4 — webhook idempotency)
- Automatyczne wyceny pakietów zorganizowanych
- Promocje sezonowe (rozszerzenie promo_codes)

Dlaczego po Warstwie C: pakiety wymagają operacyjności (sprzątanie
między grupami). Dynamic pricing wymaga stabilnego katalogu (B).
Online payments wymagają webhook idempotency — twardy kontrakt
musi być zamknięty przed podłączeniem real money flow.
Zależności: Katalog (B), Operacyjność (C), Webhook idempotency.

**WARSTWA E: Integracje i skalowanie**
Status: ZAPLANOWANA (długoterminowa)

Cel: system komunikuje się ze światem zewnętrznym i obsługuje
wiele kanałów sprzedaży.

Moduły:
- Channel manager (Booking.com, ical sync)
- Panel klienta (konto klienta, historia, dopłaty)
- Opinie i recenzje (po pobycie, integracja z Google)
- Raporty i analityka (obłożenie, przychód, sezonowość)
- Dokumenty (faktury, potwierdzenia PDF)
- CRM rozszerzony (segmentacja, kampanie, retention)
- Multi-property (wiele ośrodków na jednym panelu)
- Observability produkcyjne (structured logs, Sentry, alerting)

Dlaczego ostatnia: integracje wymagają stabilnego core (A),
pełnego katalogu (B), operacyjności (C) i reguł biznesowych (D).
Channel manager bez dynamic pricing = utrata revenue.
Multi-property wymaga dojrzałego single-property.

17.3. Kolejność budowy (zatwierdzona)

  ---- -------- ---------------------------------- ---------------------
  **#** **Warstwa** **Zakres**                      **Zależności**

  1    A ✅     Core booking engine                 —
  2    B        Katalog zasobów                     A (zasoby, widget)
  3    C        Operacyjność obiektu                A + B
  4    D        Reguły biznesowe i revenue          A + B + C
  5    E        Integracje i skalowanie             A + B + C + D
  ---- -------- ---------------------------------- ---------------------

Każda warstwa jest budowana modułami. Każdy moduł przechodzi przez
pełny cykl: spec → review ChatGPT → implementacja → testy → MP update.

17.4. Definicja zamknięcia modułu (Definition of Done)

Moduł jest „gotowy" gdy spełnia WSZYSTKIE poniższe kryteria:

1. Spec zaakceptowany przez ChatGPT przed implementacją
2. Implementacja zgodna ze specem (zero odstępstw bez akceptacji)
3. TypeScript strict — brak @ts-ignore, brak as any w krytycznych
   ścieżkach. Prisma/Json wymagają jawnego typu lub runtime guardu.
4. Testy manualne przechodzą (scenariusze happy path + edge cases)
5. Smoke test na produkcji po deploy
6. Master Plan zaktualizowany (sekcje odpowiadające modułowi)
7. Brak regresji w istniejących modułach (integrity check)
8. Design System zaktualizowany (jeśli nowe komponenty UI)
9. Git po deployu (3 komendy — obowiązkowe, w tej kolejności):
   git rev-parse --short HEAD > VERSION
   git add -A && git commit -m "[moduł] opis"
   git push origin master

17.5. Faza testów wewnętrznych (przed GO-LIVE)

Przed wpuszczeniem realnych klientów system przechodzi przez fazę
testów wewnętrznych:

1. Testy scenariuszowe — Robert + brat symulują pełne flow:
   rezerwacja → wpłata → potwierdzenie → zameldowanie → wymeldowanie
2. Testy z znajomymi — 5-10 osób robi rezerwacje przez widget jak
   prawdziwi klienci. Feedback zbierany.
3. Testy obciążeniowe — równoległe rezerwacje, szybkie klikanie,
   przerwane połączenia.
4. Testy email — wszystkie szablony z realnymi danymi, mobilne klienty.
5. Testy integracyjne — widget na WordPressie, mobile, CSP, cookies.
6. Review wyników — ChatGPT ocenia wyniki, wskazuje luki.

Klasy błędów do wyłapania:
- Double-booking (nie powinno być możliwe po S3.1)
- Brak emaila (fire-and-forget — akceptowalne, ale monitorowane)
- Niespójność timeline (rebuild command jako safety net)
- UX problemy widgetu (responsywność, mobile, ładowanie)
- Edge cases cenowe (sezony, promo codes, warianty)

17.6. GO-LIVE jako etap końcowy

GO-LIVE NIE jest celem krótkoterminowym. Jest ostatnim etapem po:
1. Zamknięciu Warstw A–D (minimum)
2. Przejściu fazy testów wewnętrznych
3. Konfiguracji biznesowej (sezony, ceny, SMTP, widget embed)

GO-LIVE readiness checklist (do wykonania tuż przed uruchomieniem):

| # | Kryterium                                    | Status |
|---|----------------------------------------------|--------|
| 1 | Sezony i ceny ustawione na realne daty/kwoty |        |
| 2 | visibleInWidget ustawione na właściwych zasobach |    |
| 3 | Dane banku/IBAN/sender zweryfikowane         |        |
| 4 | checkIn/checkOut times finalne                |        |
| 5 | Deposit % finalny                            |        |
| 6 | reminderEnabled + reminderDays + maxReminders |       |
| 7 | Widget osadzony na zielonewzgorza.eu         |        |
| 8 | Test pełnego flow rezerwacji z realnym emailem|        |
| 9 | SMTP credentials produkcyjne                 |        |
| 10| Faza testów wewnętrznych zamknięta            |        |
| 11| Webhook idempotency zamknięty (jeśli E4)     |        |

**E4 --- Przelewy24 (online payments + webhook).** Klient płaci
zaliczkę online przy rezerwacji. Webhook potwierdza → auto CONFIRMED.
Wymaga produkcyjnej dyscypliny (S3 musi być zamknięte).

**E2b --- Konto klienta.** Logowanie kodem mailowym bez hasła: email →
6-cyfrowy kod/magic link → sesja klienta (osobny JWT od admina), lista
rezerwacji po email match. Wymaga działającego E3 (wysyłka kodu).

**Dalsze moduły (bez ustalonej kolejności):**
C3 --- Karta rezerwacji (pełna podstrona z historią finansową) ---
ODŁOŻONE, slide panel wystarczy. Moduł 7: Komunikacja (event bus).
Moduł 8: Widget rozszerzony (sala, kajaki, restauracja --- osobne flow
per categoryType). Moduł 9: CRM zaawansowany. Moduł 10: Dokumenty.
Moduł 11: Raporty. Frontend rozbudowa: galeria zdjęć per zasób,
udogodnienia (model Amenity + ikony), rozszerzone opisy, strona
główna /booking jako centrum ofert, filtrowanie, mapa ośrodka.

**Istniejące dane w produkcji (stan na 07.04.2026, po S3):**

BAZA WYCZYSZCZONA (S3 krok 10). Zero rezerwacji, klientów, płatności,
logów email, timeline entries. Sekwencje numerów NIE zresetowane
(pierwsza nowa rezerwacja będzie kontynuować numerację).

Zachowane: 17 zasobów (10 domków + 4 pokoje + 1 sala + 1 restauracja
+ 1 kajak). 17 domyślnych wariantów (1 per zasób). 5 kategorii
(Domki, Pokoje, Sale, Restauracja, Kajaki). Sezony skonfigurowane
(do finalizacji przed GO-LIVE). 1 domyślny RatePlan (isDefault=true).
1 użytkownik admin (admin@zielonewzgorza.eu). CompanySettings:
checkInTime=16:00, checkOutTime=11:00, requiredDepositPercent=30,
senderEmail=system@zielonewzgorza.eu, senderName=Zielone Wzgórza,
bankAccountName=Grupa Truszkowscy sp. z o.o., bankAccountIban=89 1090
1102 0000 0001 5948 7356, bankName=Santander Bank Polska. Resource:
visibleInWidget (Boolean). WidgetConfig: singleton z 10 tokenami
kolorów, logo, font. EmailTemplate: brak (domyślne z kodu).

Infrastruktura: Prisma na migracjach (baseline 20260407000000_init).
Cron: reminders 9:00 + backup 3:00 (rotacja 7 dni). .pgpass
skonfigurowany. SMTP aktywny (EMAIL_DRY_RUN=false). CRON_SECRET
wygenerowany (openssl rand -hex 32). Design System: /admin/design-system.

**Dług techniczny i bramki produkcyjne (recenzja ChatGPT, 03.04.2026):**

Poniższe punkty wynikają z recenzji architektonicznej Claude ↔ ChatGPT.
Są to świadome trade-offy, NIE błędy. Każdy ma określony moment wdrożenia.

1\) **ZAMKNIĘTE (S3 ✅): Prisma db push → migrate deploy.** Do S3
używaliśmy `npx prisma@5.22.0 db push` (brak historii migracji, brak
rollback). Od zamknięcia S3 (07.04.2026) system działa na `prisma
migrate deploy`. Procedura baseline: mkdir migrations folder →
`migrate diff --from-empty` → `migrate resolve --applied`. Produkcja
i testy na kopii przeszły pomyślnie. Zmiana deploy: krok 5 runbooka
zmieniony z `db push` na `migrate deploy`.

2\) **Cron sanity check: Timeline vs Reservation.** TimelineEntry jest
generowany automatycznie z ReservationItem (w jednej transakcji DB z
exclusion constraint). Desync jest teoretycznie niemożliwy, ale sanity
check raz dziennie to tani mechanizm kontrolny. Skrypt: porównaj aktywne
ReservationItems (status PENDING/CONFIRMED) z istniejącymi
TimelineEntries. Brakujący entry = alarm. Priorytet: ŚREDNI. Kiedy:
backlog, przed go-live lub zaraz po.

3\) **Decyzja architektoniczna: callback pattern → event bus.** E3a
zaimplementowała callback pattern: emailService.sendBookingConfirmation()
wywoływany po transakcji book, emailService.sendStatusChange() po
confirm/cancel. Osobny serwis (email-service.ts), fire-and-forget,
zero side effectów w route handlerach. Przy module 7 (Komunikacja)
rozważymy pełny event bus (EventEmitter / queue). Priorytet: ŚREDNI.
Kiedy: Moduł 7.

4\) **Deploy improvement.** Obecny deploy (FileZilla → tar.gz → SSH →
build → restart) działa bezawaryjnie od 6 tygodni (~30 deployów). Jest
prosty i zrozumiały dla operatora nietechnicznego. Docelowo (gdy dołączy
drugi programista lub deploy stanie się bottleneckiem): Git na serwerze +
skrypt `git pull && build && restart`. CI/CD (GitHub Actions) — tylko
jeśli pojawi się potrzeba. Priorytet: NISKI. Kiedy: gdy dołączy drugi
dev.

**Uwagi odrzucone (z uzasadnieniem):**

- **OFFER blokujący zasób** — poprawne dla modelu biznesowego (mały
  ośrodek, ręczna sprzedaż, oferty z expiresAt + auto-cancel). Nie
  wymaga soft hold.
- **Wersjonowanie API (/v1/)** — jedyni konsumenci to własny frontend.
  Wdrożyć dopiero przy Channel Manager (external consumers).
- **Rozbicie modular monolith na mikroserwisy** — na tym scale (10-14
  zasobów, 1 VPS, 1 proces) nie ma bottlenecku. Architektura (domain
  separation, osobne serwisy w src/lib/) jest już przygotowana na
  ewentualne rozbicie.

33\. Decyzje architektoniczne (WHY)

Sekcja dokumentuje DLACZEGO podjęto kluczowe decyzje architektoniczne.
Każda decyzja opisuje: kontekst, alternatywy rozważane, powód wyboru i
konsekwencje. Jest to wiedza, która ginie gdy sesja Claude się kończy ---
musi być zapisana czarno na białym.

33.1. Dlaczego immutable payment ledger?

**Kontekst:** System musi obsługiwać płatności (wpłaty, zwroty,
korekty). Potrzebujemy historii finansowej per rezerwacja.

**Alternatywy:** (A) Mutowalny rekord płatności (edycja kwoty,
statusu). (B) Immutable ledger --- zapis raz, nigdy edycja, korekty
jako nowe rekordy.

**Decyzja: B --- immutable ledger.**

**Dlaczego:** (1) Audytowalność --- każda operacja finansowa zostawia
ślad, żadna nie znika. Jeśli kiedyś ośrodek będzie miał kontrolę
księgową, historia jest kompletna. (2) Bezpieczeństwo --- błąd ludzi
(recepcja zmieni kwotę) nie nadpisuje historii. Korekta jest osobnym
rekordem, więc widać co się stało. (3) Spójność --- projekcje finansowe
(paidAmount, balanceDue) wyliczane z sumy CONFIRMED payments, nigdy
przechowywane jako mutowalny stan. Zero rozbieżności. (4) Standard
branżowy --- tak działają systemy typu Stripe, Przelewy24, księgowość.

**Konsekwencje:** Więcej rekordów w bazie (korekta = nowy wiersz
zamiast edycji istniejącego). Wymaga recalculate po każdej operacji.
Ale te koszty są marginalne vs korzyści.

33.2. Dlaczego modular monolith (nie mikroserwisy)?

**Kontekst:** System rezerwacyjny z wieloma modułami (zasoby, cennik,
kalendarz, płatności, CRM). Potrzebujemy czystej separacji domen.

**Alternatywy:** (A) Monolith bez separacji (jeden wielki spaghetti).
(B) Modular monolith (domain separation, osobne serwisy, wspólna DB).
(C) Mikroserwisy (osobne procesy, osobne DB, komunikacja przez API/
events).

**Decyzja: B --- modular monolith.**

**Dlaczego:** (1) Jeden operator (Robert), jeden VPS, jeden proces PM2.
Mikroserwisy wymagają: service discovery, inter-service communication,
distributed transactions, monitoring per service --- to jest ogromna
złożoność operacyjna dla jednej osoby. (2) Skala: 10-14 zasobów, kilka
rezerwacji dziennie. PostgreSQL na jednym VPS ogarnie to bez problemu
przez lata. (3) Czas budowy: monolith buduje się 5x szybciej niż
mikroserwisy. Przy budżecie czasowym "weekendy + wieczory" to
kluczowe. (4) Architektura jest PRZYGOTOWANA na rozbicie: każdy moduł
ma osobny serwis w src/lib/ (pricing-engine, payment-service,
timeline-service, email-service, email-renderer), osobne API routes, osobne komponenty. Gdyby kiedyś
trzeba było wydzielić payments jako osobny serwis --- to jest kwestia
przeniesienia plików, nie przepisywania logiki.

**Konsekwencje:** Jedna baza, jeden deploy, prostota. Ograniczenie:
przy bardzo dużym ruchu (>10k req/min) mogą być bottlenecki --- ale to
science fiction dla ośrodka z 10 domkami.

33.3. Dlaczego OFFER blokuje zasób (nie soft hold)?

**Kontekst:** Admin tworzy ofertę dla klienta (firma dzwoni, pyta o
termin). Czy oferta powinna blokować zasób na timeline?

**Alternatywy:** (A) Soft hold --- oferta rezerwuje na X minut, potem
auto-zwalnia. (B) Hard block --- oferta blokuje identycznie jak
rezerwacja, z expiresAt + auto-cancel.

**Decyzja: B --- hard block.**

**Dlaczego:** (1) Model biznesowy: Robert wysyła oferty ręcznie,
konkretnym klientom. Obiecuje klientowi, że termin jest zarezerwowany.
Soft hold = klient dostaje ofertę, a po 30 minutach ktoś inny zajmuje
termin. To łamie zaufanie. (2) Kontrola: Robert wie ile ofert wysyła.
To nie jest self-service gdzie tysiące ludzi generuje oferty. Przy 10
domkach i kilku ofertach tygodniowo "10 ofert = brak dostępności" nie
jest realnym scenariuszem. (3) Auto-cancel: oferty mają expiresAt +
expiryAction=CANCEL. Wygasła oferta zwalnia zasób automatycznie. Zero
ręcznej pracy.

**Konsekwencje:** Jeśli kiedyś ośrodek będzie miał self-service widget
z automatycznymi ofertami dla tysięcy klientów --- ten model trzeba
będzie przebudować (soft hold + timeout). Ale to jest scenariusz E2+
i wtedy podejmiemy nową decyzję.

33.4. Dlaczego db push (nie migrate) na etapie budowy?

**Status: HISTORYCZNE — zamknięte przez S3 (07.04.2026). Aktualny
standard projektu to Prisma migrations + migrate deploy.**

**Kontekst:** Prisma oferuje dwa tryby: db push (bezpośredni push
schematu do DB) i migrate (generowanie plików migracyjnych z historią).

**Alternatywy:** (A) prisma db push --- szybki, bez historii,
destrukcyjny. (B) prisma migrate dev + deploy --- z plikami migracji,
rollback, historia.

**Decyzja: A --- db push na etapie budowy, przejście na B przed
produkcją.**

**Dlaczego:** (1) Tempo iteracji: schema zmienia się co 2 dni
(nowe modele, nowe pola, refaktory). Migracje przy każdej zmianie to
dziesiątki plików migracyjnych, z których większość jest tymczasowa.
(2) Brak shadow DB: prisma migrate dev wymaga shadow DB na serwerze,
co komplikuje setup. (3) Dane testowe: na obecnym etapie w bazie są
tylko dane testowe --- utrata danych nie jest ryzykiem. (4) Bramka
produkcyjna: PRZED publicznym go-live (faza S3) przejście na migrate
deploy jest OBOWIĄZKOWE (patrz sekcja 32 --- bramki produkcyjne).
E2 jest wdrożone i działa na danych testowych.

**Konsekwencje:** Brak rollback, brak historii migracji. Akceptowalne
dopóki dane w bazie są testowe. Nieakceptowalne gdy pojawią się realne
rezerwacje klientów.

33.5. Dlaczego brak event busa teraz?

**Kontekst:** System wykonuje akcje (tworzenie rezerwacji, potwierdzenie
płatności) które powinny triggerować side-effects (email, CRM update,
webhook).

**Alternatywy:** (A) Event bus (EventEmitter / queue) --- publish
event, subscribers reagują. (B) Callback pattern --- bezpośrednie
wywołanie side-effectu po akcji (np. afterPaymentConfirmed() →
sendEmail()). (C) Nic --- side-effects implementowane inline w każdym
endpoincie.

**Decyzja: B teraz, A w przyszłości.**

**Dlaczego:** (1) Na dziś mamy ZERO side-effectów --- nie ma emaili,
nie ma webhooków, nie ma CRM. Event bus bez subskrybentów to over-
engineering. (2) Przy E3 (email) potrzebujemy: "po potwierdzeniu
płatności wyślij email". Callback pattern (afterPaymentConfirmed()
wywołuje sendEmail()) rozwiązuje to w 10 linijkach kodu. (3) Event bus
ma sens gdy: wielu subskrybentów (email + CRM + webhook + raport), lub
asynchroniczne przetwarzanie (queue). To będzie przy module 7
(Komunikacja). Zbudujemy event bus gdy będziemy go potrzebować, nie
wcześniej.

**Konsekwencje:** Przy E3 dodamy prosty callback. Przy module 7
przeniesiemy na event bus. Dwuetapowy plan, nie przedwczesna
optymalizacja.

33.6. Dlaczego deploy przez FileZilla (nie CI/CD)?

**Kontekst:** Kod jest deployowany z maszyny Claude na VPS produkcyjny.
Potrzebujemy procesu wdrożenia.

**Alternatywy:** (A) FileZilla (SFTP) + tar.gz + SSH. (B) Git push +
CI/CD (GitHub Actions). (C) Git na serwerze + skrypt pull/build.

**Decyzja: A --- FileZilla.**

**Dlaczego:** (1) Operator (Robert) nie jest programistą. Git, GitHub,
SSH keys, CI/CD secrets --- to jest warstwa złożoności, która nie
przynosi wartości na tym etapie. FileZilla to drag-and-drop, zrozumiały
dla każdego. (2) Brak GitHub repo --- kod jest generowany przez Claude
sesja po sesji, nie commitowany do repo. CI/CD wymaga repo. (3)
Bezawaryjność: ~30 deployów w 6 tygodni, zero problemów. Prosty
proces jest niezawodny.

**Konsekwencje:** Brak automatyzacji, ręczne kopiowanie plików. Czas
deployu: ~3 minuty. Gdy dołączy drugi programista lub pojawi się
potrzeba szybszych deployów --- przejście na Git + skrypt.

33.7. Dlaczego PriceEntry per-day (nie sezon jako selektor ceny)?

**Kontekst:** System cenowy musi obsługiwać różne ceny za noc w
zależności od daty (sezony, święta, długie weekendy).

**Alternatywy:** (A) Sezon jako selektor ceny --- "Wysoki sezon =
250 zł/noc, Niski = 150 zł/noc". Silnik sprawdza jaki sezon w danym
dniu i bierze cenę. (B) PriceEntry per-day --- każda noc ma swoją cenę
w tabeli. Sezon to label (nazwa wyświetlana klientowi), nie selektor.

**Decyzja: B --- PriceEntry per-day.**

**Dlaczego:** (1) Elastyczność: Robert może ustawić cenę 350 zł na
Sylwestra bez tworzenia sezonu "Sylwester". Każda noc może mieć
unikalną cenę. (2) Niezależność: zmiana granic sezonu nie zmienia cen
istniejących rezerwacji. Cena jest faktem per dzień, nie pochodną
sezonu. (3) Fallback chain: PriceEntry(date) → PriceEntry(null) →
basePriceMinor → free. Jasna hierarchia, zero dwuznaczności. (4)
Audit: cennik to tabela faktów (wariant X, plan Y, dzień Z = kwota W).
Nie ma interpretacji. (5) RatePlan inheritance: plan cenowy dziedziczy
ceny z parenta z modyfikatorem (% lub stała kwota). PriceEntry per-day
to umożliwia prosto.

**Konsekwencje:** Więcej wpisów w tabeli PriceEntry (per wariant ×
per plan × per dzień). Ale to Int (grosze), lekkie. Generator cennika
(z sezonów) tworzy wpisy automatycznie. Robert nie musi ręcznie
wpisywać 365 cen.

33.8. Dlaczego Timeline jako source of truth dostępności?

**Kontekst:** System musi wiedzieć czy zasób jest wolny w danym
terminie. Potrzebujemy mechanizmu sprawdzania dostępności.

**Alternatywy:** (A) Sprawdzanie po Reservation (szukaj rezerwacji z
overlapping datami). (B) Osobna tabela TimelineEntry jako source of
truth dostępności.

**Decyzja: B --- TimelineEntry.**

**Dlaczego:** (1) Separacja odpowiedzialności: Reservation =
dane biznesowe (klient, cena, status). TimelineEntry = fizyczna
blokada zasobu (czas, zasób, typ). (2) Jeden mechanizm dla wszystkich
typów: BOOKING, OFFER, BLOCK --- wszystkie tworzą TimelineEntry. (3)
Exclusion constraint: PostgreSQL btree_gist na (resourceId, startAt,
endAt) z warunkiem status=ACTIVE. Overbooking jest NIEMOŻLIWY na
poziomie bazy danych. Nie da się tego zrobić tak czysto na samych
Reservation. (4) QUANTITY_TIME: zasoby typu kajak mają wiele
jednostek. TimelineEntry z quantityReserved + SUM query sprawdza
czy jest wolna jednostka. (5) Wydajność: sprawdzenie dostępności =
jedno query na TimelineEntry zamiast skomplikowanego JOIN po
Reservation + ReservationItem.

**Konsekwencje:** Dodatkowa tabela do utrzymania. TimelineEntry MUSI
być generowany automatycznie z ReservationItem (nigdy ręcznie). Sanity
check cron zalecany. Ale korzyści (exclusion constraint, czysta
separacja, wydajność) zdecydowanie przeważają.

34\. Runbooki awaryjne

Instrukcje krok po kroku na wypadek awarii. Każdy runbook zakłada, że
osoba czytająca NIE ma kontekstu --- prowadzi za rękę.

34.1. Build fail (next build nie przechodzi)

**Objawy:** ./node_modules/.bin/next build kończy się błędem. PM2 działa
dalej na starej wersji (nie jest dotknięty).

**Krok 1:** Przeczytaj komunikat błędu. Najczęstsze przyczyny:
- TypeScript error (brakujący import, zły typ) --- popraw plik źródłowy
- Module not found --- brakuje zależności, uruchom: npm install
- Out of memory --- uruchom: NODE_OPTIONS="--max-old-space-size=2048" ./node_modules/.bin/next build

**Krok 2:** Jeśli błąd jest w nowo dodanym pliku --- porównaj z backupem.
Stara wersja plików jest w ostatnim tar.gz backup.

**Krok 3:** Jeśli nic nie pomaga --- przywróć ostatni działający backup:
cd /var/www/admin && tar xzf /root/backup-last-working.tar.gz
(NIE nadpisuj node_modules ani .env). Rebuild i restart.

**Krok 4:** System nadal działa na starej wersji (PM2 serwuje last
successful build z .next/). Nie panikuj --- build fail nie zabija
działającego serwera.

34.2. Deploy rollback (nowa wersja nie działa poprawnie)

**Objawy:** Po deployu panel nie działa, błędy 500, biały ekran.

**Krok 1:** Sprawdź logi: pm2 logs zw-admin --lines 50
(szukaj requestId w logach — ułatwia identyfikację problemu)

**Krok 2:** Jeśli problem w kodzie --- rollback przez git:
git log --oneline (znajdź ostatni działający commit)
git reset --hard <commit> (cofnij do tego stanu — kasuje późniejsze zmiany)
./node_modules/.bin/next build && pm2 restart zw-admin
Alternatywnie (jeśli git nie pomaga) przywróć pliki z backupu tar.gz:
cd /var/www/admin && tar xzf /root/backup-pre-NAZWA.tar.gz
./node_modules/.bin/next build && pm2 restart zw-admin

**Krok 3:** Jeśli problem w DB (po migrate deploy) --- patrz 34.3.

**Krok 4:** Sprawdź health: curl -s http://localhost:3000/api/health
(powinien zwrócić healthy po naprawie)

**Zasada:** ZAWSZE rób backup PRZED deployem: tar czf
/root/backup-pre-NAZWA.tar.gz src/ prisma/schema.prisma scripts/ docs/
(bez node_modules, .next, .env).

34.3. Prisma migrate deploy — awaria migracji

**Status: Aktualny standard od S3 (07.04.2026). db push NIE jest
używane na produkcji — patrz §33.4 (decyzja historyczna).**

**Objawy:** Migracja Prisma usunęła kolumnę, zmieniła typ, lub serwer
zwraca błędy Prisma po migrate deploy.

**Krok 1:** Sprawdź co się zmieniło: npx prisma@5.22.0 db pull (pobiera
aktualny schema z DB). Porównaj z schema.prisma z backupu plików.

**Krok 2:** Jeśli usunięto kolumnę z danymi --- PRZYWRÓĆ Z BACKUPU DB:
pg_restore -Fc --clean -U zwadmin -h localhost -d zielone_wzgorza_admin
/root/backup-pre-NAZWA.dump
(UWAGA: nadpisze CAŁĄ bazę --- upewnij się, że dump jest aktualny).

**Krok 3:** Przywróć stary schema.prisma z backupu plików, przywróć
folder prisma/migrations/ z backupu, i uruchom:
npx prisma@5.22.0 migrate deploy

**Krok 4:** Sprawdź health: curl -s http://localhost:3000/api/health

**Zasada:** ZAWSZE backup DB przed migracjami:
pg_dump -Fc -U zwadmin -h localhost zielone_wzgorza_admin >
/root/backup-pre-NAZWA.dump

34.4. Timeline desync (rezerwacja istnieje, ale brak bloku na timeline)

**Objawy:** Rezerwacja ze statusem PENDING/CONFIRMED nie ma bloku na
kalendarzu. Zasób wygląda na wolny, ale nie powinien.

**Krok 1 — Diagnostyka (rebuild dry-run):**
cd /var/www/admin
npx tsx scripts/rebuild-timeline.ts --reservationId=ID_REZERWACJI

Dry-run pokaże: ile ACTIVE entries jest vs ile powinno być, czy są
konflikty z innymi rezerwacjami.

**Krok 2 — Naprawa (jeśli dry-run pokazuje brak konfliktów):**
npx tsx scripts/rebuild-timeline.ts --reservationId=ID_REZERWACJI --apply

Rebuild jest atomic: albo naprawi wszystko, albo nic nie zmieni.
Tworzy audit log w DB (action: TIMELINE_REBUILD).

**Krok 3 — Jeśli rebuild wykrywa konflikty:**
Inny zasób zajął ten termin. Trzeba najpierw rozwiązać konflikt
(anulować kolidującą rezerwację lub zmienić daty), potem ponowić
rebuild.

**Krok 4 — Awaryjnie (jeśli CLI nie działa):**
Diagnoza SQL: SELECT r.id, r.number, r.status, r.type,
ri.id as item_id, ri."resourceId", te.id as timeline_id FROM
reservations r LEFT JOIN reservation_items ri ON ri."reservationId" =
r.id LEFT JOIN timeline_entries te ON te."reservationItemId" = ri.id
AND te.status = 'ACTIVE'
WHERE r.status IN ('PENDING', 'CONFIRMED') AND te.id IS NULL;

Ręczna naprawa SQL tylko w ostateczności — preferuj rebuild CLI.

34.5. Backup i restore bazy danych

**Tworzenie backupu:**
pg_dump -Fc -U zwadmin -h localhost zielone_wzgorza_admin >
/root/backup-YYYYMMDD.dump

**Restore (nadpisuje CAŁĄ bazę):**
pg_restore -Fc --clean -U zwadmin -h localhost -d
zielone_wzgorza_admin /root/backup-YYYYMMDD.dump

**Restore pojedynczej tabeli:**
pg_restore -Fc -U zwadmin -h localhost -d zielone_wzgorza_admin
--table=nazwa_tabeli /root/backup-YYYYMMDD.dump

**Po restore:** pm2 restart zw-admin (Node.js cache Prisma)

**Harmonogram backupów:** Docelowo cron codziennie o 2:00. Na teraz ---
ręcznie przed każdą migracją.

34.6. PM2 nie startuje / crash loop

**Objawy:** pm2 status pokazuje errored lub restarts > 10.

**Krok 1:** pm2 logs zw-admin --lines 100 --- przeczytaj błędy.

**Krok 2:** Najczęstsze przyczyny:
- Brak .env lub złe zmienne --- sprawdź: cat /var/www/admin/.env
- Port zajęty --- sprawdź: lsof -i :3000 (i zabij proces)
- Uszkodzony build --- przebuduj: ./node_modules/.bin/next build
- Brak node_modules --- uruchom: npm install

**Krok 3:** Restart: pm2 delete zw-admin && cd /var/www/admin && pm2
start npm --name "zw-admin" -- start

34.7. package.json nadpisany (incident z 01.04.2026)

**Objawy:** npm install usuwa paczki, next build nie znajduje modułów.

**Przyczyna:** tar.gz zawierał package.json z okrojoną listą deps.

**Naprawa:** Przywróć package.json z backupu:
cp /root/backup-pre-XXX/package.json /var/www/admin/package.json
cp /root/backup-pre-XXX/package-lock.json /var/www/admin/package-lock.json
npm install

**Prewencja:** NIGDY nie pakuj package.json ani package-lock.json do
tar.gz (patrz sekcja 28.2).

34.8. Kompletna lista zmiennych .env (stan na 07.04.2026)

Każda zmienna jest WYMAGANA, chyba że oznaczona jako opcjonalna.
Brak którejkolwiek → błąd runtime lub ograniczona funkcjonalność.

```
# Database
DATABASE_URL="postgresql://zwadmin:HASLO@localhost:5432/zielone_wzgorza_admin?schema=public"

# Auth
JWT_SECRET=losowy_ciag_min_32_znaki

# Base URLs
NEXT_PUBLIC_ADMIN_BASE_URL=http://IP:3000/admin
NEXT_PUBLIC_ENGINE_BASE_URL=http://IP:3000
NEXT_PUBLIC_API_BASE_URL=http://IP:3000
NEXT_PUBLIC_FRONT_BASE_URL=https://zielonewzgorza.eu
BASE_URL=http://IP:3000   # używany w linkach emailowych

# SMTP (E3a)
SMTP_HOST=serwer2210673.home.pl
SMTP_PORT=587
SMTP_SECURE=false          # false=STARTTLS(587), true=SSL/TLS(465)
SMTP_USER=system@zielonewzgorza.eu
SMTP_PASSWORD=haslo_smtp

# Email behavior (E3a)
EMAIL_DRY_RUN=false        # true=loguje bez wysyłki, false=wysyła

# Internal API security (E3a groundwork, E3b runtime)
CRON_SECRET=losowy_ciag_min_32_znaki
```

NIGDY nie commituj .env do repo/archiwum. Zmiana wymaga edycji pliku
na serwerze (WinSCP lub nano) + pm2 restart zw-admin.

35\. Mapa zależności (co dotyka czego)

Gdy zmieniasz jeden element systemu, musisz sprawdzić jego zależności.
Poniższa mapa mówi: "jeśli zmieniasz X --- sprawdź też Y, Z".

35.1. Reservation (model główny)

Zmiana w Reservation dotyka:
- ReservationItem --- items tworzą się razem z rezerwacją (1 transakcja)
- TimelineEntry --- generowany z ReservationItem (timeline-service.ts)
- Payment --- powiązany przez reservationId (payment-service.ts)
- ReservationAddon --- dodatki per rezerwacja/item
- BookingDetails / OfferDetails --- modele 1:1 (token, pin, expiresAt)
- ReservationStatusLog --- automatyczny log przy zmianie statusu
- Quote --- powiązany przez reservationId (E1)
- API: GET/POST/PATCH /api/reservations, + /cancel, /confirm, /check-in,
  /no-show, /restore, /convert
- UI: CalendarDetailPanel, UnifiedPanel, ReservationList, OfferList
- Cache: timeline monthCache invalidation (useTimelineData hook)

35.2. ReservationItem (element rezerwacji)

Zmiana w ReservationItem dotyka:
- TimelineEntry --- 1:1 z ReservationItem (timeline-service.ts)
- ReservationAddon z scope=PER_ITEM --- powiązane przez reservationItemId
- Reservation.checkIn/checkOut --- wyliczane z min/max dat items
- Reservation totals --- przeliczane z items (pricing-service.ts)
- Availability --- checkAvailability/checkQuantityAvailability

35.3. Payment (ledger finansowy)

Zmiana w Payment dotyka:
- BookingDetails --- paidAmountMinor, balanceDueMinor (recalculate)
- Reservation.paymentStatus --- UNPAID/PARTIAL/PAID (recalculate)
- Reservation.status --- auto-confirm po wpłacie >= deposit
- RBAC --- require-auth.ts (role checks per operację)
- UI: PaymentPanel, PaymentFormPanel, PaymentItem (3-level stack)
- payment-service.ts --- recalculateFinancialProjection()
- format.ts --- formatMoneyMinor()

35.4. ResourceCategory (kategoria zasobu)

Zmiana w ResourceCategory dotyka:
- Resource --- zasoby należą do kategorii
- operational-times.ts --- checkInTimeOverride/checkOutTimeOverride
- timeline-service.ts --- availability check per categoryType
- pricing-engine.ts --- catType decyduje czy brak ceny = error czy warning
- availability API --- /api/public/availability (filtrowanie)
- UI: config page → godziny operacyjne per kategoria

35.5. CompanySettings (ustawienia globalne)

Zmiana w CompanySettings dotyka:
- operational-times.ts --- checkInTime/checkOutTime (fallback dla kategorii)
- payment-service.ts --- requiredDepositPercent (deposit snapshot)
- pricing-engine.ts --- depositPercent w quote
- reservation creation --- paymentDeadlineHours, paymentDeadlineAction
- UI: config page (3 taby: Rezerwacje, Płatności, Obiekt)

35.6. PriceEntry / RatePlan / Season (system cenowy)

Zmiana w systemie cenowym dotyka:
- pricing-engine.ts --- calculateQuote, getMinPrices, resolveNightPrice
- /api/public/quote --- formalna wycena
- /api/public/quote-preview --- minimalna cena per wariant
- /api/public/availability --- NIE (celowe rozdzielenie: cen tam nie ma)
- Istniejące rezerwacje --- NIE dotknięte (snapshot cen)

35.7. Schema Prisma (prisma/schema.prisma)

Zmiana w schema dotyka:
- WSZYSTKO --- schema to jedyne źródło prawdy DB
- Po zmianie schematu: generowana jest migracja Prisma, backup DB przed
  wdrożeniem, npx prisma@5.22.0 migrate deploy na VPS. db push był
  używany wyłącznie przed S3 na danych testowych i nie jest częścią
  aktualnego standardu.
- Wygenerowane typy (@prisma/client) --- mogą wymagać zmian w kodzie
- TypeScript --- nowe pola mogą wymagać "as any" dla Json
- UI --- formularze mogą potrzebować nowych pól
- Master Plan --- schema changes muszą być odnotowane w MP

36\. Standard wdrażania modułu (Definition of Done)

Stała checklista, którą KAŻDY nowy moduł/feature musi przejść przed
uznaniem za "zrealizowany". Brak dowolnego punktu = feature niegotowy.

36.1. Checklista implementacji

**Schema i baza danych:**
- [ ] Model(e) w prisma/schema.prisma z komentarzami
- [ ] Indeksy na FK i najczęstszych query
- [ ] Enumy z wartościami domyślnymi
- [ ] Migracja Prisma przygotowana i zatwierdzona
- [ ] npx prisma@5.22.0 migrate deploy wykonany na VPS
- [ ] Skrypt migracyjny (jeśli backfill danych) w scripts/
- [ ] Backup DB przed migracją

**Backend API:**
- [ ] Route(s) w src/app/api/ per domena
- [ ] Walidacja inputu (Zod-like lub ręczna)
- [ ] Autoryzacja (require-auth.ts, RBAC jeśli dotyczy)
- [ ] Structured error codes (apiError, apiSuccess)
- [ ] Edge cases: pusta lista, brakujący ID, duplikat, conflict

**Frontend UI:**
- [ ] Strona w src/app/admin/(panel)/ lub komponent w src/components/
- [ ] Skeleton loader (dedykowany, shimmer, bez fade-in)
- [ ] Zgodność z Design System (DESIGN_SYSTEM.md --- sprawdź sekcje)
- [ ] Responsywność (mobile: sidebar collapsed, tabela scroll)
- [ ] Empty state (ilustracja + tekst + CTA)
- [ ] SlidePanel ZAWSZE renderowany (nie warunkowo z &&)
- [ ] Search: paddingLeft:40 inline, ikona X do czyszczenia
- [ ] Polskie etykiety (normalne znaki, nie \uXXXX)

**Encoding i jakość kodu:**
- [ ] grep -rP '\\u0[01][0-9a-f]{2}' --- zero Unicode escapes
- [ ] scripts/check-polish.sh --- czysto
- [ ] TypeScript strict --- brak @ts-ignore, brak as any w krytycznych
  ścieżkach. Integracje Prisma/Json wymagają jawnego typu, mappera
  lub runtime guardu.
- [ ] Brak console.log w kodzie produkcyjnym

**Deployment:**
- [ ] tar.gz BEZ package.json, node_modules, .env, .next
- [ ] Upload FileZilla → SSH → tar xzf → build → restart
- [ ] Build przechodzi bez błędów
- [ ] PM2 restart zw-admin --- brak crash loop
- [ ] Test ręczny na VPS (przeglądarka)

**Dokumentacja:**
- [ ] Master Plan zaktualizowany (opis modułu, endpointy, decyzje)
- [ ] Design System zaktualizowany (jeśli nowe wzorce UI)
- [ ] ChatGPT review przeszedł (jeśli nowa faza)

36.2. Szablon opisu modułu w Master Planie

Każdy zrealizowany moduł powinien mieć w MP następujące sekcje:

**Nagłówek:** Nazwa modułu + data realizacji + status (✅)

**Czym jest:** 2-3 zdania co moduł robi i dlaczego jest potrzebny.

**Backend (zrealizowane):** Numerowana lista z: endpointami, logiką
biznesową, walidacjami, edge cases.

**Frontend (zrealizowane):** Numerowana lista z: stronami, komponentami,
interakcjami, wzorcami UI.

**Pliki:** Lista nowych/zmienionych plików (ścieżki).

**Testy:** Lista testów z wynikami (TX: opis → wynik).

**Decyzje:** Kluczowe decyzje architektoniczne (jeśli nowe --- dodaj do
sekcji 33).

**Brakuje (przeniesione):** Co celowo pominięto i dlaczego.

36.3. Kolejność prac przy nowym module

1. **Spec w MP** --- opisz co moduł ma robić (scope, endpointy, UI)
2. **Review ChatGPT** --- prześlij spec do recenzji
3. **Schema** --- dodaj modele do prisma/schema.prisma
4. **Backend** --- API routes + serwisy + walidacja
5. **Frontend** --- strony + komponenty + skeleton
6. **Encoding check** --- grep na polskie znaki
7. **Pakowanie** --- tar.gz (BEZ package.json)
8. **Deploy** --- FileZilla → VPS → build → restart
9. **Test na VPS** --- ręczne testy w przeglądarce
10. **MP update** --- opis modułu w Master Planie (szablon 36.2)
11. **ChatGPT review** --- wyniki testów do akceptacji

34.9. Payment mismatch (wpłata przyszła, system nie zaktualizował statusu)

**Objawy:** Klient mówi "zapłaciłem", ale rezerwacja nadal PENDING /
paymentStatus=UNPAID. Albo: kwota w systemie nie zgadza się z przelewem.

**Diagnoza krok po kroku:**

1. Sprawdź płatności w DB: SELECT p.id, p."amountMinor", p."paymentStatus",
p.method, p."occurredAt", p."confirmedAt" FROM payments p WHERE
p."reservationId" = 'ID_REZERWACJI' ORDER BY p."createdAt";

2. Jeśli brak płatności → wpłata nie została zarejestrowana. Dodaj
ręcznie przez panel: Kalendarz → kliknij rezerwację → Rozliczenia →
Dodaj wpłatę (BANK_TRANSFER, kwota, data).

3. Jeśli płatność istnieje ale paymentStatus=PENDING → nikt nie
potwierdził. Potwierdź: panel → Rozliczenia → kliknij płatność →
Potwierdź. Albo API: POST /api/payments/[paymentId]/confirm.

4. Jeśli płatność CONFIRMED ale rezerwacja nadal PENDING → bug w
recalculate. Sprawdź: SELECT "totalMinor", "requiredDepositMinor",
"paymentStatus", status FROM reservations WHERE id = 'ID';
Porównaj z: SELECT SUM("amountMinor") as paid FROM payments WHERE
"reservationId" = 'ID' AND "paymentStatus" = 'CONFIRMED' AND
kind = 'CHARGE' AND direction = 'IN';
Jeśli paid >= requiredDepositMinor ale status != CONFIRMED → uruchom
recalculate ręcznie: POST /api/reservations/[id]/payments (GET
odświeża projekcję).

5. Jeśli kwota się nie zgadza → dodaj korektę (ADJUSTMENT) przez panel.

**Przyszłość (E4):** Gdy wdrożymy Przelewy24, webhooky będą
automatycznie potwierdzać płatności. Do tego czasu --- ręczne
potwierdzenie przez admina.

34.10. DB constraint error 409 (exclusion violation na timeline)

**Objawy:** Przy tworzeniu/edycji rezerwacji API zwraca HTTP 409
Conflict z kodem CONFLICT lub komunikatem o overlapping timeline.

**Co to znaczy:** PostgreSQL exclusion constraint (btree_gist) wykrył,
że ktoś próbuje zarezerwować zasób, który jest już zajęty w tym
terminie. To NIE jest bug --- to ochrona przed overbookingiem.

**Scenariusze:**

1. Zwykły conflict (dwóch adminów rezerwuje ten sam termin) → poinformuj
admina, że termin jest zajęty. Zaproponuj inny termin lub zasób.

2. Conflict przy edycji własnej rezerwacji → system używa
excludeReservationId, więc rezerwacja nie powinna blokować samej siebie.
Jeśli to się dzieje → sprawdź czy excludeReservationId jest przekazywany
w PATCH body. Sprawdź też czy timeline entries starej rezerwacji zostały
anulowane przed utworzeniem nowych.

3. Conflict po anulowaniu i przywróceniu → restore sprawdza availability.
Jeśli w międzyczasie ktoś zajął termin → restore odmówi. Poprawne
zachowanie.

**Query diagnostyczny:** SELECT te.id, te."resourceId", r.name,
te."startAt", te."endAt", te.status, res.number FROM timeline_entries te
JOIN resources r ON r.id = te."resourceId" JOIN reservations res ON
res.id = te."reservationId" WHERE te."resourceId" = 'RESOURCE_ID' AND
te.status = 'ACTIVE' AND te."startAt" < 'END_DATE' AND te."endAt" >
'START_DATE';

34.11. Rezerwacja w złym statusie (stuck, niespójny stan)

**Objawy:** Rezerwacja ma status, który nie pasuje do sytuacji (np.
PENDING mimo że klient zapłacił, CONFIRMED mimo że anulowana, etc.).

**Diagnoza:**

1. Sprawdź historię zmian: SELECT * FROM reservation_status_logs WHERE
"reservationId" = 'ID' ORDER BY "createdAt";

2. Sprawdź płatności: SELECT * FROM payments WHERE "reservationId" = 'ID'
ORDER BY "createdAt";

3. Sprawdź timeline: SELECT * FROM timeline_entries WHERE
"reservationId" = 'ID';

**Typowe naprawy:**

- PENDING → powinno być CONFIRMED (wpłata istnieje): POST
/api/reservations/[id]/confirm (ręczne potwierdzenie admina).

- CONFIRMED → powinno być CANCELLED: POST /api/reservations/[id]/cancel
(anuluje + zwalnia timeline).

- CANCELLED → chcemy przywrócić: POST /api/reservations/[id]/restore
(sprawdza availability, jeśli wolne → przywraca + timeline).

- Status OK ale paymentStatus zły: GET
/api/reservations/[id]/payments (trigger recalculate).

**UWAGA:** NIGDY nie zmieniaj statusu bezpośrednio w DB (UPDATE
reservations SET status = ...). Zawsze przez API --- bo API aktualizuje
też timeline, statusLog, paymentStatus i inne powiązane dane.

34.12. Quote wygasł, a klient chce zarezerwować

**Objawy:** Klient dostał wycenę (quote), ale minęło >30 minut i quote
wygasł. Widget wyświetla błąd.

**Rozwiązanie:** Klient musi ponownie przejść przez wycenę (nowy
quote). Ceny mogą się zmienić jeśli w międzyczasie zmieniono cennik.
Quote jest jednorazowy i wygasający --- to celowe zabezpieczenie (cena
jest gwarancją tylko przez 30 minut).

**Jeśli admin chce ręcznie:** Może stworzyć rezerwację z panelu
admina (Kalendarz → Nowa rezerwacja) z dowolną ceną --- nie wymaga
quote.

34.13. Deploy wysypał się w połowie (częściowy deploy)

**Objawy:** tar xzf rozpakował tylko część plików, albo build padł po
nadpisaniu starych plików, albo PM2 restart odpalił niekompletny kod.

**Krok 1:** PM2 nadal serwuje? Sprawdź: pm2 status. Jeśli status
"online" → stary build (.next/) nadal działa. Serwer jest OK.

**Krok 2:** Jeśli serwer padł (status "errored") → przywróć z backupu:
cd /var/www/admin
tar xzf /root/backup-pre-NAZWA.tar.gz
./node_modules/.bin/next build
pm2 restart zw-admin

**Krok 3:** Jeśli nie masz backupu plików → masz jeszcze stary
tar.gz na dysku? Użyj go. Jeśli nie → poproś Claude o ponowne
wygenerowanie paczki.

**Krok 4:** Zweryfikuj: curl http://localhost:3000/admin/login --- jeśli
zwraca HTML → serwer działa.

**Prewencja:**
- ZAWSZE backup plików przed deployem
- NIGDY nie restartuj PM2 przed udanym buildem
- Kolejność: tar xzf → build → restart (nie: tar → restart → build)

34.14. Duplicate klient / rezerwacja (podwójne dane)

**Objawy:** Ten sam klient pojawia się dwa razy w systemie, lub ta
sama rezerwacja została utworzona podwójnie.

**Klient duplikat:**
1. Sprawdź: SELECT id, "firstName", "lastName", email, phone FROM
clients WHERE email = 'EMAIL' OR phone = 'TELEFON';
2. Zdecyduj który rekord jest właściwy (nowszy z pełnymi danymi).
3. Przenieś rezerwacje: UPDATE reservations SET "clientId" = 'GOOD_ID'
WHERE "clientId" = 'BAD_ID';
4. Usuń duplikat: DELETE FROM clients WHERE id = 'BAD_ID'; (lub soft
delete przez panel).

**Rezerwacja duplikat:**
1. Sprawdź na timeline (Kalendarz) --- dwa bloki na tym samym zasobie.
2. Anuluj zbędną: POST /api/reservations/[id]/cancel (zwalnia timeline).
3. Jeśli obie mają płatności → nie usuwaj, tylko anuluj jedną i
przenieś płatności (ADJUSTMENT na poprawną rezerwację).

**Prewencja:** System nie ma jeszcze deduplication check przy tworzeniu
z widgetu (E2). Do wdrożenia: sprawdzenie czy identyczna rezerwacja
(ten sam klient, te same daty, ten sam zasób) nie istnieje.

═══════════════════════════════════════════════════════════════════
MASTER PLAN — CHANGELOG WERSJI DOKUMENTU
═══════════════════════════════════════════════════════════════════

v1.0–v1.6 — Fazy A–E1: core booking engine, cennik, klienci,
  płatności, timeline, email, widget, RBAC, publiczne API.

v1.7 — S3 release gate (12/12 PASS), S3.1 concurrency hardening,
  System Guarantees, Failure Model, Invarianty.

v1.8 — 10 poprawek per review ChatGPT (runbooki, observability,
  security outline, widget outline, TypeScript strict rule).

v1.9 — Roadmapa warstwowa A–E, Definition of Done, faza testów
  wewnętrznych, GO-LIVE jako etap końcowy, iDoBooking = wzorzec.

v2.0 — Git (serwer + GitHub), deploy cheatsheet, semver, commit
  convention, pre-deploy safety tags, Known Limitations, email
  deliverability (SPF/DKIM/DMARC).

v2.1 (09.04.2026) — Testy regresyjne 18/18 PASS, cron heartbeat fix,
  Current Production State, ADR-lite (10 decyzji architektonicznych),
  Production vs Product Readiness, Operational Run Cadence,
  rozszerzony Known Limitations & Deferred Decisions, MP changelog.
  Warstwa B: kontrakt B0 zaakceptowany (storage, content model, API,
  DB constraints, typed vocabularies). ADR-11 do ADR-13 dodane.
  Git: GitHub repo public, semver, commit convention, pre-deploy tags.
