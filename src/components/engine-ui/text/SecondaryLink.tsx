"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

export interface SecondaryLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  external?: boolean;
  variant?: "default" | "subtle" | "inverse";
  size?: "sm" | "md" | "lg";
  iconLeft?: React.ReactNode;
  children: React.ReactNode;
}

export const SecondaryLink = React.forwardRef<HTMLAnchorElement, SecondaryLinkProps>(
  function SecondaryLink(
    { external = false, variant = "default", size = "md", iconLeft, className, children, target, rel, ...rest },
    ref
  ) {
    const sizeClass = size === "sm" ? "eui-caption" : size === "lg" ? "eui-body" : "eui-body-small";

    const classes = [
      "eui-secondary-link",
      `eui-secondary-link-${variant}`,
      sizeClass,
      className,
    ].filter(Boolean).join(" ");

    return (
      <a ref={ref} className={classes}
        target={external ? "_blank" : target}
        rel={external ? "noopener noreferrer" : rel}
        {...rest}
      >
        {iconLeft && <span className="eui-secondary-link-icon-left">{iconLeft}</span>}
        <span className="eui-secondary-link-label">{children}</span>
        {external && <ExternalLink size={12} className="eui-secondary-link-external" aria-hidden="true" />}
      </a>
    );
  }
);
