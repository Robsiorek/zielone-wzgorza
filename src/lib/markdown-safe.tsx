/**
 * markdown-safe.tsx — The ONLY Markdown renderer in the entire system.
 *
 * B5a: Used in PolicyModal (house rules, cancellation policy),
 * ResourceDetail (longDescription), and all future Markdown displays.
 *
 * Two layers:
 *   - sanitizeMarkdown(raw): strips HTML from source (pre-render, non-React)
 *   - SafeMarkdown component: renders with rehype-sanitize (render-time)
 * Together: defense-in-depth against injection.
 *
 * Strict tag whitelist (start tight, expand consciously):
 *   p, strong, em, ul, ol, li, h2, h3, blockquote, a, br
 *
 * Explicitly excluded:
 *   - img (not needed in policy/description, reduces attack surface)
 *   - code, pre (no code content in guest-facing texts)
 *   - table/* (no tables in current content types)
 *   - h1 (reserved for page titles, not inline content)
 *   - h4-h6, b, i, u (unnecessary at this stage)
 *   - hr (not needed in policy/description context)
 *
 * To expand: add tags to ALLOWED_TAGS and map in components.
 * Every addition must be a conscious decision documented here.
 *
 * Dependencies: react-markdown, rehype-sanitize (in package.json).
 */

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// ═══════════════════════════════════════════
// Strict sanitization schema
// ═══════════════════════════════════════════

/**
 * Closed whitelist. Only these tags pass through sanitization.
 * Everything else is stripped from the output.
 */
const ALLOWED_TAGS = [
  "p", "a", "strong", "em",
  "ul", "ol", "li",
  "h2", "h3",
  "blockquote",
  "br",
] as const;

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...ALLOWED_TAGS],
  attributes: {
    ...defaultSchema.attributes,
    a: ["href", "title", "target", "rel"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
  },
};

// ═══════════════════════════════════════════
// sanitizeMarkdown — non-React helper
// ═══════════════════════════════════════════

/**
 * Strip raw HTML from Markdown source text.
 *
 * Use case: sanitize content before storage, or outside React context
 * (server-side extraction, tests, preview).
 *
 * This is the pre-render layer. SafeMarkdown applies rehype-sanitize
 * at render time as the second layer. Together they form defense-in-depth.
 *
 * Strips: all HTML tags (including self-closing), preserves Markdown syntax.
 */
export function sanitizeMarkdown(raw: string): string {
  if (!raw) return "";
  // Strip HTML tags (including self-closing like <br/>, <img ... />)
  // Preserves Markdown formatting: **bold**, _italic_, [links](url), etc.
  return raw.replace(/<\/?[a-zA-Z][^>]*\/?>/g, "").trim();
}

// ═══════════════════════════════════════════
// SafeMarkdown component
// ═══════════════════════════════════════════

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders Markdown content with strict sanitization.
 *
 * Element mapping enforces consistent typography aligned with
 * Design System v1.8 and engine widget theme CSS variables.
 *
 * Links: target="_blank" only for external (http/https), not for mailto.
 */
export function SafeMarkdown({ content, className = "" }: SafeMarkdownProps) {
  if (!content) return null;

  return (
    <div className={`safe-markdown ${className}`}>
      <ReactMarkdown
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          // ── Links ──
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          // ── Headings (h2, h3 only) ──
          h2: ({ children }) => (
            <h2 className="text-[16px] font-bold mt-4 mb-2 text-foreground">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[15px] font-semibold mt-3 mb-1.5 text-foreground">{children}</h3>
          ),
          // ── Paragraph ──
          p: ({ children }) => (
            <p className="text-[14px] leading-relaxed mb-3 text-foreground/90">{children}</p>
          ),
          // ── Lists ──
          ul: ({ children }) => (
            <ul className="text-[14px] leading-relaxed mb-3 ml-4 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-[14px] leading-relaxed mb-3 ml-4 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground/90">{children}</li>
          ),
          // ── Blockquote ──
          blockquote: ({ children }) => (
            <blockquote className="border-l-[3px] border-primary/30 pl-4 my-3 text-[14px] text-foreground/70 italic">
              {children}
            </blockquote>
          ),
          // ── Inline ──
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
