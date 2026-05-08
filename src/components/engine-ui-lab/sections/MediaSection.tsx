"use client";

import * as React from "react";
import { Mountain, Plane, Camera, Image as ImageIcon } from "lucide-react";
import {
  MediaFrame,
  ImagePlaceholder,
  MediaOverlay,
  MediaBadge,
  FavoriteOverlay,
  GalleryNavButton,
  ImageCounter,
  ThumbnailStrip,
} from "@/components/engine-ui/media";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { Stack } from "@/components/engine-ui/layout/Stack";
import { Inline } from "@/components/engine-ui/layout/Inline";
import { Text } from "@/components/engine-ui/text/Text";

const MOCK_IMAGES = [
  { url: "https://picsum.photos/seed/cabin1/800/600", alt: "Drewniana chatka w lesie" },
  { url: "https://picsum.photos/seed/cabin2/800/600", alt: "Domek górski" },
  { url: "https://picsum.photos/seed/cabin3/800/600", alt: "Drewniana willa" },
];

export function MediaSection() {
  const [favorited, setFavorited] = React.useState(false);
  const [activeImage, setActiveImage] = React.useState(0);

  return (
    <LabSection
      id="media"
      title="Media + Image"
      icon={<ImageIcon />}
      description="Generyczne kontenery dla obrazów + overlay positioning + navigation. Composition z Part 2 (FavoriteButton) i Part 4 (NavigationArrow)."
    >
      {/* 1. MediaFrame — aspect ratios */}
      <ComponentShowcase title="MediaFrame — aspect ratios" caption="5 named + number/string escape hatch."
        info={<SpecimenInfo id="aspectRatio" hint='"square"|"portrait"|"photo"|"video"|"cinema"|number|string.' />}
      >
        <Inline gap="md" align="start">
          {(["square", "portrait", "photo", "video", "cinema"] as const).map((ratio) => (
            <Stack key={ratio} gap="xs" style={{ width: 120 }}>
              <Text variant="caption">{ratio}</Text>
              <MediaFrame aspectRatio={ratio} radius="md">
                <img src={MOCK_IMAGES[0].url} alt={MOCK_IMAGES[0].alt} loading="lazy" />
              </MediaFrame>
            </Stack>
          ))}
        </Inline>
      </ComponentShowcase>

      {/* 2. MediaFrame — radius */}
      <ComponentShowcase title="MediaFrame — radius" caption="6 wariantów zaokrąglenia."
        info={<SpecimenInfo id="radius" hint='"none"|"sm"|"md"|"lg"|"xl"|"2xl".' />}
      >
        <Inline gap="md" align="start">
          {(["none", "sm", "md", "lg", "xl", "2xl"] as const).map((r) => (
            <Stack key={r} gap="xs" style={{ width: 100 }}>
              <Text variant="caption">{r}</Text>
              <MediaFrame aspectRatio="square" radius={r}>
                <img src={MOCK_IMAGES[0].url} alt={MOCK_IMAGES[0].alt} loading="lazy" />
              </MediaFrame>
            </Stack>
          ))}
        </Inline>
      </ComponentShowcase>

      {/* 3. ImagePlaceholder — sizes */}
      <ComponentShowcase title="ImagePlaceholder — sizes" caption="sm/md/lg. Typography z utility classes Part 6."
        info={<SpecimenInfo id="size" hint="sm→eui-caption, md→eui-body-small, lg→eui-body." />}
      >
        <Inline gap="md" align="start">
          {(["sm", "md", "lg"] as const).map((s) => (
            <Stack key={s} gap="xs" style={{ width: 140 }}>
              <Text variant="caption">{s}</Text>
              <MediaFrame aspectRatio="square" radius="md">
                <ImagePlaceholder size={s} text="Brak zdjęcia" />
              </MediaFrame>
            </Stack>
          ))}
        </Inline>
      </ComponentShowcase>

      {/* 4. ImagePlaceholder — custom icon */}
      <ComponentShowcase title="ImagePlaceholder — custom icon" caption="Dowolna ikona + tekst."
        info={<SpecimenInfo id="icon + text" hint="Custom Lucide icon. Tekst pod ikoną." />}
      >
        <Inline gap="md" align="start">
          <MediaFrame aspectRatio="photo" radius="md" style={{ width: 200 }}>
            <ImagePlaceholder icon={<Mountain size={48} aria-hidden="true" />} text="Zdjęcie wkrótce" size="lg" />
          </MediaFrame>
          <MediaFrame aspectRatio="photo" radius="md" style={{ width: 200 }}>
            <ImagePlaceholder icon={<Plane size={32} aria-hidden="true" />} text="Pakiet podróżny" />
          </MediaFrame>
          <MediaFrame aspectRatio="photo" radius="md" style={{ width: 200 }}>
            <ImagePlaceholder icon={<Camera size={24} aria-hidden="true" />} text="Galeria w przygotowaniu" size="sm" />
          </MediaFrame>
        </Inline>
      </ComponentShowcase>

      {/* 5. MediaOverlay — positions */}
      <ComponentShowcase title="MediaOverlay — positions" caption="4 rogi + center + cover."
        info={<SpecimenInfo id="position" hint="Absolute positioning wewnątrz MediaFrame." />}
      >
        <MediaFrame aspectRatio="video" radius="lg" style={{ maxWidth: 600 }}>
          <img src={MOCK_IMAGES[1].url} alt={MOCK_IMAGES[1].alt} loading="lazy" />
          <MediaOverlay position="top-left"><MediaBadge variant="brand">top-left</MediaBadge></MediaOverlay>
          <MediaOverlay position="top-right"><MediaBadge variant="default">top-right</MediaBadge></MediaOverlay>
          <MediaOverlay position="bottom-left"><MediaBadge variant="dark">bottom-left</MediaBadge></MediaOverlay>
          <MediaOverlay position="bottom-right"><MediaBadge variant="default">bottom-right</MediaBadge></MediaOverlay>
          <MediaOverlay position="center"><MediaBadge variant="dark">center</MediaBadge></MediaOverlay>
        </MediaFrame>
      </ComponentShowcase>

      {/* 6. MediaBadge — variants */}
      <ComponentShowcase title="MediaBadge — variants" caption="3 warianty. Typography z .eui-label."
        info={<SpecimenInfo id="variant" hint='"default" (white pill), "brand", "dark" (frosted).' />}
      >
        <MediaFrame aspectRatio="video" radius="lg" style={{ maxWidth: 600 }}>
          <img src={MOCK_IMAGES[2].url} alt={MOCK_IMAGES[2].alt} loading="lazy" />
          <MediaOverlay position="top-left">
            <Inline gap="sm">
              <MediaBadge variant="brand">Wybór gości</MediaBadge>
              <MediaBadge variant="default">Nowość</MediaBadge>
              <MediaBadge variant="dark">15 min od centrum</MediaBadge>
            </Inline>
          </MediaOverlay>
        </MediaFrame>
      </ComponentShowcase>

      {/* 7. FavoriteOverlay */}
      <ComponentShowcase title="FavoriteOverlay — positioned wrapper" caption="Composition: MediaOverlay + FavoriteButton (Part 2). Generic, NOT booking-specific."
        info={<SpecimenInfo id="FavoriteOverlay" hint="position=top-right (default). Pure forwarding." />}
      >
        <MediaFrame aspectRatio="photo" radius="lg" style={{ maxWidth: 400 }}>
          <img src={MOCK_IMAGES[0].url} alt={MOCK_IMAGES[0].alt} loading="lazy" />
          <FavoriteOverlay favorited={favorited} onChange={setFavorited} aria-label="Dodaj do ulubionych" />
        </MediaFrame>
      </ComponentShowcase>

      {/* 8. GalleryNavButton — hoverable */}
      <ComponentShowcase title="GalleryNavButton — hoverable (NavigationArrow composition)" caption="Fade-in on hover. stopPropagation. Mobile: always visible."
        info={<SpecimenInfo id="GalleryNavButton" hint="Marker class only. Positioning from NavigationArrow wrapper." />}
      >
        <MediaFrame aspectRatio="video" radius="lg" hoverable style={{ maxWidth: 600 }}>
          <img src={MOCK_IMAGES[activeImage].url} alt={MOCK_IMAGES[activeImage].alt} loading="lazy" />
          {activeImage > 0 && (
            <GalleryNavButton direction="left" onClick={() => setActiveImage(activeImage - 1)} />
          )}
          {activeImage < MOCK_IMAGES.length - 1 && (
            <GalleryNavButton direction="right" onClick={() => setActiveImage(activeImage + 1)} />
          )}
          <MediaOverlay position="bottom-right" inset="sm">
            <ImageCounter current={activeImage + 1} total={MOCK_IMAGES.length} />
          </MediaOverlay>
        </MediaFrame>
      </ComponentShowcase>

      {/* 9. ImageCounter — variants */}
      <ComponentShowcase title="ImageCounter — variants (tabular-nums)" caption="Pill + minimal. font-variant-numeric: tabular-nums."
        info={<SpecimenInfo id="variant" hint="pill (white bg), minimal (text only, use with scrim)." />}
      >
        <Inline gap="lg" align="start">
          <MediaFrame aspectRatio="photo" radius="md" style={{ width: 240 }}>
            <img src={MOCK_IMAGES[0].url} alt={MOCK_IMAGES[0].alt} loading="lazy" />
            <MediaOverlay position="bottom-right" inset="sm">
              <ImageCounter current={3} total={12} variant="pill" />
            </MediaOverlay>
          </MediaFrame>
          <MediaFrame aspectRatio="photo" radius="md" style={{ width: 240 }}>
            <img src={MOCK_IMAGES[1].url} alt={MOCK_IMAGES[1].alt} loading="lazy" />
            <MediaOverlay position="cover" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 50%)" }} />
            <MediaOverlay position="bottom-right" inset="sm">
              <ImageCounter current={3} total={12} variant="minimal" />
            </MediaOverlay>
          </MediaFrame>
        </Inline>
      </ComponentShowcase>

      {/* 10. ThumbnailStrip — minimal v1 */}
      <ComponentShowcase title="ThumbnailStrip — minimal v1" caption="Button group (role=group). Click + native keyboard (Enter/Space). Bez arrow keys w v1."
        info={<SpecimenInfo id="ThumbnailStrip" hint="aria-pressed. Default tab order. sm/md sizes." />}
      >
        <Stack gap="md" style={{ maxWidth: 600 }}>
          <MediaFrame aspectRatio="video" radius="lg">
            <img src={MOCK_IMAGES[activeImage].url} alt={MOCK_IMAGES[activeImage].alt} loading="lazy" />
          </MediaFrame>
          <ThumbnailStrip images={MOCK_IMAGES} activeIndex={activeImage} onSelect={setActiveImage} size="md" />
        </Stack>
      </ComponentShowcase>

      {/* 11. Full composition */}
      <ComponentShowcase title="Full composition — wszystko razem" caption="MediaFrame + badge + favorite + nav + counter. Composes Part 2, 4, 7."
        info={<SpecimenInfo id="composition" hint="Hoverable. Badge top-left, favorite top-right, counter bottom-right." />}
      >
        <MediaFrame aspectRatio="photo" radius="xl" hoverable style={{ maxWidth: 480 }}>
          <img src={MOCK_IMAGES[0].url} alt={MOCK_IMAGES[0].alt} loading="lazy" />
          <MediaOverlay position="top-left">
            <MediaBadge variant="brand">Wybór gości</MediaBadge>
          </MediaOverlay>
          <FavoriteOverlay favorited={favorited} onChange={setFavorited} position="top-right" />
          <GalleryNavButton direction="left" onClick={() => {}} />
          <GalleryNavButton direction="right" onClick={() => {}} />
          <MediaOverlay position="bottom-right" inset="sm">
            <ImageCounter current={1} total={12} />
          </MediaOverlay>
        </MediaFrame>
      </ComponentShowcase>
    </LabSection>
  );
}
