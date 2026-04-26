"use client";

import * as React from "react";
import { Layers } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { DebugPanel } from "../DebugPanel";
import { CardSurface } from "@/components/engine-ui/surface/CardSurface";
import { PanelSurface } from "@/components/engine-ui/surface/PanelSurface";
import { ScrollFade } from "@/components/engine-ui/surface/ScrollFade";
import { Backdrop } from "@/components/engine-ui/overlay/Backdrop";
import { DragHandle } from "@/components/engine-ui/overlay/DragHandle";
import { SheetHeader } from "@/components/engine-ui/overlay/SheetHeader";
import { SheetFooter } from "@/components/engine-ui/overlay/SheetFooter";
import { BottomSheet } from "@/components/engine-ui/overlay/BottomSheet";
import { Button } from "@/components/engine-ui/button/Button";
import { BackButton } from "@/components/engine-ui/button/BackButton";

function CardContent({ label }: { label: string }) {
  return (
    <div style={{ padding: 20, fontSize: 14, color: "var(--eui-text-secondary)" }}>
      <strong style={{ color: "var(--eui-text-primary)" }}>CardSurface</strong>
      <br />{label}
    </div>
  );
}

export function SurfaceSection() {
  const [backdropOpen, setBackdropOpen] = React.useState<string | null>(null);
  const [sheetFull, setSheetFull] = React.useState(false);
  const [sheetAuto, setSheetAuto] = React.useState(false);
  const [sheetHalf, setSheetHalf] = React.useState(false);
  const [openCount, setOpenCount] = React.useState(0);

  const handleSheetOpen = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    setOpenCount((c) => c + 1);
  };

  return (
    <LabSection id="surface" title="Powierzchnie" icon={<Layers />}
      description="Karty, panele, tła, sheety. Infrastruktura do budowy modali i bottom sheetów."
    >
      {/* ── CardSurface — elevations ── */}
      <ComponentShowcase title="CardSurface — elewacje" caption="4 poziomy cienia."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="elevation=flat" hint="Bez cienia. Statyczne grupowania." />
            <SpecimenInfo id="elevation=raised" hint="Domyślny. Główne karty." />
            <SpecimenInfo id="elevation=elevated" hint="Wyróżnione, hover state." />
            <SpecimenInfo id="elevation=floating" hint="Ponad innymi. Rzadko." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <CardSurface elevation="flat" style={{ width: 160 }}><CardContent label="flat" /></CardSurface>
          <CardSurface elevation="raised" style={{ width: 160 }}><CardContent label="raised" /></CardSurface>
          <CardSurface elevation="elevated" style={{ width: 160 }}><CardContent label="elevated" /></CardSurface>
          <CardSurface elevation="floating" style={{ width: 160 }}><CardContent label="floating" /></CardSurface>
        </div>
      </ComponentShowcase>

      {/* ── CardSurface — radiusy ── */}
      <ComponentShowcase title="CardSurface — radiusy" caption="4 warianty zaokrąglenia."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="radius=md · 12px" hint="Inputy, małe karty." />
            <SpecimenInfo id="radius=lg · 16px" hint="Domyślny." />
            <SpecimenInfo id="radius=xl · 20px" hint="Większe karty." />
            <SpecimenInfo id="radius=2xl · 24px" hint="Modale, sheety." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <CardSurface radius="md" style={{ width: 140 }}><CardContent label="md" /></CardSurface>
          <CardSurface radius="lg" style={{ width: 140 }}><CardContent label="lg" /></CardSurface>
          <CardSurface radius="xl" style={{ width: 140 }}><CardContent label="xl" /></CardSurface>
          <CardSurface radius="2xl" style={{ width: 140 }}><CardContent label="2xl" /></CardSurface>
        </div>
      </ComponentShowcase>

      {/* ── CardSurface — interactive ── */}
      <ComponentShowcase title="CardSurface — interactive" caption="Hover lift + cursor pointer."
        info={<SpecimenInfo id="interactive=true" hint="Cursor + hover lift." />}
      >
        <CardSurface interactive padding="md" style={{ maxWidth: 280 }}>
          <strong style={{ color: "var(--eui-text-primary)", fontSize: 14 }}>Karta klikalna</strong>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--eui-text-secondary)" }}>
            Najedź myszką — shadow przechodzi z elev-1 na elev-2.
          </p>
        </CardSurface>
      </ComponentShowcase>

      {/* ── PanelSurface — padding ── */}
      <ComponentShowcase title="PanelSurface — padding" caption="Warianty paddingu wewnętrznego."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="padding=sm · 8px" hint="Kompaktowe." />
            <SpecimenInfo id="padding=md · 16px" hint="Domyślny." />
            <SpecimenInfo id="padding=lg · 24px" hint="Luźne sekcje." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {(["sm", "md", "lg"] as const).map((p) => (
            <CardSurface key={p} style={{ width: 180 }}>
              <PanelSurface padding={p} gap="sm">
                <div style={{ fontSize: 12, color: "var(--eui-text-secondary)", fontFamily: "monospace" }}>padding={p}</div>
                <div style={{ height: 40, background: "var(--eui-grey-50)", borderRadius: 8 }} />
              </PanelSurface>
            </CardSurface>
          ))}
        </div>
      </ComponentShowcase>

      {/* ── PanelSurface — scrollable ── */}
      <ComponentShowcase title="PanelSurface — scrollable" caption="Overflow z wewnętrznym scrollem."
        info={<SpecimenInfo id="scrollable=true" hint="Long content. Flex 1 + overflow-y." />}
      >
        <CardSurface style={{ height: 200, width: 280, display: "flex", flexDirection: "column" }}>
          <PanelSurface scrollable padding="md" gap="sm">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--eui-grey-50)", fontSize: 13, color: "var(--eui-text-secondary)" }}>
                Element {i + 1}
              </div>
            ))}
          </PanelSurface>
        </CardSurface>
      </ComponentShowcase>

      {/* ── ScrollFade — vertical ── */}
      <ComponentShowcase title="ScrollFade — vertical" caption="Gradient na górze i dole scroll area."
        info={<SpecimenInfo id="orientation=vertical" hint="Listy, long content w sheetach." />}
      >
        <CardSurface style={{ width: 280 }}>
          <ScrollFade orientation="vertical" style={{ height: 180 }}>
            <div style={{ padding: 16 }}>
              {Array.from({ length: 15 }, (_, i) => (
                <p key={i} style={{ margin: "0 0 12px", fontSize: 13, color: "var(--eui-text-secondary)" }}>
                  Linia {i + 1} — przykładowy content do scrollowania w liście.
                </p>
              ))}
            </div>
          </ScrollFade>
        </CardSurface>
      </ComponentShowcase>

      {/* ── ScrollFade — horizontal ── */}
      <ComponentShowcase title="ScrollFade — horizontal" caption="Gradient na lewej i prawej krawędzi."
        info={<SpecimenInfo id="orientation=horizontal" hint="Karuzele kart, filtry." />}
      >
        <ScrollFade orientation="horizontal" style={{ width: 320 }}>
          <div style={{ display: "flex", gap: 12, padding: "8px 16px" }}>
            {Array.from({ length: 8 }, (_, i) => (
              <CardSurface key={i} padding="sm" style={{ flexShrink: 0, width: 100, textAlign: "center" }}>
                <span style={{ fontSize: 13, color: "var(--eui-text-secondary)" }}>Karta {i + 1}</span>
              </CardSurface>
            ))}
          </div>
        </ScrollFade>
      </ComponentShowcase>

      {/* ── Backdrop ── */}
      <ComponentShowcase title="Backdrop" caption="Kliknij trigger, potem kliknij tło żeby zamknąć."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="intensity=light" hint="30% przyciemnienie." />
            <SpecimenInfo id="intensity=medium" hint="50%. Domyślny." />
            <SpecimenInfo id="intensity=heavy" hint="70%. Silne skupienie." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12 }}>
          {(["light", "medium", "heavy"] as const).map((intensity) => (
            <Button key={intensity} variant="secondary" size="sm"
              onClick={() => setBackdropOpen(intensity)}
            >
              {intensity}
            </Button>
          ))}
        </div>
        {backdropOpen && (
          <Backdrop
            open
            intensity={backdropOpen as "light" | "medium" | "heavy"}
            onDismiss={() => setBackdropOpen(null)}
            style={{ zIndex: 9999 }}
          >
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
            }}>
              <CardSurface elevation="floating" radius="xl" padding="lg">
                <p style={{ margin: 0, fontSize: 14, color: "var(--eui-text-primary)", textAlign: "center" }}>
                  Kliknij tło żeby zamknąć
                </p>
              </CardSurface>
            </div>
          </Backdrop>
        )}
      </ComponentShowcase>

      {/* ── DragHandle ── */}
      <ComponentShowcase title="DragHandle" caption="Wskaźnik do grabowania sheeta."
        info={
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <SpecimenInfo id="visible=true" hint="Domyślny. Pill 32×4." />
            <SpecimenInfo id="visible=false" hint="Ukryty. Zachowuje layout." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <CardSurface padding="sm" style={{ width: 120 }}>
            <DragHandle />
          </CardSurface>
          <CardSurface padding="sm" style={{ width: 120 }}>
            <DragHandle visible={false} />
          </CardSurface>
        </div>
      </ComponentShowcase>

      {/* ── SheetHeader ── */}
      <ComponentShowcase title="SheetHeader" caption="Sticky top sheeta. Tytuł + close + opcjonalne tabs."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="SheetHeader" hint="Tytuł + close. Sticky top." />
            <SpecimenInfo id="leftSlot" hint="BackButton do multi-step." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 480 }}>
          <CardSurface>
            <SheetHeader title="Wybierz daty" onClose={() => {}} sticky={false} />
          </CardSurface>
          <CardSurface>
            <SheetHeader title="Wybierz daty" subtitle="10-14 lipca 2026" onClose={() => {}} sticky={false} />
          </CardSurface>
          <CardSurface>
            <SheetHeader title="Filtr szczegółowy" leftSlot={<BackButton onClick={() => {}} />} onClose={() => {}} sticky={false} />
          </CardSurface>
        </div>
      </ComponentShowcase>

      {/* ── SheetFooter ── */}
      <ComponentShowcase title="SheetFooter" caption="Sticky bottom sheeta. 3 layouty."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="layout=end" hint="Akcje do prawej. Desktop modal." />
            <SpecimenInfo id="layout=between" hint="Wyczyść lewo, CTA prawo." />
            <SpecimenInfo id="layout=stacked" hint="Kolumna. Full-width mobile." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 480 }}>
          <CardSurface>
            <SheetFooter layout="end" sticky={false}>
              <Button variant="ghost" size="sm">Anuluj</Button>
              <Button variant="primary" size="sm">Zastosuj</Button>
            </SheetFooter>
          </CardSurface>
          <CardSurface>
            <SheetFooter layout="between" sticky={false}>
              <Button variant="link" size="sm">Wyczyść wszystko</Button>
              <Button variant="primary" size="sm">Szukaj</Button>
            </SheetFooter>
          </CardSurface>
          <CardSurface>
            <SheetFooter layout="stacked" sticky={false}>
              <Button variant="primary">Zastosuj filtry</Button>
              <Button variant="ghost">Anuluj</Button>
            </SheetFooter>
          </CardSurface>
        </div>
      </ComponentShowcase>

      {/* ── BottomSheet — full ── */}
      <ComponentShowcase title="BottomSheet — full" caption="Pełnoekranowy sheet. Desktop → modal."
        info={
          <>
            <SpecimenInfo id="height=full" hint="100dvh. Kalendarz, złożone formularze." />
            <DebugPanel fields={[
              { label: "open", value: String(sheetFull) },
              { label: "otwarć łącznie", value: openCount },
            ]} />
          </>
        }
      >
        <Button variant="secondary" onClick={() => handleSheetOpen(setSheetFull)}>
          Otwórz BottomSheet (full)
        </Button>
        <BottomSheet
          open={sheetFull}
          onOpenChange={setSheetFull}
          height="full"
          label="Demo — full sheet"
          header={<SheetHeader title="Wybierz daty" subtitle="Zaplanuj swój pobyt" onClose={() => setSheetFull(false)} />}
          footer={
            <SheetFooter layout="between">
              <Button variant="link">Wyczyść wszystko</Button>
              <Button variant="primary" onClick={() => setSheetFull(false)}>Zastosuj</Button>
            </SheetFooter>
          }
        >
          <PanelSurface padding="lg" gap="md">
            {Array.from({ length: 3 }, (_, i) => (
              <CardSurface key={i} padding="md">
                <p style={{ margin: 0, fontSize: 14, color: "var(--eui-text-secondary)" }}>
                  Sekcja {i + 1} — tu będzie content kalendarza, filtrów itp.
                </p>
              </CardSurface>
            ))}
          </PanelSurface>
        </BottomSheet>
      </ComponentShowcase>

      {/* ── BottomSheet — auto ── */}
      <ComponentShowcase title="BottomSheet — auto" caption="Dopasowany do contentu. Max 90dvh."
        info={<SpecimenInfo id="height=auto" hint="Potwierdzenia, proste akcje." />}
      >
        <Button variant="secondary" onClick={() => handleSheetOpen(setSheetAuto)}>
          Potwierdź akcję
        </Button>
        <BottomSheet
          open={sheetAuto}
          onOpenChange={setSheetAuto}
          height="auto"
          desktopSize="sm"
          label="Potwierdź usunięcie"
          header={<SheetHeader title="Potwierdź usunięcie" onClose={() => setSheetAuto(false)} />}
          footer={
            <SheetFooter layout="stacked">
              <Button variant="ghost" onClick={() => setSheetAuto(false)}>Anuluj</Button>
              <Button variant="danger" onClick={() => setSheetAuto(false)}>Usuń rezerwację</Button>
            </SheetFooter>
          }
        >
          <PanelSurface padding="lg">
            <p style={{ margin: 0, fontSize: 14, color: "var(--eui-text-secondary)" }}>
              Czy na pewno chcesz usunąć tę rezerwację? Tej akcji nie można cofnąć.
            </p>
          </PanelSurface>
        </BottomSheet>
      </ComponentShowcase>

      {/* ── BottomSheet — half ── */}
      <ComponentShowcase title="BottomSheet — half" caption="Połowa ekranu. Filtry, szybkie listy."
        info={<SpecimenInfo id="height=half" hint="50dvh. Filtry, wybory." />}
      >
        <Button variant="secondary" onClick={() => handleSheetOpen(setSheetHalf)}>
          Filtry
        </Button>
        <BottomSheet
          open={sheetHalf}
          onOpenChange={setSheetHalf}
          height="half"
          label="Filtry"
          header={<SheetHeader title="Filtry" onClose={() => setSheetHalf(false)} />}
          footer={
            <SheetFooter layout="between">
              <Button variant="link">Wyczyść</Button>
              <Button variant="primary" onClick={() => setSheetHalf(false)}>Zastosuj</Button>
            </SheetFooter>
          }
        >
          <PanelSurface padding="lg" gap="sm" scrollable>
            {["Klimatyzacja", "WiFi", "Sauna", "Jacuzzi", "Grill", "Parking", "Plac zabaw", "Nad jeziorem"].map((f) => (
              <div key={f} style={{ padding: "12px 0", borderBottom: "1px solid var(--eui-grey-50)", fontSize: 14, color: "var(--eui-text-primary)" }}>
                {f}
              </div>
            ))}
          </PanelSurface>
        </BottomSheet>
      </ComponentShowcase>
    </LabSection>
  );
}
