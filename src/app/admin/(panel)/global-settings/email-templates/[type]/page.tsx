"use client";

import { useParams } from "next/navigation";
import { EmailTemplateEditor } from "@/components/global-settings/email-template-editor";

export default function EmailTemplateEditorPage() {
  const params = useParams();
  const type = params.type as string;

  return <EmailTemplateEditor type={type} />;
}
