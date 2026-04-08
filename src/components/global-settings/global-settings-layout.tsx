"use client";

import React from "react";
import Link from "next/link";
import { Palette, MailOpen, FileCode, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "appearance", label: "Wygląd widżetu", href: "/admin/global-settings/appearance", icon: Palette },
  { id: "email", label: "Powiadomienia e-mail", href: "/admin/global-settings/email", icon: MailOpen },
  { id: "email-templates", label: "Szablony e-mail", href: "/admin/global-settings/email-templates", icon: FileCode },
  { id: "email-logs", label: "Logi e-mail", href: "/admin/global-settings/email-logs", icon: ListChecks },
];

interface Props {
  activeSection: string;
  children: React.ReactNode;
}

export function GlobalSettingsLayout({ activeSection, children }: Props) {
  return (
    <div className="space-y-5 fade-in-up">
      {/* Header — same style as config-content */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Ustawienia globalne</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Konfiguracja wyglądu widżetu i powiadomień e-mail.</p>
      </div>

      {/* Section tabs */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="tabs-bubble inline-flex min-w-max">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                href={s.href}
                className={cn("tab-bubble flex items-center gap-1.5", activeSection === s.id && "tab-bubble-active")}
              >
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
