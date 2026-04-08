"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

export function AdminShell({ children, userName, userEmail }: { children: React.ReactNode; userName?: string; userEmail?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: fullscreen nav overlay */}
      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 z-50 bg-card transition-transform duration-350 ease-out-expo",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
            isMobile={true}
          />
        </div>
      )}

      {/* Desktop: sidebar fixed left */}
      {!isMobile && (
        <div className={cn(
          "fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-out-expo",
          collapsed ? "w-[72px]" : "w-[264px]"
        )}>
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
          />
        </div>
      )}

      {/* Main content wrapper */}
      <div className={cn(
        "min-h-screen transition-all duration-300 ease-out-expo",
        isMobile ? "pl-0" : (collapsed ? "pl-[72px]" : "pl-[264px]")
      )}>
        <Topbar
          sidebarCollapsed={isMobile ? true : collapsed}
          userName={userName}
          userEmail={userEmail}
          onMenuClick={() => setMobileOpen(true)}
          isMobile={isMobile}
        />
        <main className="min-h-[calc(100vh-64px)] p-5 md:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
