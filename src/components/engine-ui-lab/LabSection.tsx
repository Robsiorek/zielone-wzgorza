"use client";

/**
 * LabSection — top-level section wrapper in UI Lab.
 * Now supports an optional icon displayed alongside the title,
 * matching the sidebar navigation icons.
 */

import * as React from "react";

export interface LabSectionProps {
  id: string;
  title: string;
  description?: React.ReactNode;
  /** Optional icon matching sidebar nav. Displayed left of title. */
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function LabSection({ id, title, description, icon, children }: LabSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} className="eui-lab-section" aria-labelledby={headingId}>
      <header className="eui-lab-section-header">
        <h2 id={headingId} className="eui-lab-section-title">
          {icon && <span className="eui-lab-section-icon" aria-hidden="true">{icon}</span>}
          {title}
        </h2>
        {description && (
          <p className="eui-lab-section-description">{description}</p>
        )}
      </header>
      {children}
    </section>
  );
}
