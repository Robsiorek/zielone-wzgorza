"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/engine-ui/skeleton/Skeleton";
import { SkeletonText } from "@/components/engine-ui/skeleton/SkeletonText";
import { SkeletonCircle } from "@/components/engine-ui/skeleton/SkeletonCircle";
import { SkeletonImage } from "@/components/engine-ui/skeleton/SkeletonImage";
import { SkeletonCard } from "@/components/engine-ui/skeleton/SkeletonCard";
import { SkeletonRegion } from "@/components/engine-ui/skeleton/SkeletonRegion";
import { Spinner, LoadingOverlay } from "@/components/engine-ui/loading";

import { Stack } from "@/components/engine-ui/layout/Stack";
import { Inline } from "@/components/engine-ui/layout/Inline";
import { Text } from "@/components/engine-ui/text/Text";

import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { CodeSnippet } from "../CodeSnippet";

const USE_DELAYED_LOADING_EXAMPLE = `// Anti-flash: pokazuj skeleton tylko jeśli loading > 400ms
const showSkeleton = useDelayedLoading(isLoading, { delay: 400 });

return showSkeleton ? <SkeletonCard /> : <ResultCard data={data} />;`;

export function SkeletonSection() {
  return (
    <LabSection
      id="skeleton"
      title="Stany ładowania"
      icon={<Loader2 />}
      description="Primitives dla stanów oczekiwania: skeleton (placeholder treści), spinner (akcja w toku), overlay (blokada kontekstu)."
    >
      {/* 1. Skeleton — foundation primitive */}
      <ComponentShowcase
        title="Skeleton"
        caption="Open-shape building block. Width, height, radius."
        info={<SpecimenInfo id="Skeleton" hint="forwardRef HTMLSpanElement" />}
      >
        <Skeleton width={200} height={20} radius="md" />
      </ComponentShowcase>

      {/* 2. SkeletonText — variants */}
      <ComponentShowcase
        title="SkeletonText"
        caption="Pre-shaped text placeholders. Variants: title, body, caption, label."
        info={<SpecimenInfo id="SkeletonText" hint="multi-line: lastLineWidth=70%" />}
      >
        <div style={{ width: 320 }}>
          <Stack gap="md">
            <SkeletonText variant="title" width="60%" />
            <SkeletonText variant="body" lines={3} />
          </Stack>
        </div>
      </ComponentShowcase>

      {/* 3. SkeletonCircle — sizes */}
      <ComponentShowcase
        title="SkeletonCircle"
        caption="Avatar placeholder. Size tokens: xs, sm, md, lg, xl."
        info={<SpecimenInfo id="SkeletonCircle" hint="radius=full + size token" />}
      >
        <Inline gap="md" align="center">
          <SkeletonCircle size="sm" />
          <SkeletonCircle size="md" />
          <SkeletonCircle size="lg" />
        </Inline>
      </ComponentShowcase>

      {/* 4. SkeletonImage — aspect ratios */}
      <ComponentShowcase
        title="SkeletonImage"
        caption="Image placeholder z aspect ratio. Reuse Part 8 helper."
        info={<SpecimenInfo id="SkeletonImage" hint="default photo (4:3)" />}
      >
        <Inline gap="md" align="start">
          <div style={{ width: 160 }}>
            <SkeletonImage aspectRatio="photo" radius="lg" />
          </div>
          <div style={{ width: 160 }}>
            <SkeletonImage aspectRatio="square" radius="lg" />
          </div>
        </Inline>
      </ComponentShowcase>

      {/* 5. SkeletonCard — composite */}
      <ComponentShowcase
        title="SkeletonCard"
        caption="Pre-built card pattern: image + title + body + caption."
        info={<SpecimenInfo id="SkeletonCard" hint="composes Image + Text × 2-3" />}
      >
        <div style={{ width: 280 }}>
          <SkeletonCard showImage textLines={3} />
        </div>
      </ComponentShowcase>

      {/* 6. SkeletonRegion — a11y wrapper */}
      <ComponentShowcase
        title="SkeletonRegion"
        caption="A11y wrapper: aria-busy + conditional aria-live. Region mówi screen readerowi że treść się ładuje."
        info={<SpecimenInfo id="SkeletonRegion" hint='role="status" + aria-live="polite"' />}
      >
        <SkeletonRegion loading={true} ariaLive="polite" label="Ładowanie...">
          <div style={{ width: 280 }}>
            <SkeletonCard showImage textLines={3} />
          </div>
        </SkeletonRegion>
      </ComponentShowcase>

      {/* 7. Spinner — variants */}
      <ComponentShowcase
        title="Spinner"
        caption="Standalone spinner (oddzielny od Button loading state). 3 variants × 3 sizes."
        info={<SpecimenInfo id="Spinner" hint="reuse @keyframes eui-spin" />}
      >
        <Inline gap="lg" align="center">
          <Spinner size="md" variant="default" />
          <Spinner size="md" variant="primary" />
          <div
            style={{
              background: "var(--eui-grey-900)",
              padding: "var(--eui-space-3)",
              borderRadius: "var(--eui-radius-md)",
              display: "inline-flex",
            }}
          >
            <Spinner size="md" variant="inverse" />
          </div>
        </Inline>
      </ComponentShowcase>

      {/* 8. LoadingOverlay — container variant */}
      <ComponentShowcase
        title="LoadingOverlay"
        caption="Overlay z backdrop blur. Container variant blokuje kontekst (NIE fullscreen)."
        info={<SpecimenInfo id="LoadingOverlay" hint='ariaLive="off" default — silent' />}
      >
        <div
          style={{
            position: "relative",
            width: 320,
            height: 200,
            background: "var(--eui-grey-50)",
            borderRadius: "var(--eui-radius-md)",
            padding: "var(--eui-space-4)",
            overflow: "hidden",
          }}
        >
          <Text variant="body-small" color="muted">
            Treść karty/listy (placeholder pod overlay)
          </Text>
          <LoadingOverlay open variant="container" label="Ładowanie..." />
        </div>
      </ComponentShowcase>

      {/* 9. useDelayedLoading hook — code snippet */}
      <ComponentShowcase
        title="useDelayedLoading"
        caption="Anti-flash debouncing hook. Eliminuje 'skeleton flash and gone' dla szybkich requestów (<400ms)."
        info={<SpecimenInfo id="useDelayedLoading" hint="cleanup timers on unmount" />}
      >
        <CodeSnippet language="tsx" code={USE_DELAYED_LOADING_EXAMPLE} />
      </ComponentShowcase>
    </LabSection>
  );
}
