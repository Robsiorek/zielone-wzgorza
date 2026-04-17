"use client";

/**
 * EngineUiLab — internal preview surface at /admin/engine-ui-lab
 * ────────────────────────────────────────────────────────────────────────
 * Architecture (revised):
 *   - The PAGE LAYOUT (grid, sidebar, topbar) lives in ADMIN DOM. It uses
 *     Tailwind + admin design system (bubble styling, rounded-xl cards,
 *     border-border, bg-card etc.). Background inherits from the admin
 *     light/dark mode.
 *   - The ENGINE-UI PREVIEW AREA (where SearchBar, DateRangePicker,
 *     GuestPicker etc. live) is wrapped in `.engine-root` so engine-ui
 *     CSS variables and rules apply. This subtree is always light-mode
 *     and always rendered in ZW brand theme.
 *
 * This split matches the rule "engine components = isolated; lab chrome =
 * can use admin design" (ChatGPT review). It also means the Lab sits
 * visually inside the admin panel rather than feeling like a foreign body.
 */

import * as React from "react";
import {
  Palette,
  Waves,
  LayoutGrid,
  CalendarRange,
  Users,
  SearchIcon,
  LayoutList,
} from "lucide-react";

import { useWidgetTheme } from "@/components/engine-ui/hooks/useWidgetTheme";
import { LabSidebar } from "./LabSidebar";
import { FoundationsSection } from "./sections/FoundationsSection";
import { MotionSection } from "./sections/MotionSection";
import { PopoverSection } from "./sections/PopoverSection";
import { DatePickerSection } from "./sections/DatePickerSection";
import { GuestPickerSection } from "./sections/GuestPickerSection";
import { SearchBarSection } from "./sections/SearchBarSection";
import { ResultsSection } from "./sections/ResultsSection";

const SIDEBAR_ITEMS = [
  { id: "foundations", label: "Fundamenty",        icon: <Palette size={16} aria-hidden="true" /> },
  { id: "motion",      label: "Ruch",              icon: <Waves size={16} aria-hidden="true" /> },
  { id: "popovers",    label: "Popovery",          icon: <LayoutGrid size={16} aria-hidden="true" /> },
  { id: "datepicker",  label: "Picker dat",        icon: <CalendarRange size={16} aria-hidden="true" /> },
  { id: "guestpicker", label: "Picker gości",      icon: <Users size={16} aria-hidden="true" /> },
  { id: "searchbar",   label: "Pasek wyszukiwania", icon: <SearchIcon size={16} aria-hidden="true" /> },
  { id: "results",     label: "Warstwa wyników",    icon: <LayoutList size={16} aria-hidden="true" /> },
];

export function EngineUiLab() {
  // The hook mounts inside admin DOM but still finds `.engine-root`
  // further down and applies widget theme there — not to the admin
  // panel itself. Admin's colors stay untouched.
  const { theme } = useWidgetTheme();

  return (
    <div className="eui-lab-shell">
      <LabSidebar items={SIDEBAR_ITEMS} />
      <div className="eui-lab-main">
        <header className="eui-lab-topbar">
          <h1 className="eui-lab-topbar-title">Engine UI Lab</h1>
          <span className="eui-lab-topbar-badge">Wewnętrzne</span>
        </header>

        {/* ═══════════════════════════════════════════════════
         *  Engine UI preview — scoped to .engine-root.
         *  All engine-ui components rendered below here inherit
         *  brand theme, engine typography, and scoped CSS rules.
         *  Admin dark mode cannot reach into this subtree.
         * ══════════════════════════════════════════════════ */}
        <div
          className="engine-root eui-lab-preview"
          data-theme="light"
          style={{ colorScheme: "light" }}
        >
          <FoundationsSection theme={theme} />
          <MotionSection />
          <PopoverSection />
          <DatePickerSection />
          <GuestPickerSection />
          <SearchBarSection />
          <ResultsSection />
        </div>
      </div>
    </div>
  );
}
