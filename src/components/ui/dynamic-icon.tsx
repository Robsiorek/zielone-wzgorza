/**
 * B3: Dynamic lucide icon renderer — CONTROLLED by registry.
 *
 * Uses ICON_MAP (closed, explicit imports) from amenity-icon-map.ts.
 * Only icons registered in amenity-icons.ts can render.
 * No wildcard import — tree-shakeable, registry is sole gatekeeper.
 *
 * Usage:
 *   <DynamicIcon iconKey="wifi" className="h-4 w-4" />
 *   const IconComponent = getLucideIcon("bed-double");
 */

import React from "react";
import type { LucideIcon } from "lucide-react";
import { ICON_MAP } from "@/lib/amenity-icon-map";
import { isValidIconKey } from "@/lib/amenity-icons";

/** Get a lucide-react icon component by kebab-case key. Registry-gated. */
export function getLucideIcon(iconKey: string): LucideIcon | null {
  if (!isValidIconKey(iconKey)) return null;
  return ICON_MAP[iconKey] || null;
}

/** React component that renders a lucide icon by kebab-case key. Registry-gated. */
export function DynamicIcon({
  iconKey,
  className,
  ...props
}: {
  iconKey: string;
  className?: string;
} & React.SVGAttributes<SVGElement>) {
  const Icon = getLucideIcon(iconKey);
  if (!Icon) return null;
  return <Icon className={className} {...(props as any)} />;
}
