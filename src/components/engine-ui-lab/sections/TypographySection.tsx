"use client";

import * as React from "react";
import { Type, Clock, Star, Info, MapPin } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { Text } from "@/components/engine-ui/text/Text";
import { SecondaryLink } from "@/components/engine-ui/text/SecondaryLink";
import { HelperText } from "@/components/engine-ui/text/HelperText";
import { MetaText } from "@/components/engine-ui/text/MetaText";
import { InlineMeta } from "@/components/engine-ui/text/InlineMeta";
import { Eyebrow } from "@/components/engine-ui/text/Eyebrow";
import { SectionHeading } from "@/components/engine-ui/text/SectionHeading";
import { PriceText } from "@/components/engine-ui/text/PriceText";
import { EmptyStateText } from "@/components/engine-ui/text/EmptyStateText";
import { Button } from "@/components/engine-ui/button/Button";

export function TypographySection() {
  return (
    <LabSection id="typography" title="Typografia" icon={<Type />}
      description="Semantyczne wrappery na utility classes. Zero duplikacji tokenów — komponenty używają .eui-body, .eui-caption itd."
    >
      {/* ── Text variants ── */}
      <ComponentShowcase title="Text — warianty" caption="10 wariantów od Display-1 do Label. Mapują na istniejące utility classes."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="display-1" hint="Hero. 48px/700." />
            <SpecimenInfo id="display-2" hint="Sekcja hero. 40px/600." />
            <SpecimenInfo id="title-1" hint="Nagłówek główny. 26px." />
            <SpecimenInfo id="title-2" hint="Podsekcja. 22px." />
            <SpecimenInfo id="title-3" hint="Mały nagłówek. 18px." />
            <SpecimenInfo id="body-large" hint="Intro text. 16px." />
            <SpecimenInfo id="body" hint="Domyślny. 14px." />
            <SpecimenInfo id="body-small" hint="Kompaktowy. 13px." />
            <SpecimenInfo id="caption" hint="Meta info. 12px." />
            <SpecimenInfo id="label" hint="Uppercase. 12px/600." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", width: "100%" }}>
          <Text variant="display-1">Display 1</Text>
          <Text variant="display-2">Display 2</Text>
          <Text variant="title-1">Title 1</Text>
          <Text variant="title-2">Title 2</Text>
          <Text variant="title-3">Title 3</Text>
          <Text variant="body-large">Body Large</Text>
          <Text variant="body">Body — domyślny wariant tekstu</Text>
          <Text variant="body-small">Body Small</Text>
          <Text variant="caption">Caption</Text>
          <Text variant="label">Label</Text>
        </div>
      </ComponentShowcase>

      {/* ── Text colors ── */}
      <ComponentShowcase title="Text — kolory" caption="8 kolorów semantycznych."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="color=primary" hint="Domyślny. Grey-900." />
            <SpecimenInfo id="color=secondary" hint="Grey-600." />
            <SpecimenInfo id="color=muted" hint="Grey-500." />
            <SpecimenInfo id="color=brand" hint="Kolor marki." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Text color="primary">Primary</Text>
          <Text color="secondary">Secondary</Text>
          <Text color="muted">Muted</Text>
          <Text color="brand">Brand</Text>
          <Text color="success">Success</Text>
          <Text color="warning">Warning</Text>
          <Text color="danger">Danger</Text>
          <Text color="info">Info</Text>
        </div>
      </ComponentShowcase>

      {/* ── Text truncate + clamp ── */}
      <ComponentShowcase title="Text — truncate i clamp" caption="Obcinanie tekstu do 1 linii lub N linii."
        info={
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <SpecimenInfo id="truncate" hint="1 linia + ellipsis." />
            <SpecimenInfo id="maxLines=2" hint="N linii + ellipsis." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
          <Text truncate>To jest bardzo długi tekst który powinien zostać obcięty po jednej linii z wielokropkiem na końcu</Text>
          <Text maxLines={2}>To jest bardzo długi akapit który powinien zostać obcięty po dwóch liniach z wielokropkiem. Zawiera dużo tekstu żeby zademonstrować działanie line-clamp w praktyce na prawdziwym contencie.</Text>
        </div>
      </ComponentShowcase>

      {/* ── SecondaryLink variants ── */}
      <ComponentShowcase title="SecondaryLink — warianty" caption="3 warianty wizualne. Underline offset 2px."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=default" hint="Grey-900, hover brand." />
            <SpecimenInfo id="variant=subtle" hint="Grey-600, hover grey-900." />
            <SpecimenInfo id="variant=inverse" hint="Biały. Na ciemnym tle." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <SecondaryLink href="#">Dowiedz się więcej</SecondaryLink>
          <SecondaryLink href="#" variant="subtle">Warunki rezerwacji</SecondaryLink>
          <div style={{ background: "var(--eui-grey-900)", padding: "8px 16px", borderRadius: 8 }}>
            <SecondaryLink href="#" variant="inverse">Na ciemnym tle</SecondaryLink>
          </div>
        </div>
      </ComponentShowcase>

      {/* ── SecondaryLink external + icon ── */}
      <ComponentShowcase title="SecondaryLink — external i ikona" caption="External dodaje target=_blank + ikonę. Icon slot przed tekstem."
        info={
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <SpecimenInfo id="external" hint="Nowa karta + rel noopener." />
            <SpecimenInfo id="iconLeft" hint="Ikona przed tekstem." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <SecondaryLink href="https://zielonewzgorza.eu" external>Zielone Wzgórza</SecondaryLink>
          <SecondaryLink href="#" iconLeft={<Info />}>Dowiedz się więcej</SecondaryLink>
        </div>
      </ComponentShowcase>

      {/* ── HelperText variants ── */}
      <ComponentShowcase title="HelperText — warianty" caption="4 warianty. Error/success/warning automatycznie z ikoną."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=default" hint="Informacyjny. Bez ikony." />
            <SpecimenInfo id="variant=error" hint="AlertCircle + czerwony." />
            <SpecimenInfo id="variant=success" hint="CheckCircle + zielony." />
            <SpecimenInfo id="variant=warning" hint="AlertTriangle + pomarańcz." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
          <HelperText>Maksymalnie 50 znaków</HelperText>
          <HelperText variant="error">Numer telefonu jest niepoprawny</HelperText>
          <HelperText variant="success">Email został zweryfikowany</HelperText>
          <HelperText variant="warning">Zostało 3 z 10 miejsc</HelperText>
        </div>
      </ComponentShowcase>

      {/* ── HelperText under input demo ── */}
      <ComponentShowcase title="HelperText — pod inputem" caption="Typowe użycie z formularzem."
        info={<SpecimenInfo id="id + aria-describedby" hint="Wiązanie z inputem przez id." />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 320 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--eui-text-primary)" }}>Telefon</label>
          <input type="tel" placeholder="+48 123 456 789" aria-describedby="phone-hint"
            style={{ padding: "10px 14px", border: "1px solid var(--eui-danger)", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          <HelperText variant="error" id="phone-hint">Numer telefonu jest niepoprawny</HelperText>
        </div>
      </ComponentShowcase>

      {/* ── MetaText ── */}
      <ComponentShowcase title="MetaText" caption="Caption-style meta info. Opcjonalna ikona 12px."
        info={
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <SpecimenInfo id="variant=default" hint="Grey-500. Muted." />
            <SpecimenInfo id="variant=primary" hint="Grey-700. Mocniejszy." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
          <MetaText>Dostępne od jutra</MetaText>
          <MetaText variant="primary">Zaktualizowane 3 dni temu</MetaText>
          <MetaText iconLeft={<Clock />}>Zaktualizowane 3 dni temu</MetaText>
        </div>
      </ComponentShowcase>

      {/* ── InlineMeta Airbnb ── */}
      <ComponentShowcase title="InlineMeta — Airbnb style" caption="Separatory · między elementami. Null jest filtrowany."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=default" hint="Body-small, grey-600." />
            <SpecimenInfo id="variant=caption" hint="Caption, grey-500." />
            <SpecimenInfo id="variant=primary" hint="Body-small, grey-900." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          <InlineMeta items={[
            <><Star size={12} style={{ fill: "currentColor" }} /> 4.92</>,
            "Kraków",
            "2 gości",
            "15-17 maja",
          ]} />
          <InlineMeta variant="caption" items={["Dostępne", null, "Promo"]} />
          <InlineMeta variant="primary" items={["Domek Hobbit", "7 osób", "3 sypialnie"]} />
        </div>
      </ComponentShowcase>

      {/* ── Eyebrow ── */}
      <ComponentShowcase title="Eyebrow" caption="Uppercase mini nagłówek. 12px/600 + letter-spacing."
        info={
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <SpecimenInfo id="variant=default" hint="Grey-500." />
            <SpecimenInfo id="variant=brand" hint="Kolor marki." />
            <SpecimenInfo id="variant=success" hint="Zielony." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <Eyebrow>Nowość</Eyebrow>
          <Eyebrow variant="brand">Polecamy</Eyebrow>
          <Eyebrow variant="success">Dostępne</Eyebrow>
        </div>
      </ComponentShowcase>

      {/* ── SectionHeading simple ── */}
      <ComponentShowcase title="SectionHeading — prosty" caption="Tytuł + opcjonalny description."
        info={<SpecimenInfo id="SectionHeading" hint="Eyebrow + title + description." />}
      >
        <div style={{ width: "100%", maxWidth: 480 }}>
          <SectionHeading title="Odkryj nasze domki" description="Każdy domek to osobna przygoda w stylu Tolkiena." />
        </div>
      </ComponentShowcase>

      {/* ── SectionHeading z eyebrow ── */}
      <ComponentShowcase title="SectionHeading — z eyebrow" caption="Eyebrow nad tytułem."
        info={<SpecimenInfo id="eyebrow" hint="Uppercase label nad tytułem." />}
      >
        <div style={{ width: "100%", maxWidth: 480 }}>
          <SectionHeading eyebrow="Wakacje" eyebrowVariant="brand" title="Odkryj ukryte perły" description="Hobbit domki w sercu Kaszub." />
        </div>
      </ComponentShowcase>

      {/* ── SectionHeading between ── */}
      <ComponentShowcase title="SectionHeading — between" caption="Tytuł lewo, akcja prawo."
        info={<SpecimenInfo id="align=between" hint="Flex row. CTA w prawo." />}
      >
        <div style={{ width: "100%" }}>
          <SectionHeading title="Popularne domki" description="Najczęściej rezerwowane w tym sezonie." align="between"
            action={<Button variant="link" size="sm">Zobacz wszystkie</Button>} />
        </div>
      </ComponentShowcase>

      {/* ── SectionHeading center ── */}
      <ComponentShowcase title="SectionHeading — center" caption="Wycentrowany. Hero sekcje."
        info={<SpecimenInfo id="align=center" hint="Text-align center." />}
      >
        <SectionHeading align="center" size="xl" eyebrow="Zielone Wzgórza" eyebrowVariant="brand"
          title="Zaplanujmy Twój pobyt" description="Podaj nam kilka szczegółów, a my zajmiemy się resztą." titleAs="h1" />
      </ComponentShowcase>

      {/* ── SectionHeading sizes ── */}
      <ComponentShowcase title="SectionHeading — rozmiary" caption="SM do XL."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="size=sm" hint="Title-3. 18px." />
            <SpecimenInfo id="size=md" hint="Title-2. 22px." />
            <SpecimenInfo id="size=lg" hint="Title-1. 26px." />
            <SpecimenInfo id="size=xl" hint="Display-2. 40px." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
          <SectionHeading size="sm" title="Small heading" description="Opis sekcji." />
          <SectionHeading size="md" title="Medium heading" description="Opis sekcji." />
          <SectionHeading size="lg" title="Large heading" description="Opis sekcji." />
          <SectionHeading size="xl" title="XL heading" description="Opis sekcji." />
        </div>
      </ComponentShowcase>

      {/* ── PriceText variants ── */}
      <ComponentShowcase title="PriceText — warianty" caption="3 warianty rozmiaru. Polski format z non-breaking space."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=display" hint="Hero. 40px." />
            <SpecimenInfo id="variant=primary" hint="Karty. 22px." />
            <SpecimenInfo id="variant=compact" hint="Inline. 16px." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
          <PriceText variant="display" amount={1250} per="night" />
          <PriceText variant="primary" amount={1250} per="night" />
          <PriceText variant="compact" amount={1250} per="night" />
        </div>
      </ComponentShowcase>

      {/* ── PriceText bez per + custom ── */}
      <ComponentShowcase title="PriceText — warianty per" caption="Bez suffixu, custom per, plain weight."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="bez per" hint="Tylko kwota + waluta." />
            <SpecimenInfo id="custom per" hint="Dowolny string." />
            <SpecimenInfo id="emphasize=false" hint="Bez bold na kwocie." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          <PriceText variant="primary" amount={1250} />
          <PriceText variant="primary" amount={4800} per="pobyt 5 nocy" />
          <PriceText variant="compact" amount={350} per="night" emphasizeAmount={false} />
        </div>
      </ComponentShowcase>

      {/* ── EmptyStateText ── */}
      <ComponentShowcase title="EmptyStateText — rozmiary" caption="Tylko tekst. Ikona + CTA w Części 12."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="size=sm" hint="Kompaktowy. Popover." />
            <SpecimenInfo id="size=md" hint="Domyślny." />
            <SpecimenInfo id="size=lg" hint="Hero empty state." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%" }}>
          <EmptyStateText size="sm" title="Brak wyników" description="Spróbuj zmienić filtry." />
          <EmptyStateText size="md" title="Brak wyników" description="Spróbuj zmienić filtry lub rozszerz daty pobytu." />
          <EmptyStateText size="lg" title="Brak wyników" description="Spróbuj zmienić filtry, rozszerz daty pobytu lub poszukaj w innym regionie." />
        </div>
      </ComponentShowcase>

      {/* ── EmptyStateText align left ── */}
      <ComponentShowcase title="EmptyStateText — align left" caption="Nie-centered wariant."
        info={<SpecimenInfo id="align=left" hint="Tekst do lewej." />}
      >
        <EmptyStateText align="left" title="Brak rezerwacji" description="Nie masz jeszcze żadnych rezerwacji w tym okresie." />
      </ComponentShowcase>
    </LabSection>
  );
}
