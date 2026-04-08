"use client";

import { EmailSettingsContent } from "@/components/global-settings/email-settings-content";
import { GlobalSettingsLayout } from "@/components/global-settings/global-settings-layout";

export default function EmailSettingsPage() {
  return (
    <GlobalSettingsLayout activeSection="email">
      <EmailSettingsContent />
    </GlobalSettingsLayout>
  );
}
