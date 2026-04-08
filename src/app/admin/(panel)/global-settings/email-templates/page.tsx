"use client";

import { EmailTemplatesList } from "@/components/global-settings/email-templates-list";
import { GlobalSettingsLayout } from "@/components/global-settings/global-settings-layout";

export default function EmailTemplatesPage() {
  return (
    <GlobalSettingsLayout activeSection="email-templates">
      <EmailTemplatesList />
    </GlobalSettingsLayout>
  );
}
