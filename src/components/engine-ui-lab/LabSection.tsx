"use client";

/**
 * LabSection — top-level section wrapper in UI Lab
 * ────────────────────────────────────────────────────────────────────────
 * Provides:
 *   - an anchor `id` (for sidebar smooth-scroll navigation)
 *   - a header (title + short description)
 *   - a body region that children fill with ComponentShowcase cards
 *
 * Accessibility:
 *   - Each section is a <section> with aria-labelledby tying it to the
 *     title, so screen readers navigate the page by section correctly.
 */

import * as React from "react";

export interface LabSectionProps {
  /** Anchor id used by the sidebar. Must be unique on the page. */
  id: string;
  /** Section title (large). */
  title: string;
  /** Optional short description under the title. */
  description?: React.ReactNode;
  /** Showcase cards and other content. */
  children: React.ReactNode;
}

export function LabSection({ id, title, description, children }: LabSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} className="eui-lab-section" aria-labelledby={headingId}>
      <header className="eui-lab-section-header">
        <h2 id={headingId} className="eui-lab-section-title">
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
