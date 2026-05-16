# Engine UI Lab — Responsive Conventions

Zasady dodawania nowych sekcji w `src/components/engine-ui-lab/`. Mobile-first checklist do uruchamiania PRZED commitem każdej nowej sekcji Lab.

Powód powstania: 2026-05-13, Część 10 Stage 5.3. Trzy sekcje (Eyebrow / MediaFrame aspect ratios / useDelayedLoading) wylewały content poza viewport na mobile. Root cause: brak `min-width: 0` na flex parentach + fixed widths bez intrinsic flex.

---

## 1. `min-width: 0` na flex parentach w showcase-preview

**Co**: `.eui-lab-showcase-preview` (i każdy custom flex parent w specimen) musi mieć `min-width: 0`.

**Dlaczego**: Domyślny `min-width: auto` we flex item = "nie kurcz się poniżej intrinsic content size". Każdy fixed-width / long-content child rozszerza parent poza viewport. `min-width: 0` zezwala flex parent kurczyć się.

**CSS**:
```css
.engine-root .eui-lab-showcase-preview {
  min-width: 0;
  /* …reszta */
}
```

---

## 2. `<pre>` / code blocks → `max-width: 100%` + `overflow-x: auto` na samym `<pre>`

**Co**: Każdy blok kodu musi mieć `max-width: 100%` oraz `overflow-x: auto`. Sam `overflow-x: auto` nie wystarczy — bez `max-width` parent rozszerza się do długości linii.

**CSS** (`.eui-lab-code`):
```css
.engine-root .eui-lab-code {
  max-width: 100%;
  overflow-x: auto;
  /* …reszta */
}
```

---

## 3. Fixed widths w specimens → intrinsic flex (`flex: 1 1 Xpx; max-width: Ypx`), nie media query

**Co**: Zamiast `style={{ width: 120 }}` na elementach w Inline/Stack — używaj `style={{ flex: "1 1 100px", maxWidth: 120 }}`.

**Dlaczego**: Fixed width + flex-wrap działa tylko jeśli liczba elementów × width < viewport. Intrinsic flex dostosowuje się do dostępnej szerokości i wraps natywnie. Zero media queries.

**TSX before/after**:
```tsx
// ❌ przed — fixed width, wymaga media query żeby zmniejszyć
<Stack style={{ width: 120 }}>...</Stack>

// ✅ po — intrinsic flex, sam się dostosuje
<Stack style={{ flex: "1 1 100px", maxWidth: 120 }}>...</Stack>
```

`flex: 1 1 100px` = grow 1, shrink 1, basis 100px (min ~100px na mobile). `maxWidth: 120` = nie urosnie powyżej intencji desktopowej.

**⚠️ KRYTYCZNE — forma `flex: 1 1 Xpx` zakłada parent flex-ROW.** `.eui-lab-showcase-preview` jest **flex-COLUMN** (`flex-direction: column; align-items: center`). W kolumnie `flex: 1 1 Xpx` działa na oś główną = **wysokość** (basis Xpx + grow → rozpycha pionowo = pusta biała przestrzeń pod spodem), a szerokość zwija się shrink-to-fit do treści (wąskie, niespójne między sekcjami zależnie od długości tekstu). Bug znaleziony 2026-05-16 (Select — rozmiary vs stany).

**Reguła**: dla specimen jako bezpośredniego dziecka flex-COLUMN parenta (np. `.eui-lab-showcase-preview` single-column showcase) używaj `style={{ width: "100%", maxWidth: Ypx }}` — wypełnia cross-axis, cap desktop, ZERO wymuszania wysokości. Forma `flex: 1 1 Xpx` tylko gdy parent jest flex-ROW (np. wielokolumnowy `<Inline wrap>` gdzie flex item to kolumna).

---

## 4. Images / MediaFrame → `max-width: 100%` globalnie

**Co**: `.engine-root img` musi mieć `max-width: 100%`. MediaFrame i pokrewne komponenty media — analogicznie.

**Dlaczego**: Bez tego obrazy z natywnym `width` atrybutem przebijają parent.

**CSS**:
```css
.engine-root img {
  max-width: 100%;
}
```

---

## 5. Mobile padding reduce — `@media (max-width: 768px)` na showcase wrappers

**Co**: `.eui-lab-showcase` i `.eui-lab-showcase-preview` mają mieć padding ≤ `var(--eui-space-4)` (12px) na mobile. Desktop może `var(--eui-space-8)` (40px).

**Dlaczego**: 40px padding × 2 = 80px straty horizontal na mobile (≤375px). To 21% viewportu zarezerwowane na nic.

**CSS**:
```css
@media (max-width: 768px) {
  .engine-root .eui-lab-showcase,
  .engine-root .eui-lab-showcase-preview {
    padding: var(--eui-space-4); /* 12px */
  }
}
```

**Uwaga o tokenach**: `--eui-space-3` = 8px, `--eui-space-4` = 12px. Nie myl nazwy z wartością — sprawdzaj zawsze w `:root` w `globals.css`.

---

## 6. Test 375px viewport PRZED commitem każdej nowej sekcji Lab

**Co**: Chrome DevTools → responsive mode → iPhone SE (375×667). Albo real device. Skrolnij całą sekcję, każdy specimen. **Scroll horizontal = bug**.

**Dlaczego**: 99% problemów responsywności widać natychmiast na 375px. Cheap defense, nie wymaga deploya.

**Heurystyka**: jeśli widzisz w body horizontal scrollbar — coś wylewa. Otwórz DevTools Elements i klikaj rodzic-rodzica aż znajdziesz ten szerszy niż viewport.

---

## 7. `overflow-x: clip` na top-level Lab container = safety net

**Co**: `.eui-lab-shell` (lub odpowiednik) ma `overflow-x: clip` — **NIE `hidden`**.

**Dlaczego**: Defense in depth. Nawet jak coś przeoczysz w punktach 1-6, ten safety net zatrzyma horizontal scroll na poziomie root. **NIE zastępuje** punktów 1-6 — clip ucina content, a punkty 1-6 layoutują tak, żeby się mieścił. Clip = ostatnia linia obrony, nie pierwsza.

**KRYTYCZNE — `clip`, nie `hidden`**: `overflow-x: hidden` zamienia element w scroll-container, co **psuje `position: sticky` na descendantach** (sticky przykleja się do tego kontenera zamiast viewportu). `.eui-lab-sidebar` jest sticky → `hidden` go zabijał (regresja Część 10 Stage 5.3, fix 2026-05-16). `overflow-x: clip` ucina overflow **bez** tworzenia scroll-containera → sticky działa. Wymaga Chrome 90+ / Firefox 81+ / Safari 16+ (OK dla wewnętrznego Lab).

**CSS**:
```css
.eui-lab-shell {
  overflow-x: clip; /* NIE hidden — patrz wyżej */
  /* …reszta */
}
```

---

## Mini-checklist na PR z nową sekcją Lab

- [ ] specimen container `min-width: 0` (lub naturalnie inherituje od showcase-preview)
- [ ] `<pre>` / code blocks → `max-width: 100%` + `overflow-x: auto`
- [ ] żadnego `style={{ width: Xpx }}` na flex children — używać `flex: 1 1 Xpx; maxWidth: Ypx`
- [ ] obrazy / MediaFrame → `max-width: 100%`
- [ ] sprawdzone w Chrome DevTools 375px responsive mode
- [ ] zero horizontal scrollbara w body przy 375px viewport
