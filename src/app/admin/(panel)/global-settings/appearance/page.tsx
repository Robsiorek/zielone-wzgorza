"use client";

import { AppearanceConfigTab } from "@/components/config/appearance-config-tab";
import { GlobalSettingsLayout } from "@/components/global-settings/global-settings-layout";

export default function AppearancePage() {
  return (
    <GlobalSettingsLayout activeSection="appearance">
      <AppearanceConfigTab />
    </GlobalSettingsLayout>
  );
}
