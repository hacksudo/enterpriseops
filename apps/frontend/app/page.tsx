"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, KeyRound, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { api, setStoredToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(true);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);

  useEffect(() => {
    api.getBootstrapStatus()
      .then((res) => setBootstrapped(res.bootstrapped))
      .catch(() => setBootstrapped(true));
  }, []);

  const handleBootstrap = async () => {
    setBootstrapLoading(true);
    setError(null);
    try {
      await api.initBootstrap();
      setBootstrapped(true);
      setError("System successfully bootstrapped! You can now log in.");
    } catch (err: any) {
      setError(err.message || "Failed to bootstrap system");
    } finally {
      setBootstrapLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({
        email,
        password,
        totp_code: totpCode || undefined,
      });

      if (res.mfa_required) {
        setMfaRequired(true);
        setError("Please enter your 6-digit MFA verification code.");
        setLoading(false);
        return;
      }

      setStoredToken(res.access_token);
      localStorage.setItem("enterpriseops_user", JSON.stringify(res));

      // Direct to corresponding dashboard
      if (res.role === "Employee") {
        router.push("/dashboard/employee");
      } else if (res.role === "PMO") {
        router.push("/dashboard/pmo");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md">
        {/* Logo and Product Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-4 shadow-glass-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            hacksudo <span className="text-cyan-400">EnterpriseOps</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise IT Workforce & Vulnerability Platform
          </p>
        </div>

        {/* Liquid Glass Login Container */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          {!bootstrapped && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-300">First-Time Setup Required</div>
                  <div>The database needs initial administrator bootstrap.</div>
                  <button
                    onClick={handleBootstrap}
                    disabled={bootstrapLoading}
                    className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition"
                  >
                    {bootstrapLoading ? "Bootstrapping..." : "Run 1-Click Bootstrap"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={`mb-6 p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              error.includes("successfully")
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}>
              {error.includes("successfully") ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.internal"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition"
                />
              </div>
            </div>

            {mfaRequired && (
              <div>
                <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
                  Two-Factor Code (TOTP)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="6-digit authentication code"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/50 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm tracking-widest transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          hacksudo EnterpriseOps • Argon2id Encrypted • Strict Scoped RBAC
        </p>
      </div>
    </div>
  );
}
