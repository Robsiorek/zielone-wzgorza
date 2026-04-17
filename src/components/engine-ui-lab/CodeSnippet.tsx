"use client";

/**
 * CodeSnippet — code block for UI Lab
 * ────────────────────────────────────────────────────────────────────────
 * Renders a preformatted code block styled via `.eui-lab-code`. Optional
 * copy button appears in the top-right corner. No syntax highlighting
 * here on purpose — a future pass can wire Prism or Shiki when we need
 * it, but for Runda 1 raw monospace is enough and keeps the bundle tiny.
 *
 * Isolation: uses ONLY engine-ui classes. No admin CSS leaks in.
 */

import * as React from "react";
import { Check, Copy } from "lucide-react";

export interface CodeSnippetProps {
  /** Code text. Rendered verbatim inside <pre>. */
  code: string;
  /** Optional language label (e.g. "tsx") — shown as a small tag. */
  language?: string;
  /** Show the "Copy" button in the corner. Default `true`. */
  showCopy?: boolean;
  /** Extra className merged onto the root. */
  className?: string;
}

export function CodeSnippet({
  code,
  language,
  showCopy = true,
  className,
}: CodeSnippetProps) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* copy failed (no clipboard permission); silently no-op */
    }
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const rootClass = [
    "eui-lab-code-wrap",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      {(language || showCopy) && (
        <div className="eui-lab-code-toolbar">
          {language && <span className="eui-lab-code-lang">{language}</span>}
          {showCopy && (
            <button
              type="button"
              className="eui-lab-code-copy"
              onClick={handleCopy}
              aria-label={copied ? "Skopiowano" : "Kopiuj kod"}
            >
              {copied ? (
                <>
                  <Check size={14} aria-hidden="true" />
                  <span>Skopiowano</span>
                </>
              ) : (
                <>
                  <Copy size={14} aria-hidden="true" />
                  <span>Kopiuj</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
      <pre className="eui-lab-code">{code}</pre>
    </div>
  );
}
