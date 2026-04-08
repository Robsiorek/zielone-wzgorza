"use client";

/**
 * UsersContent — standalone page for user management.
 *
 * D0: Located at /admin/users, linked from sidebar "Pozostałe → Użytkownicy".
 */

import React from "react";
import { UsersTab } from "./users-tab";

export function UsersContent() {
  return (
    <div className="space-y-5 fade-in-up">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Użytkownicy</h2>
        <p className="text-[13px] text-muted-foreground mt-1">Zarządzanie kontami, rolami i uprawnieniami użytkowników panelu.</p>
      </div>
      <UsersTab />
    </div>
  );
}
