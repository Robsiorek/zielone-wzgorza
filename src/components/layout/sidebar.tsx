"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, CalendarDays, BookOpen, Tag, Warehouse,
  Users, CreditCard, FileText, Contact, Settings, ChevronRight,
  ChevronLeft, X, type LucideIcon,
  ListOrdered, ShieldX, Receipt, BarChart3,
  Globe, Megaphone, MailOpen, ClipboardList,
  DollarSign, TicketPercent, Layers, ArrowLeft, ChevronDown, Package, Palette,
  FileCode, ListChecks, Sparkles,
} from "lucide-react";

/* ═══ Menu definition ═══ */

interface SubItem { title: string; href: string; icon: LucideIcon; desc?: string; }
interface MenuItem { title: string; href?: string; icon: LucideIcon; badge?: string; children?: SubItem[]; }
interface MenuGroup { label: string; items: MenuItem[]; }

const menu: MenuGroup[] = [
  {
    label: "",
    items: [
      { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Kalendarz", href: "/admin/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Zarządzanie",
    items: [
      {
        title: "Rezerwacje", icon: BookOpen,
        children: [
          { title: "Lista rezerwacji", href: "/admin/reservations", icon: ListOrdered, desc: "Wszystkie rezerwacje" },
          { title: "Blokady", href: "/admin/reservations#blokady", icon: ShieldX, desc: "Blokady terminów" },
        ],
      },
      {
        title: "Kreator ofert", icon: Tag,
        children: [
          { title: "Lista ofert", href: "/admin/offers", icon: Receipt, desc: "Zarządzaj ofertami" },
          { title: "Cenniki", href: "/admin/offers#cenniki", icon: DollarSign, desc: "Tabele cenowe" },
        ],
      },
      { title: "Zasoby", href: "/admin/resources", icon: Warehouse },
      { title: "Udogodnienia", href: "/admin/amenities", icon: Sparkles },
      { title: "Dodatki", href: "/admin/addons", icon: Package },
      {
        title: "System cenowy", icon: DollarSign,
        children: [
          { title: "Sezony", href: "/admin/pricing#seasons", icon: CalendarDays, desc: "Okresy cenowe" },
          { title: "Plany cenowe", href: "/admin/pricing#ratePlans", icon: Layers, desc: "Warianty cen" },
          { title: "Cennik", href: "/admin/pricing#prices", icon: DollarSign, desc: "Tabela cen" },
          { title: "Kody rabatowe", href: "/admin/pricing#promos", icon: TicketPercent, desc: "Promocje i zniżki" },
        ],
      },
      { title: "Klienci", href: "/admin/clients", icon: Users },
      {
        title: "Ustawienia", icon: Settings,
        children: [
          { title: "Rezerwacje", href: "/admin/config#reservations", icon: CalendarDays, desc: "Godziny, terminy płatności" },
          { title: "Płatności", href: "/admin/config#payments", icon: CreditCard, desc: "Metody, depozyt" },
          { title: "Obiekt", href: "/admin/config#object", icon: Warehouse, desc: "Dane firmy" },
        ],
      },
    ],
  },
  {
    label: "Finanse",
    items: [
      { title: "Płatności", href: "/admin/payments", icon: CreditCard, badge: "Wkrótce" },
      { title: "Dokumenty", href: "/admin/documents", icon: FileText },
    ],
  },
  {
    label: "Pozostałe",
    items: [
      {
        title: "CRM", icon: Contact, badge: "Wkrótce",
        children: [
          { title: "Kontakty", href: "/admin/crm", icon: Users, desc: "Baza kontaktów" },
          { title: "Kampanie", href: "/admin/crm#kampanie", icon: Megaphone, desc: "Działania marketingowe" },
          { title: "Komunikacja", href: "/admin/crm#komunikacja", icon: MailOpen, desc: "Wiadomości" },
        ],
      },
      {
        title: "Analizy", icon: BarChart3,
        children: [
          { title: "Raporty", href: "/admin/dashboard#raporty", icon: ClipboardList, desc: "Zestawienia" },
          { title: "Statystyki", href: "/admin/dashboard#statystyki", icon: BarChart3, desc: "Wykresy i trendy" },
        ],
      },
      { title: "Użytkownicy", href: "/admin/users", icon: Users },
      {
        title: "Ustawienia globalne", icon: Globe,
        children: [
          { title: "Wygląd widżetu", href: "/admin/global-settings/appearance", icon: Palette, desc: "Logo, kolory, czcionka" },
          { title: "Powiadomienia e-mail", href: "/admin/global-settings/email", icon: MailOpen, desc: "Nadawca, bank, przypomnienia" },
          { title: "Szablony e-mail", href: "/admin/global-settings/email-templates", icon: FileCode, desc: "Edycja wyglądu powiadomień" },
          { title: "Logi e-mail", href: "/admin/global-settings/email-logs", icon: ListChecks, desc: "Historia wysłanych wiadomości" },
        ],
      },
    ],
  },
];

/* ═══ Active state logic ═══ */

// We track "activeHref" — the full href (with hash) of last clicked sidebar link.
// This ensures only ONE item is ever highlighted, even when multiple children share a base path.

function isOnPage(pathname: string, href: string): boolean {
  const base = href.split("#")[0];
  return pathname === base || pathname.startsWith(base + "/");
}

function parentContainsPage(pathname: string, item: MenuItem): boolean {
  if (item.href) return isOnPage(pathname, item.href);
  if (item.children) return item.children.some(c => isOnPage(pathname, c.href));
  return false;
}

/* ═══ Mobile Sub-page ═══ */

function MobileSubPage({
  item, onBack, onNavigate, pathname, activeHref,
}: {
  item: MenuItem; onBack: () => void; onNavigate: (href: string) => void; pathname: string; activeHref: string;
}) {
  const Icon = item.icon;
  return (
    <div className="fixed inset-0 bg-card z-[250] flex flex-col"
      style={{ animation: "slideFromRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
      <div className="flex items-center gap-3 px-5 py-5 shrink-0">
        <button onClick={onBack}
          className="h-10 w-10 rounded-2xl flex items-center justify-center text-foreground shrink-0 transition-all duration-200 hover:bg-muted"
          style={{ border: "2px solid hsl(var(--border))" }}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-[17px] font-bold">{item.title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2.5">
        {item.children?.map((child) => {
          const ChildIcon = child.icon;
          const active = activeHref === child.href;
          return (
            <Link key={child.title} href={child.href} onClick={() => onNavigate(child.href)}
              className={cn("flex items-center gap-4 rounded-[20px] px-5 py-4 transition-all duration-200",
                active ? "bg-primary/8" : "hover:bg-muted/40"
              )} style={{
                border: active ? "2px solid hsl(var(--primary))" : "2px solid hsl(var(--border))",
              }}>
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                active ? "bg-primary/15 text-primary" : "bg-muted text-foreground/60")}>
                <ChildIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-[15px] font-semibold", active ? "text-foreground" : "text-foreground")}>{child.title}</div>
                {child.desc && <div className="text-[12px] text-muted-foreground mt-0.5">{child.desc}</div>}
              </div>
              <ChevronRight className={cn("h-4 w-4 shrink-0", active ? "text-primary/50" : "text-muted-foreground/30")} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ Sidebar ═══ */

export function Sidebar({
  collapsed, onToggle, onNavigate, isMobile,
}: {
  collapsed: boolean; onToggle: () => void; onNavigate?: () => void; isMobile?: boolean;
}) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [mobileSubPage, setMobileSubPage] = useState<MenuItem | null>(null);
  const [activeHref, setActiveHref] = useState("");

  // Determine activeHref from pathname on mount/navigation
  useEffect(() => {
    // Find the best matching href for current pathname
    let bestMatch = "";
    menu.forEach(g => g.items.forEach(item => {
      if (item.href && isOnPage(pathname, item.href)) {
        bestMatch = item.href;
      }
      item.children?.forEach(child => {
        if (isOnPage(pathname, child.href)) {
          // If we already have an activeHref that matches this child, keep it
          if (activeHref === child.href) return;
          // Otherwise pick the first matching child (only if no activeHref set)
          if (!bestMatch || !bestMatch.startsWith(child.href.split("#")[0])) {
            bestMatch = child.href;
          }
        }
      });
    }));
    // Only update if activeHref doesn't match current page
    if (bestMatch && !isOnPage(pathname, activeHref)) {
      setActiveHref(bestMatch);
    }
  }, [pathname]);

  // Auto-open accordion that contains active page
  useEffect(() => {
    const toOpen: string[] = [];
    menu.forEach(g => g.items.forEach(item => {
      if (item.children && parentContainsPage(pathname, item)) toOpen.push(item.title);
    }));
    if (toOpen.length > 0) setOpenMenus(prev => [...new Set([...prev, ...toOpen])]);
  }, [pathname]);

  const toggle = (t: string) =>
    setOpenMenus(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const handleNav = (href?: string) => {
    if (href) setActiveHref(href);
    setMobileSubPage(null);
    if (onNavigate) onNavigate();
  };

  const isExpanded = !collapsed;

  // Check if a specific href is the active one
  const isActive = (href: string): boolean => activeHref === href;

  // Check if parent accordion should be styled as containing active child
  const isParentActive = (item: MenuItem): boolean => {
    if (item.href) return activeHref === item.href;
    if (item.children) return item.children.some(c => c.href === activeHref);
    return false;
  };

  return (
    <>
      {isMobile && mobileSubPage && (
        <MobileSubPage item={mobileSubPage} onBack={() => setMobileSubPage(null)}
          onNavigate={(href) => handleNav(href)} pathname={pathname} activeHref={activeHref} />
      )}

      <aside className={cn(
        "flex flex-col bg-card border-r transition-all duration-300 ease-out-expo",
        isMobile ? "w-full h-full" : cn("h-screen", collapsed ? "w-[72px]" : "w-[264px]")
      )}>
        {/* ── Logo ── */}
        <div className={cn("flex items-center justify-between border-b shrink-0", isMobile ? "px-5 h-16" : "px-4 h-16")}>
          {collapsed && !isMobile ? (
            <div className="flex items-center justify-center w-full">
              <span className="text-[14px] font-bold text-primary tracking-tight">ZW</span>
            </div>
          ) : (
            <div>
              <span className="block text-[15px] font-bold tracking-tight text-foreground leading-tight">Zielone Wzgórza</span>
              <span className="block text-[10px] font-medium text-muted-foreground/40 mt-0.5">v.1.0</span>
            </div>
          )}
          {onNavigate && (
            <button onClick={onNavigate}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className={cn("flex-1 overflow-y-auto", isMobile ? "px-4 py-4" : "px-3 py-4")}>
          {menu.map((group, gi) => (
            <div key={gi} className={cn(gi > 0 && "mt-4")}>
              {group.label && (isExpanded || isMobile) && (
                <div className={cn("mb-2 flex items-center gap-2", isMobile ? "px-1" : "px-3")}>
                  <span className="text-[13px] font-bold text-foreground/80">{group.label}</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}
              {collapsed && group.label && !isMobile && <div className="mb-2 h-px bg-border/50 mx-2" />}

              <div className={cn(isMobile ? "space-y-2" : "space-y-0.5")}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isOpen = openMenus.includes(item.title);
                  const parentActive = isParentActive(item);

                  /* ═══ MOBILE: items with children ═══ */
                  if (item.children && isMobile) {
                    return (
                      <button key={item.title} onClick={() => setMobileSubPage(item)}
                        className={cn(
                          "flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[14px] font-semibold transition-all duration-200 text-left",
                          parentActive ? "bg-primary/8 text-foreground" : "text-foreground hover:bg-muted/50"
                        )} style={{
                          border: parentActive ? "2px solid hsl(var(--primary))" : "2px solid hsl(var(--border))",
                        }}>
                        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
                          parentActive ? "bg-primary/15 text-primary" : "bg-muted text-foreground/60")}>
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <span className="flex-1">{item.title}</span>
                        {item.badge && <span className="rounded-full bg-muted px-2.5 py-0.5 text-[9px] font-bold text-muted-foreground mr-1">{item.badge}</span>}
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      </button>
                    );
                  }

                  /* ═══ MOBILE: regular item ═══ */
                  if (isMobile) {
                    const itemActive = isActive(item.href || "");
                    return (
                      <Link key={item.title} href={item.href || "#"} onClick={() => handleNav(item.href)}
                        className={cn(
                          "flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[14px] font-semibold transition-all duration-200",
                          itemActive ? "bg-primary/8 text-foreground" : "text-foreground hover:bg-muted/50"
                        )} style={{
                          border: itemActive ? "2px solid hsl(var(--primary))" : "2px solid hsl(var(--border))",
                        }}>
                        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
                          itemActive ? "bg-primary/15 text-primary" : "bg-muted text-foreground/60")}>
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <span className="flex-1">{item.title}</span>
                        {item.badge && <span className="rounded-full bg-muted px-2.5 py-0.5 text-[9px] font-bold text-muted-foreground">{item.badge}</span>}
                      </Link>
                    );
                  }

                  /* ═══ DESKTOP: collapsed icon-only ═══ */
                  if (collapsed) {
                    return (
                      <Link key={item.title} href={item.href || item.children?.[0]?.href || "#"}
                        onClick={() => handleNav(item.href || item.children?.[0]?.href)}
                        className={cn(
                          "group flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all duration-300",
                          parentActive ? "bg-primary/12 text-primary" : "text-foreground/40 hover:bg-muted hover:text-foreground"
                        )} title={item.title}>
                        <Icon className="h-[18px] w-[18px]" />
                      </Link>
                    );
                  }

                  /* ═══ DESKTOP: accordion (has children) ═══ */
                  if (item.children) {
                    return (
                      <div key={item.title}>
                        <button onClick={() => toggle(item.title)}
                          className={cn(
                            "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200",
                            parentActive ? "text-foreground bg-muted/50" : "text-foreground/60 hover:text-foreground hover:bg-muted/30"
                          )}>
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                            parentActive ? "bg-primary/12 text-primary" : "text-foreground/40 group-hover:text-foreground/60"
                          )}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="truncate flex-1 text-left">{item.title}</span>
                          {item.badge && <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">{item.badge}</span>}
                          <ChevronDown className={cn(
                            "h-3.5 w-3.5 text-foreground/25 transition-transform duration-200 shrink-0",
                            isOpen && "rotate-180"
                          )} />
                        </button>

                        <div className={cn(
                          "overflow-hidden transition-all duration-200",
                          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <div className="mt-0.5 ml-[22px] space-y-0.5 pl-3"
                            style={{ borderLeft: "2px solid hsl(var(--border) / 0.5)" }}>
                            {item.children.map(child => {
                              const ChildIcon = child.icon;
                              const childActive = isActive(child.href);
                              return (
                                <Link key={child.title} href={child.href} onClick={() => handleNav(child.href)}
                                  className={cn(
                                    "group/child flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-all duration-200",
                                    childActive
                                      ? "text-foreground font-semibold bg-muted/50"
                                      : "text-foreground/45 font-medium hover:text-foreground/80 hover:bg-muted/40"
                                  )}>
                                  <ChildIcon className={cn("h-3.5 w-3.5 shrink-0",
                                    childActive ? "text-primary" : "text-foreground/30 group-hover/child:text-foreground/50"
                                  )} />
                                  <span>{child.title}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  /* ═══ DESKTOP: regular item ═══ */
                  const itemActive = isActive(item.href || "");
                  return (
                    <Link key={item.title} href={item.href || "#"} onClick={() => handleNav(item.href)}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200",
                        itemActive
                          ? "text-foreground bg-muted/50"
                          : "text-foreground/60 hover:text-foreground hover:bg-muted/30"
                      )}>
                      <div className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                        itemActive
                          ? "bg-primary/12 text-primary"
                          : "text-foreground/40 group-hover:text-foreground/60"
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate flex-1">{item.title}</span>
                      {item.badge && <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">{item.badge}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {isMobile && <div className="h-8" />}
        </nav>

        {/* ── Design System link ── */}
        <div className={cn("shrink-0 border-t border-border/40", isMobile ? "px-4 py-3" : "px-3 py-3")}>
          <Link href="/admin/design-system"
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200",
              pathname === "/admin/design-system" && "bg-muted text-foreground",
              collapsed && !isMobile && "justify-center px-0"
            )}>
            <Palette className="h-4 w-4 shrink-0" />
            {(!collapsed || isMobile) && <span className="text-[12px] font-medium">Design System</span>}
          </Link>
        </div>

        {/* ── Collapse toggle ── */}
        <div className="px-3 py-3 border-t hidden lg:block shrink-0">
          <button onClick={onToggle}
            className="flex h-9 w-full items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300 ease-out-expo", collapsed && "rotate-180")} />
            {!collapsed && <span className="ml-2 text-[12px] font-medium">Zwiń menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
