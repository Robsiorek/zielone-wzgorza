"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Moon, Sun, LogOut, User, Settings, ChevronDown, ChevronRight, Menu, HelpCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══ Breadcrumb config ═══ */

interface Crumb { label: string; href?: string; }

function getBreadcrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [];

  if (pathname.startsWith("/admin/dashboard")) {
    crumbs.push({ label: "Dashboard" });
  } else if (pathname.startsWith("/admin/calendar")) {
    crumbs.push({ label: "Kalendarz" });
  } else if (pathname === "/admin/offers/new") {
    crumbs.push({ label: "Oferty", href: "/admin/offers" });
    crumbs.push({ label: "Nowa oferta" });
  } else if (pathname.startsWith("/admin/offers/")) {
    crumbs.push({ label: "Oferty", href: "/admin/offers" });
    crumbs.push({ label: "Szczegóły oferty" });
  } else if (pathname.startsWith("/admin/offers")) {
    crumbs.push({ label: "Oferty" });
  } else if (pathname.startsWith("/admin/reservations/")) {
    crumbs.push({ label: "Rezerwacje", href: "/admin/reservations" });
    crumbs.push({ label: "Szczegóły rezerwacji" });
  } else if (pathname.startsWith("/admin/reservations")) {
    crumbs.push({ label: "Rezerwacje" });
  } else if (pathname === "/admin/clients/new") {
    crumbs.push({ label: "Klienci", href: "/admin/clients" });
    crumbs.push({ label: "Nowy klient" });
  } else if (pathname.match(/\/admin\/clients\/[^/]+\/edit/)) {
    crumbs.push({ label: "Klienci", href: "/admin/clients" });
    crumbs.push({ label: "Edycja klienta" });
  } else if (pathname.startsWith("/admin/clients/")) {
    crumbs.push({ label: "Klienci", href: "/admin/clients" });
    crumbs.push({ label: "Profil klienta" });
  } else if (pathname.startsWith("/admin/clients")) {
    crumbs.push({ label: "Klienci" });
  } else if (pathname.startsWith("/admin/resources")) {
    crumbs.push({ label: "Zasoby" });
  } else if (pathname.startsWith("/admin/pricing")) {
    crumbs.push({ label: "System cenowy" });
  } else if (pathname.startsWith("/admin/payments")) {
    crumbs.push({ label: "Płatności" });
  } else if (pathname.startsWith("/admin/documents")) {
    crumbs.push({ label: "Dokumenty" });
  } else if (pathname.startsWith("/admin/crm")) {
    crumbs.push({ label: "CRM" });
  } else if (pathname.startsWith("/admin/settings")) {
    crumbs.push({ label: "Ustawienia" });
  } else {
    crumbs.push({ label: "Panel" });
  }

  return crumbs;
}

/* ═══ Topbar ═══ */

export function Topbar({ sidebarCollapsed, userName, userEmail, onMenuClick, isMobile }: {
  sidebarCollapsed: boolean; userName?: string; userEmail?: string; onMenuClick?: () => void; isMobile?: boolean;
}) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);

  // Sync with actual DOM state after mount (inline script in <head> sets class before React)
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    const label = next ? "Przełączanie na tryb ciemny..." : "Przełączanie na tryb jasny...";

    // Full-screen loader
    const overlay = document.createElement("div");
    overlay.innerHTML = `
      <div style="position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
        background:${next ? "hsl(220 15% 8%)" : "hsl(210 20% 98%)"};transition:opacity 150ms ease;">
        <div style="width:32px;height:32px;border:3px solid ${next ? "hsl(214 89% 52% / 0.2)" : "hsl(214 89% 52% / 0.2)"};
          border-top-color:hsl(214 89% 52%);border-radius:50%;animation:spin 0.6s linear infinite;"></div>
        <span style="font-size:13px;font-weight:600;color:${next ? "hsl(220 8% 60%)" : "hsl(220 8% 52%)"};font-family:inherit;">
          ${label}
        </span>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(overlay);

    // Wait one frame for overlay to render, then switch theme
    const start = performance.now();

    requestAnimationFrame(() => {
      setDarkMode(next);
      document.documentElement.classList.toggle("dark", next);
      try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}

      // Wait for repaint + minimum 200ms
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const elapsed = performance.now() - start;
          const delay = Math.max(0, 200 - elapsed);
          setTimeout(() => {
            const inner = overlay.firstElementChild as HTMLElement;
            if (inner) inner.style.opacity = "0";
            setTimeout(() => overlay.remove(), 150);
          }, delay);
        });
      });
    });
  };

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const breadcrumbs = getBreadcrumbs(pathname);
  const initials = userName ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "AD";

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.getElementById("topbar-search")?.focus();
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-6 transition-all duration-300 bg-card/80 backdrop-blur-xl">

      {/* ── Left: hamburger + breadcrumbs ── */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        {isMobile && (
          <button onClick={onMenuClick} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 shrink-0">
            <Menu className="h-[18px] w-[18px]" />
          </button>
        )}
        <nav className="flex items-center gap-1 min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="h-3 w-3 text-foreground/20 shrink-0 mx-0.5" />}
              {crumb.href ? (
                <Link href={crumb.href} className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors truncate">
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn(
                  "text-[13px] truncate",
                  i === breadcrumbs.length - 1 ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                )}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* ── Center: search (desktop only) ── */}
      <div className="flex-1 flex justify-center px-4 hidden sm:flex">
        <div className="relative w-full max-w-[420px]">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
            searchFocused ? "text-primary" : "text-muted-foreground/50"
          )} />
          <input
            id="topbar-search"
            type="text"
            placeholder="Szukaj rezerwacji, klientów, ofert..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "w-full h-10 rounded-2xl pl-11 pr-12 text-[13px] outline-none transition-all duration-200",
              searchFocused
                ? "bg-card shadow-sm"
                : "bg-muted/50 hover:bg-muted/80"
            )}
            style={{
              border: searchFocused
                ? "2px solid hsl(var(--primary))"
                : "2px solid hsl(var(--border))",
            }}
          />
          <kbd className={cn(
            "absolute right-3.5 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center justify-center h-5 min-w-[20px] rounded-md bg-muted/80 px-1.5 text-[10px] font-mono text-muted-foreground/50 transition-opacity",
            searchFocused && "opacity-0"
          )}>/</kbd>
        </div>
      </div>

      {/* ── Right: actions + user ── */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* Search — mobile */}
        <button className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        </button>

        {/* Theme toggle */}
        <button onClick={toggleDark} className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
          {darkMode ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        {/* Divider */}
        <div className="mx-1.5 h-7 w-px bg-border/50" />

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "flex items-center gap-2.5 rounded-2xl px-2 py-1.5 transition-all duration-200",
              userMenuOpen ? "bg-muted" : "hover:bg-muted/60"
            )}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white text-[11px] font-bold">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[12px] font-semibold leading-none text-foreground">{userName || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Administrator</p>
            </div>
            <ChevronDown className={cn(
              "hidden md:block h-3 w-3 text-muted-foreground/40 transition-transform duration-200",
              userMenuOpen && "rotate-180"
            )} />
          </button>

          {userMenuOpen && (
            <div style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              minWidth: 230,
              background: "hsl(var(--card))",
              borderRadius: 16,
              border: "2px solid hsl(var(--border))",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
              zIndex: 50,
              overflow: "hidden",
            }}>
              <div className="px-4 py-3.5" style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                <p className="text-[14px] font-bold">{userName || "Admin"}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{userEmail}</p>
              </div>

              <div className="py-1.5 px-2 space-y-0.5">
                <a href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-foreground/80 hover:bg-muted/50 transition-colors rounded-xl">
                  <User className="h-4 w-4 text-muted-foreground" /> Twoje konto
                </a>
                <a href="/admin/settings" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-foreground/80 hover:bg-muted/50 transition-colors rounded-xl">
                  <Settings className="h-4 w-4 text-muted-foreground" /> Ustawienia
                </a>
                <a href="/admin/documents" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-foreground/80 hover:bg-muted/50 transition-colors rounded-xl">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Dokumenty
                </a>
                <button className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-foreground/80 hover:bg-muted/50 transition-colors w-full text-left rounded-xl">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" /> Pomoc
                </button>
              </div>

              <div style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }} className="py-1.5 px-2">
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium w-full text-left transition-colors rounded-xl"
                    style={{ color: "hsl(var(--destructive))" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "hsl(var(--destructive) / 0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <LogOut className="h-4 w-4" /> Wyloguj się
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
