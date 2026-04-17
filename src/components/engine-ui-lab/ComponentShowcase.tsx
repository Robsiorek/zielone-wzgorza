"use client";

/**
 * ComponentShowcase — individual component preview card
 * ────────────────────────────────────────────────────────────────────────
 * One card per variant/state/demo. Typical shape:
 *
 *   ┌─────────────────────────────────┐
 *   │ Title                            │
 *   │ Caption (what this demonstrates) │
 *   ├─────────────────────────────────┤
 *   │                                  │
 *   │       [live component]           │
 *   │                                  │
 *   ├─────────────────────────────────┤
 *   │ <code snippet (optional)>        │
 *   └─────────────────────────────────┘
 *
 * The stage has two sub-variants:
 *   - "default"      — padded grey box, good for most demos
 *   - "transparent"  — no background, for components whose own canvas
 *                      matters (e.g. SearchBar variants on their own bg)
 */

import * as React from "react";
import { CodeSnippet } from "./CodeSnippet";

export type ShowcaseStageVariant = "default" | "transparent";

export interface ComponentShowcaseProps {
  /** Card title. */
  title: string;
  /** Optional description under the title. */
  caption?: React.ReactNode;
  /** Stage background variant. Default `"default"`. */
  stage?: ShowcaseStageVariant;
  /** The live component(s) to render in the stage. */
  children: React.ReactNode;
  /** Optional code sample shown below the stage. */
  code?: string;
  /** Optional language label for the code block. */
  codeLanguage?: string;
  /** Extra className merged onto the root. */
  className?: string;
}

export function ComponentShowcase({
  title,
  caption,
  stage = "default",
  children,
  code,
  codeLanguage = "tsx",
  className,
}: ComponentShowcaseProps) {
  const stageClass = [
    "eui-lab-showcase-stage",
    stage === "transparent" && "eui-stage-transparent",
  ]
    .filter(Boolean)
    .join(" ");

  const rootClass = ["eui-lab-showcase", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <header className="eui-lab-showcase-header">
        <h3 className="eui-lab-showcase-title">{title}</h3>
        {caption && <p className="eui-lab-showcase-caption">{caption}</p>}
      </header>
      <div className={stageClass}>{children}</div>
      {code && <CodeSnippet code={code} language={codeLanguage} />}
    </div>
  );
}
