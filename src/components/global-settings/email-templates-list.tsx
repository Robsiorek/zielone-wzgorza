"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Bell, CheckCircle2, XCircle, Loader2, FileCode, Eye,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { SlidePanel } from "@/components/ui/slide-panel";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TemplateInfo {
  type: string;
  label: string;
  description: string;
  isCustom: boolean;
  subject: string;
  updatedAt: string | null;
}

const ICONS: Record<string, React.ElementType> = {
  BOOKING_CONFIRMATION: Mail,
  PAYMENT_REMINDER: Bell,
  STATUS_CONFIRMED: CheckCircle2,
  STATUS_CANCELLED: XCircle,
};

export function EmailTemplatesList() {
  const router = useRouter();
  const { error: showError } = useToast();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Preview SlidePanel state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLabel, setPreviewLabel] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/api/settings/email/templates");
      setTemplates(data.templates);
    } catch {
      showError("Nie udało się załadować szablonów");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openPreview(type: string, label: string) {
    setPreviewLabel(label);
    setPreviewHtml("");
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const data = await apiFetch("/api/settings/email/preview", {
        method: "POST",
        body: { type },
      });
      setPreviewHtml(data.html);
    } catch {
      showError("Nie udało się wygenerować podglądu");
      setPreviewOpen(false);
    }
    setPreviewLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bubble px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted shimmer rounded-xl" />
              <div className="flex-1">
                <div className="h-4 w-40 bg-muted shimmer rounded mb-2" />
                <div className="h-3 w-64 bg-muted shimmer rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted-foreground">
        Dostosuj wygląd e-maili wysyłanych do klientów. Kliknij kartę, aby otworzyć edytor HTML.
      </p>

      {templates.map(tpl => {
        const Icon = ICONS[tpl.type] || FileCode;
        return (
          <div
            key={tpl.type}
            onClick={() => router.push(`/admin/global-settings/email-templates/${tpl.type}`)}
            className="bubble p-5 cursor-pointer hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[14px] font-semibold">{tpl.label}</h3>
                  {tpl.isCustom ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">WŁASNY</span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">DOMYŚLNY</span>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground mb-2">{tpl.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-muted text-muted-foreground">
                    <Icon className="h-3 w-3" /> {tpl.subject || "Brak tematu"}
                  </span>
                  {tpl.updatedAt && (
                    <span className="text-[11px] text-muted-foreground">
                      Edytowany {new Date(tpl.updatedAt).toLocaleDateString("pl-PL")}
                    </span>
                  )}
                </div>
              </div>
              <Tooltip content="Podgląd e-maila">
              <button
                onClick={(e) => { e.stopPropagation(); openPreview(tpl.type, tpl.label); }}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all shrink-0"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              </Tooltip>
            </div>
          </div>
        );
      })}

      {/* Preview SlidePanel */}
      <SlidePanel open={previewOpen} onClose={() => setPreviewOpen(false)} title={`Podgląd: ${previewLabel}`}>
        <div className="h-full">
          {previewLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              title="Preview"
              className="w-full h-full border-0"
              style={{ minHeight: "calc(100vh - 120px)" }}
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-[13px] text-muted-foreground">
              Brak podglądu
            </div>
          )}
        </div>
      </SlidePanel>
    </div>
  );
}
