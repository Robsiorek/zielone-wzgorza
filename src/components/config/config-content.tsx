"use client";

/**
 * ConfigContent — System configuration page with tabs.
 *
 * D0: Hash routing matches pricing module pattern exactly.
 * URL: /admin/config#reservations | #payments | #object
 * Sidebar links work via pushState interception (Next.js client-side nav).
 */

import React, { useState, useRef, useEffect } from "react";
import { CalendarDays, CreditCard, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReservationsConfigTab } from "./reservations-config-tab";
import { PaymentsConfigTab } from "./payments-config-tab";
import { ObjectConfigTab } from "./object-config-tab";

const TABS = [
  { id: "reservations", label: "Rezerwacje", icon: CalendarDays },
  { id: "payments", label: "Płatności", icon: CreditCard },
  { id: "object", label: "Obiekt", icon: Building2 },
];

const validTabs = TABS.map(t => t.id);

export function ConfigContent() {
  const [activeTab, setActiveTab] = useState("reservations");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Hash routing — exact same pattern as pricing-content.tsx
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);

    // Intercept pushState/replaceState (Next.js client-side navigation)
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (...args) => { origPush(...args); readHash(); };
    history.replaceState = (...args) => { origReplace(...args); readHash(); };

    return () => {
      window.removeEventListener("hashchange", readHash);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);

  // Scroll active tab into view
  useEffect(() => {
    if (!tabsRef.current) return;
    const activeEl = tabsRef.current.querySelector("[data-active=true]") as HTMLElement;
    if (activeEl) activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeTab]);

  return (
    <div className="space-y-5 fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Ustawienia systemu</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Konfiguracja rezerwacji, płatności i danych obiektu.</p>
      </div>

      {/* Tabs — same markup as pricing */}
      <div ref={tabsRef} className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="tabs-bubble inline-flex min-w-max">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                data-active={activeTab === t.id}
                onClick={() => { setActiveTab(t.id); window.history.replaceState(null, "", `#${t.id}`); }}
                className={cn("tab-bubble flex items-center gap-1.5", activeTab === t.id && "tab-bubble-active")}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "reservations" && <ReservationsConfigTab />}
      {activeTab === "payments" && <PaymentsConfigTab />}
      {activeTab === "object" && <ObjectConfigTab />}
    </div>
  );
}
