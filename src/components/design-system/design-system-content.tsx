"use client";

import React, { useState } from "react";
import {
  Type, Palette, MousePointer, ListFilter, PanelRight, LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TypographySection } from "./sections/typography";
import { ColorsSection } from "./sections/colors";
import { ButtonsInputsSection } from "./sections/buttons-inputs";
import { SelectsPickersSection } from "./sections/selects-pickers";
import { PanelsFeedbackSection } from "./sections/panels-feedback";
import { LayoutPatternsSection } from "./sections/layout-patterns";

const TABS = [
  { id: "typography", label: "Typography", icon: Type },
  { id: "colors", label: "Colors & Tokens", icon: Palette },
  { id: "buttons", label: "Buttons & Inputs", icon: MousePointer },
  { id: "selects", label: "Selects & Pickers", icon: ListFilter },
  { id: "panels", label: "Panels & Feedback", icon: PanelRight },
  { id: "layout", label: "Layout & Patterns", icon: LayoutGrid },
];

const SECTIONS: Record<string, React.FC> = {
  typography: TypographySection,
  colors: ColorsSection,
  buttons: ButtonsInputsSection,
  selects: SelectsPickersSection,
  panels: PanelsFeedbackSection,
  layout: LayoutPatternsSection,
};

export function DesignSystemContent() {
  const [activeTab, setActiveTab] = useState("typography");
  const Section = SECTIONS[activeTab];

  return (
    <div className="space-y-5 fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Design System</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Żywa referencja UI — komponenty, tokeny, wzorce i zasady.
          Źródło prawdy dla całego panelu administracyjnego.
        </p>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="tabs-bubble inline-flex min-w-max">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn("tab-bubble flex items-center gap-1.5", activeTab === t.id && "tab-bubble-active")}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active section */}
      {Section && <Section />}
    </div>
  );
}
