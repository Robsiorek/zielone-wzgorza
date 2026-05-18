"use client";

import * as React from "react";
import { MessageSquareWarning, Inbox, SearchX, RefreshCw, HelpCircle } from "lucide-react";

import {
  Alert,
  Banner,
  EmptyState,
  ErrorState,
  Tooltip,
} from "@/components/engine-ui/feedback";
import { Button } from "@/components/engine-ui/button/Button";
import { Stack } from "@/components/engine-ui/layout/Stack";
import { Inline } from "@/components/engine-ui/layout/Inline";

import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";

// Single-column, fill cross-axis + cap (ten sam wzorzec co InputySection —
// parent .eui-lab-showcase-preview to flex-COLUMN; width 100% + maxWidth).
const SPECIMEN_STYLE: React.CSSProperties = { width: "100%", maxWidth: 420 };

export function FeedbackSection() {
  const [alertOpen, setAlertOpen] = React.useState(true);
  const [bannerOpen, setBannerOpen] = React.useState(true);

  return (
    <LabSection
      id="feedback"
      title="Feedback"
      icon={<MessageSquareWarning />}
      description="Komunikaty stanu: Alert / Banner (severity inline + page-level), EmptyState / ErrorState (pusty / błąd + retry), Tooltip (hover+focus desktop, tap-toggle touch — PO D6). Tokeny semantic, B-neutral focus."
    >
      {/* 1. Alert — 4 warianty severity */}
      <ComponentShowcase
        title="Alert — severity"
        caption="Inline komunikat (radius, w treści). Warianty info/success/warning/error mapują na tokeny semantic + ikony spójne z HelperText. error/warning = role=alert (assertive); info/success = role=status aria-live=polite."
        info={
          <SpecimenInfo
            id="Alert"
            hint="variant · title · children (message) · dismissible · icon override"
          />
        }
      >
        <Stack gap="sm" style={SPECIMEN_STYLE}>
          <Alert variant="info" title="Informacja">
            Twoja rezerwacja oczekuje na potwierdzenie wpłaty.
          </Alert>
          <Alert variant="success" title="Gotowe">
            Płatność została zaksięgowana.
          </Alert>
          <Alert variant="warning" title="Uwaga">
            Termin wpłaty zaliczki upływa za 2 dni.
          </Alert>
          <Alert variant="error" title="Błąd">
            Nie udało się zapisać zmian. Spróbuj ponownie.
          </Alert>
          <Alert variant="info">Wariant bez tytułu — sama treść.</Alert>
        </Stack>
      </ComponentShowcase>

      {/* 2. Alert — dismissible */}
      <ComponentShowcase
        title="Alert — dismissible"
        caption="Przycisk zamknięcia (X) z B-neutral focus ring (VISUAL-DNA — nie brand-blue, nie czarny żyletka). onDismiss kontrolowany przez konsumenta."
        info={
          <SpecimenInfo
            id="Alert dismissible"
            hint="dismissible + onDismiss → konsument decyduje o visibility"
          />
        }
      >
        <Stack gap="sm" style={SPECIMEN_STYLE}>
          {alertOpen ? (
            <Alert
              variant="success"
              title="Skopiowano"
              dismissible
              onDismiss={() => setAlertOpen(false)}
            >
              Numer konta został skopiowany do schowka.
            </Alert>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAlertOpen(true)}
            >
              Pokaż ponownie
            </Button>
          )}
        </Stack>
      </ComponentShowcase>

      {/* 3. Banner — page-level full-width */}
      <ComponentShowcase
        title="Banner — page-level"
        caption="Ten sam rdzeń co Alert, modyfikator .eui-banner: full-width, krawędzie proste (radius 0), border-bottom. Pas nad treścią strony."
        info={
          <SpecimenInfo
            id="Banner"
            hint="ten sam API co Alert; full-width square page strip"
          />
        }
      >
        <Stack gap="sm" style={{ width: "100%", maxWidth: 560 }}>
          <Banner variant="info">
            Trwają prace serwisowe — niektóre funkcje mogą działać wolniej.
          </Banner>
          {bannerOpen && (
            <Banner
              variant="warning"
              title="Tryb podglądu"
              dismissible
              onDismiss={() => setBannerOpen(false)}
            >
              Zmiany nie są jeszcze opublikowane.
            </Banner>
          )}
        </Stack>
      </ComponentShowcase>

      {/* 4. EmptyState */}
      <ComponentShowcase
        title="EmptyState"
        caption="Ikona w miękkim kółku + EmptyStateText (reuse text primitive) + opcjonalny CTA (actionLabel→Button primary lub slot action). Wariant z CTA i bez."
        info={
          <SpecimenInfo
            id="EmptyState"
            hint="icon · title · description · size · actionLabel/onAction · action slot"
          />
        }
      >
        <Stack gap="md" style={SPECIMEN_STYLE}>
          <EmptyState
            icon={<Inbox size={28} aria-hidden="true" />}
            title="Brak rezerwacji"
            description="Nie masz jeszcze żadnych rezerwacji. Złóż pierwszą, aby pojawiła się tutaj."
            actionLabel="Nowa rezerwacja"
            onAction={() => {}}
          />
          <EmptyState
            icon={<SearchX size={28} aria-hidden="true" />}
            title="Brak wyników"
            description="Spróbuj zmienić kryteria wyszukiwania."
          />
        </Stack>
      </ComponentShowcase>

      {/* 5. ErrorState — preset z retry */}
      <ComponentShowcase
        title="ErrorState — preset"
        caption="Preset EmptyState (tone=error, ikona AlertCircle w danger tint, domyślny tytuł). onRetry → CTA „Spróbuj ponownie”. Zastępuje ad-hoc bloki AlertCircle w booking."
        info={
          <SpecimenInfo
            id="ErrorState"
            hint="title · description · onRetry → retryLabel · size"
          />
        }
      >
        <Stack gap="md" style={SPECIMEN_STYLE}>
          <ErrorState
            description="Nie udało się pobrać dostępności. Sprawdź połączenie."
            onRetry={() => {}}
          />
          <ErrorState
            title="Sesja wygasła"
            description="Zaloguj się ponownie, aby kontynuować."
            retryLabel="Zaloguj ponownie"
            onRetry={() => {}}
          />
        </Stack>
      </ComponentShowcase>

      {/* 6. Tooltip — 4 strony + disabled */}
      <ComponentShowcase
        title="Tooltip"
        caption="Chip grey-900 na @floating-ui (już dep). PO D6: hover+focus na desktop/klawiatura, tap-to-toggle na touch. ESC zamyka, role=tooltip + aria-describedby. Portal root = .engine-root (CSS scoped). Najedź / Tab / dotknij."
        info={
          <SpecimenInfo
            id="Tooltip"
            hint="content · side (top/right/bottom/left) · delay · disabled · maxWidth"
          />
        }
      >
        <Stack gap="md" style={SPECIMEN_STYLE}>
          <Inline gap="sm" wrap>
            <Tooltip content="Podpowiedź u góry" side="top">
              <Button variant="secondary" size="sm">Top</Button>
            </Tooltip>
            <Tooltip content="Podpowiedź z prawej" side="right">
              <Button variant="secondary" size="sm">Right</Button>
            </Tooltip>
            <Tooltip content="Podpowiedź na dole" side="bottom">
              <Button variant="secondary" size="sm">Bottom</Button>
            </Tooltip>
            <Tooltip content="Podpowiedź z lewej" side="left">
              <Button variant="secondary" size="sm">Left</Button>
            </Tooltip>
          </Inline>
          <Inline gap="sm" wrap>
            <Tooltip content="Kopiuj numer konta">
              <Button variant="ghost" size="sm">
                <HelpCircle size={16} aria-hidden="true" />
                Z ikoną
              </Button>
            </Tooltip>
            <Tooltip content="Tego nie zobaczysz" disabled>
              <Button variant="ghost" size="sm">
                <RefreshCw size={16} aria-hidden="true" />
                disabled (bez tooltipa)
              </Button>
            </Tooltip>
          </Inline>
        </Stack>
      </ComponentShowcase>
    </LabSection>
  );
}
