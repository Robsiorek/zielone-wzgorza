/**
 * mergeRefs — combine multiple refs into a single callback ref.
 *
 * Common case: a component uses forwardRef (so its consumer can get a
 * ref to the DOM element) AND internally needs its own ref (e.g. for
 * measuring, focus management). React doesn't let you attach two refs
 * to the same element — mergeRefs lets you assign a single callback
 * ref that forwards writes to all the given refs.
 *
 * Usage:
 *   const Button = React.forwardRef<HTMLButtonElement>((props, ref) => {
 *     const internalRef = useRef<HTMLButtonElement>(null);
 *     return <button ref={mergeRefs(ref, internalRef)} />;
 *   });
 *
 * Handles both object refs (useRef) and callback refs. Tolerates nulls.
 */

import * as React from "react";

type AnyRef<T> =
  | React.MutableRefObject<T | null>
  | React.RefCallback<T>
  | null
  | undefined;

export function mergeRefs<T>(...refs: AnyRef<T>[]): React.RefCallback<T> {
  return (value: T) => {
    for (const ref of refs) {
      if (ref == null) continue;
      if (typeof ref === "function") {
        ref(value);
      } else {
        try {
          (ref as React.MutableRefObject<T | null>).current = value;
        } catch {
          // Some refs are frozen or readonly — silently skip.
        }
      }
    }
  };
}
