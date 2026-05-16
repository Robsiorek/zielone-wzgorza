# Documentation Map — Zielone Wzgórza

> **Nowy czat AI / nowy developer: zacznij TUTAJ.**
> Ten plik mówi co jest prawdą, co jest legacy, a co tylko historią.

---

## ⚡ TL;DR — co czytać na start

| Pracujesz nad… | Czytaj |
|---|---|
| **Engine UI** (`.eui-*`, `engine-ui/*`, Lab, przyszły front) | `docs/engine-ui/INVENTORY.md` **(CANONICAL)** + `docs/engine-ui/LAB-CONVENTIONS.md` |
| **Admin panel legacy** (`.bubble`, `/admin/*` stary system) | `docs/legacy/DESIGN_SYSTEM.md` (LEGACY — nie dla Engine UI) |
| Strategia / roadmap | `docs/master-plan-v2_5.md` |
| Historia (co już zrobiono / jak) | `docs/history/**` (NIE jest źródłem prawdy — zapis punktowy) |

---

## 🎯 Dwa design systemy — KLUCZOWE

Projekt ma **dwa równoległe systemy**. Nie myl ich.

| System | Scope | Status | Source of truth |
|---|---|---|---|
| **Engine UI** | `.eui-*`, `--eui-*`, Manrope, `src/components/engine-ui/*`, Engine UI Lab, **przyszły booking frontend** | ✅ **CANONICAL (future truth)** | `docs/engine-ui/INVENTORY.md` |
| **Admin Panel legacy** | `.bubble`, Plus Jakarta Sans, `/admin/*` stary UI, obecny booking frontend | 🟡 **LEGACY / transitional** (do migracji na Engine UI) | `docs/legacy/DESIGN_SYSTEM.md` |

**Zasada:** Engine UI jest docelowym systemem. Booking frontend (`booking.zielonewzgorza.eu`) i admin `.bubble` to stan przejściowy do przyszłej migracji. `docs/legacy/DESIGN_SYSTEM.md` opisuje TYLKO legacy admin — **nie generuj z niego kodu Engine UI**.

---

## 📁 Struktura docs/

```
docs/
  README.md                      ← TEN PLIK (mapa, start dla nowego chatu)
  master-plan-v2_5.md            ← aktualny strategiczny roadmap (NEEDS DECISION: docs/project/?)
  BOOKING_EDIT_DESIGN.md         ← domenowy spec (NEEDS DECISION: gdzie docelowo)

  engine-ui/                     ← ✅ CANONICAL Engine UI
    INVENTORY.md                 component mental map + roadmap (jedyna prawda)
    LAB-CONVENTIONS.md           reguły responsywne Engine UI Lab

  legacy/                        ← 🟡 LEGACY (stary system, nie dla Engine UI)
    DESIGN_SYSTEM.md             admin .bubble / Plus Jakarta (v1.8, historyczny "źródło prawdy" UNIEWAŻNIONY)
    master-plan-v2_4.md          poprzednia wersja roadmapu (superseded by v2_5)

  history/                       ← 📜 ZAPIS PUNKTOWY (NIE źródło prawdy, NIE aktualizować wstecz)
    blueprints/                  BLUEPRINT-part8.5a / 9 / 10 — specy/intencje sprzed realizacji
    reports/                     REPORT-* , CLOSURE-* — post-mortem wykonania
    prompts/                     PROMPT-CLI-* — operacyjne prompty zadań
    audits/                      AUDIT-* — audyty governance/systemu (w tym ten Stage 1 kontekst)

  ops/                           ← infrastruktura / inne domeny
    nginx-engine.conf, TIMELINE_SPEC.md, TIMELINE_TODO.md, UNIFIED_PANEL_SPEC.md
```

---

## 📜 O katalogu history/

`history/**` to **zapis punktowy w czasie** — blueprinty (intencja PRZED), reporty/closures (co zrobiono PO), prompty (zadania), audyty (stan na dany dzień). Reguły:

- **NIE jest źródłem prawdy.** Stan faktyczny = kod + `docs/engine-ui/INVENTORY.md`.
- **NIE aktualizować wstecz.** History jest immutable — linki wewnątrz odnoszą się do ścieżek sprzed reorganizacji 2026-05-16 i to jest oczekiwane (zapis historyczny).
- Czytaj dla kontekstu "dlaczego/jak", nie dla "co jest teraz".

---

## ⚠️ Znane do decyzji (NEEDS DECISION)

- `docs/master-plan-v2_5.md` — zostawiony top-level (bezpieczne, reversible). Ewent. `docs/project/` — decyzja PO.
- `docs/BOOKING_EDIT_DESIGN.md` — domenowy spec, nie objęty mapowaniem Stage 1. Docelowe miejsce — decyzja PO.
- `HANDOFF-new-chat.md` (root repo, untracked) — poza scope Stage 1, nieruszony.
- Referencje do starych ścieżek docs w **kodzie** (`src/styles/globals.css` komentarze → `LAB-CONVENTIONS-responsive.md`, `DESIGN_SYSTEM.md`) — **NIE zmienione** (Stage 1 = docs only, no CSS changes). Follow-up.
- Stale referencje w `CLAUDE.md` do nieistniejącego `docs/MASTER-PLAN.md` / `docs/adr/` — pre-existing drift, poza scope Stage 1.

---

*Utworzony: 2026-05-16, Stage 1 governance consolidation. Kontekst: `docs/history/audits/AUDIT-engine-ui-system-governance-FULL.md`.*
