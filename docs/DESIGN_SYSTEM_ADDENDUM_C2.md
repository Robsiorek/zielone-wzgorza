# DESIGN_SYSTEM_ADDENDUM_C2.md
# Dopisać na koniec DESIGN_SYSTEM.md na serwerze.

---

## 9. NAGŁÓWKI SEKCJI — JEDNA ZASADA DLA CAŁEGO PROJEKTU

### Wzorzec (źródło prawdy: UnifiedPanel / Edytuj rezerwację)

```jsx
<h3 className="flex items-center gap-2 text-[14px] font-semibold">
  <Icon className="h-4 w-4 text-primary" />
  Tytuł sekcji
</h3>
```

**Zasady:**
- **Rozmiar:** `text-[14px] font-semibold` — czytelny, wyrazisty
- **Ikona:** `h-4 w-4 text-primary` — bezpośrednio kolorowa, BEZ tła (`bg-primary/10`)
- **Case:** Normalny (nie `uppercase`, nie `tracking-wider`)
- **Odstęp:** `mb-3` pod nagłówkiem do treści sekcji
- **Użycie:** Każdy SlidePanel, każda sekcja na stronie — WSZĘDZIE ten sam wzorzec

### Gdzie stosujemy

| Komponent | Sekcje |
|-----------|--------|
| UnifiedPanel (Edytuj rezerwację) | 📅 Termin pobytu, 👤 Klient, 🏠 Zasoby, 📦 Globalne opłaty, 📄 Szczegóły |
| CalendarDetailPanel (Slide panel) | 👤 Klient, 🚪 Zameldowanie, 📅 Termin, 🏠 Zasoby, ✨ Sprzątanie, 💲 Rozliczenia, 📄 Pozostałe, ℹ️ Informacje |
| PaymentPanel (Rozliczenia) | 📊 Podsumowanie, 🕐 Historia płatności |
| ReservationDetail (Karta) | ℹ️ Informacje, 💲 Rozliczenia |

### Czego NIE robimy

- ❌ `uppercase tracking-wider` — nie na nagłówkach sekcji (to było stare)
- ❌ `bg-primary/10` kwadrat wokół ikony — w slide panelach i formularzach nie
- ❌ `text-[11px]`, `text-[12px]`, `text-[13px]` na nagłówkach sekcji — zawsze `text-[14px]`
- ❌ `text-muted-foreground` na nagłówkach sekcji — tekst jest `text-foreground` (domyślny z `font-semibold`)

### Wyjątki (subheadery, nie sekcje)

Podtytuły wewnątrz sekcji (np. "Oczekujące (3)", "Potwierdzone (5)") to NIE nagłówki sekcji:

```jsx
<span className="text-[12px] font-semibold text-muted-foreground">Oczekujące</span>
```

Te są mniejsze, szare, BEZ ikony — celowo subtelne.

---

## 10. STRZAŁKA COFANIA W SLIDEPANEL (nawigacja wstecz)

### Pozycja: pod title bar, w content area

```jsx
<SlidePanel open={open} onClose={onClose} title="Tytuł">
  {/* Back button — PIERWSZY element w content, pod title bar + separator */}
  <div className="mb-5">
    <button onClick={onBack} className="btn-icon-bubble h-10 w-10">
      <ArrowLeft className="h-4 w-4" />
    </button>
  </div>
  {/* ... reszta contentu ... */}
</SlidePanel>
```

**Zasady:**
- Klasa: `btn-icon-bubble h-10 w-10` — identyczna jak na stronie Profil klienta
- Border-radius: `rounded-2xl` (16px, z klasy `.btn-icon-bubble`) — NIE `rounded-full`
- Pozycja: pod tytułem i linią oddzielającą, NIE w samym tytule
- Margin: `mb-5` (20px) pod strzałką do contentu
- Ikona: `<ArrowLeft className="h-4 w-4" />`

---

## 11. SLIDEPANEL — ZASADY RENDEROWANIA

### Nigdy nie renderuj warunkowo

```jsx
// ❌ ŹLE — React odmontowuje natychmiast, brak animacji zamykania
{panelOpen && <SlidePanel open={panelOpen} onClose={...} />}

// ✅ DOBRZE — SlidePanel odgrywa animację wjazdu i wyjazdu
<SlidePanel open={panelOpen} onClose={...} />
```

SlidePanel wewnętrznie obsługuje `visible` state — gdy `open` zmienia się z `true` na `false`,
odgrywa animację wyjazdu (translateX 250ms) zanim się odmontuje.

### Stack paneli (3 poziomy)

```
Level 1: CalendarDetailPanel (szczegóły rezerwacji)
  └─ Level 2: PaymentPanel (rozliczenia) — always rendered
       └─ Level 3: PaymentFormPanel (nowa operacja) — always rendered
```

Klik w overlay zamyka bieżący panel. Strzałka ← cofa o jeden poziom.
