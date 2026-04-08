import React from "react";

/**
 * Shared engine layout — isolates public frontend from admin dark mode.
 * .engine-root class triggers CSS override in globals.css:
 * .dark .engine-root { re-declares all light mode variables }
 * data-theme="light" + colorScheme: light prevents dark mode inheritance.
 */
export default function EngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="engine-root min-h-screen bg-background text-foreground"
      data-theme="light"
      style={{ colorScheme: "light" }}
    >
      {children}
    </div>
  );
}
