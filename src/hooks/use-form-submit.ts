"use client";

import { useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/toast";

/* ═══════════════════════════════════════════════
   useFormSubmit — standard form submission hook
   
   Enforces consistent behavior across all forms:
   - loading state (spinner on button)
   - disabled button while saving
   - success toast + callback
   - error toast with message from API
   - retry capability
   - prevents double-submit
   ═══════════════════════════════════════════════ */

interface SubmitOptions<T = unknown> {
  /** The async function to execute (API call) */
  action: () => Promise<T>;
  /** Success toast message */
  successMessage?: string;
  /** Success toast description (optional) */
  successDescription?: string;
  /** Error toast message (override, otherwise uses API error) */
  errorMessage?: string;
  /** Called after successful action */
  onSuccess?: (result: T) => void | Promise<void>;
  /** Called after error */
  onError?: (error: Error) => void;
  /** Reset form after success? Default: false */
  resetAfter?: boolean;
  /** Reset function to call if resetAfter is true */
  onReset?: () => void;
}

interface SubmitState {
  saving: boolean;
  error: string | null;
  lastError: Error | null;
}

interface SubmitReturn extends SubmitState {
  /** Execute the form action */
  execute: () => Promise<boolean>;
  /** Retry the last failed action */
  retry: () => Promise<boolean>;
  /** Clear error state */
  clearError: () => void;
}

export function useFormSubmit(): {
  saving: boolean;
  error: string | null;
  submit: <T = unknown>(opts: SubmitOptions<T>) => Promise<boolean>;
  retry: () => Promise<boolean>;
  clearError: () => void;
} {
  const [state, setState] = useState<SubmitState>({
    saving: false,
    error: null,
    lastError: null,
  });
  const { success, error: showError } = useToast();
  const lastOpts = useRef<SubmitOptions<unknown> | null>(null);
  const lockRef = useRef(false);

  const submit = useCallback(async <T = unknown>(opts: SubmitOptions<T>): Promise<boolean> => {
    // Prevent double-submit
    if (lockRef.current) return false;
    lockRef.current = true;

    lastOpts.current = opts as SubmitOptions<unknown>;
    setState({ saving: true, error: null, lastError: null });

    try {
      const result = await opts.action();

      // Success toast
      if (opts.successMessage) {
        success(opts.successMessage, opts.successDescription);
      }

      // Callback
      if (opts.onSuccess) {
        await opts.onSuccess(result);
      }

      // Reset form if requested
      if (opts.resetAfter && opts.onReset) {
        opts.onReset();
      }

      setState({ saving: false, error: null, lastError: null });
      lockRef.current = false;
      return true;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));

      // Try to extract API error message
      let message = opts.errorMessage || "Wystąpił błąd";
      try {
        if (err && typeof err === "object" && "message" in err) {
          message = (err as { message: string }).message || message;
        }
      } catch {}

      showError(message);

      if (opts.onError) {
        opts.onError(e);
      }

      setState({ saving: false, error: message, lastError: e });
      lockRef.current = false;
      return false;
    }
  }, [success, showError]);

  const retry = useCallback(async (): Promise<boolean> => {
    if (!lastOpts.current) return false;
    return submit(lastOpts.current);
  }, [submit]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, lastError: null }));
  }, []);

  return {
    saving: state.saving,
    error: state.error,
    submit,
    retry,
    clearError,
  };
}

/* ═══════════════════════════════════════════════
   apiCall — helper for fetch with error extraction
   
   Usage:
     const data = await apiCall("/api/seasons", {
       method: "POST",
       body: JSON.stringify(formData),
     });
   ═══════════════════════════════════════════════ */

export async function apiCall<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    let message = `Błąd ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
      else if (data.message) message = data.message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}
