"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TreePine, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      router.push("/admin/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Wystąpił błąd połączenia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      {/* ── Left panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[hsl(224,20%,8%)]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white" style={{ boxShadow: "0 4px 16px hsl(214 89% 52% / 0.35)" }}>
              <TreePine className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Zielone Wzgórza</span>
          </div>
          <div className="max-w-sm">
            <h2 className="mb-4 text-3xl font-bold text-white leading-tight">
              Panel<br />Administracyjny
            </h2>
            <p className="text-sm leading-relaxed text-white/50">
              Centralny system zarządzania rezerwacjami, ofertami, klientami i wszystkimi operacjami Zielone Wzgórza.
            </p>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Zielone Wzgórza</p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm fade-in-scale">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white" style={{ boxShadow: "0 4px 16px hsl(214 89% 52% / 0.25)" }}>
              <TreePine className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zielone Wzgórza</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Zaloguj się</h1>
            <p className="mt-2 text-[13px] text-muted-foreground">Wprowadź dane logowania aby uzyskać dostęp do panelu</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[13px] text-destructive font-medium">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold" htmlFor="email">Email</label>
              <input
                id="email" type="email" placeholder="admin@zielonewzgorza.eu"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className="input-bubble h-11"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold" htmlFor="password">Hasło</label>
                <button type="button" className="text-[12px] text-primary font-medium hover:underline">
                  Nie pamiętam hasła
                </button>
              </div>
              <div className="relative">
                <input
                  id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                  className="input-bubble h-11 pr-11"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="btn-bubble btn-primary-bubble w-full h-11 text-[14px] font-semibold gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Zaloguj się
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-muted-foreground/60">
            Problemy z logowaniem? Skontaktuj się z administratorem.
          </p>
        </div>
      </div>
    </div>
  );
}
