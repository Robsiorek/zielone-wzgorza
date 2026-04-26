"use client";

/**
 * VisuallyHidden — content present for assistive tech but invisible.
 *
 * Use when:
 *   - An IconButton needs a text label for screen readers ("Zamknij"
 *     while showing only an X icon). Prefer `aria-label` on the button
 *     itself; VisuallyHidden is for cases where you want the label to
 *     become visible in some contexts (e.g. when CSS disabled).
 *   - A heading structures content for screen readers but isn't shown
 *     (e.g. "Wyniki wyszukiwania" before a results list that shows a
 *     filter bar visually).
 *
 * The styling is the standard "clip" technique — takes the element out
 * of the visible flow but keeps it in the a11y tree.
 *
 * Polymorphic via `as` — default "span", often "div" or a heading
 * element depending on context.
 */

import * as React from "react";

export interface VisuallyHiddenProps
  extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
}

const HIDDEN_STYLE: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

export const VisuallyHidden = React.forwardRef<HTMLElement, VisuallyHiddenProps>(
  function VisuallyHidden({ as: Tag = "span", style, children, ...rest }, ref) {
    return React.createElement(
      Tag as string,
      { ref, style: { ...HIDDEN_STYLE, ...style }, ...rest },
      children
    );
  }
);
