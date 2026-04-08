"use client";

import { EmailLogsContent } from "@/components/global-settings/email-logs-content";
import { GlobalSettingsLayout } from "@/components/global-settings/global-settings-layout";

export default function EmailLogsPage() {
  return (
    <GlobalSettingsLayout activeSection="email-logs">
      <EmailLogsContent />
    </GlobalSettingsLayout>
  );
}
