import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell, CreditCard, Globe, Lock,
  Moon, Shield, Smartphone,
  Sun, Wallet, X, 
  Eye, EyeOff, Monitor, Trash2,
  LogOut, Languages, Loader2, RefreshCw,
  AlertCircle, Clock,  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
// @ts-ignore
import { authApi } from "@/api/endpoints/auth.api";
// @ts-ignore
import useAuthStore from "@/store/auth.store";

/* ── Types ── */
interface Session {
  id:          string;
  device_info: string;
  ip_address:  string;
  created_at:  string;
  expires_at:  string;
  is_current:  boolean;
}

/* ── Toggle Switch ── */
function Toggle({
  enabled, onChange, disabled = false,
}: {
  enabled: boolean; onChange: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none
        ${enabled ? "bg-teal-600" : "bg-slate-200"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200
        ${enabled ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

/* ── Setting Row ── */
function SettingRow({
  icon: Icon, iconBg, iconColor, label, description, children,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 px-5">
      <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          {description && (
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ── Section Card ── */
function Section({
  title, icon: Icon, children, action,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-bold text-slate-800">{title}</p>
        </div>
        {action}
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}


function DeleteModal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const confirmed = input === "DELETE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xs rounded-3xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative bg-rose-600 px-6 pt-7 pb-6 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 mb-4">
            <Trash2 className="h-5 w-5 text-white" />
          </div>
          <p className="text-base font-black tracking-tight">Delete Account</p>
          <p className="text-[12px] text-rose-200 mt-0.5 font-medium">
            This cannot be undone
          </p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Info note */}
          <p className="text-[12px] leading-relaxed text-slate-500">
            To request account removal, contact{" "}
            <span className="font-bold text-slate-700">support@paysafe.in</span>.
            Wallet balance and transaction history will be permanently erased.
          </p>

          {/* Confirm input */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Type <span className="text-rose-500 font-black">DELETE</span> to confirm
            </p>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="DELETE"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-mono font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl border-slate-200 text-sm font-semibold text-slate-600"
            >
              Cancel
            </Button>
            <Button
              disabled={!confirmed}
              onClick={() => {
                window.location.href = "mailto:support@paysafe.in?subject=Account Deletion Request";
              }}
              className="flex-1 h-11 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-30 shadow-lg shadow-rose-600/25 transition-all"
            >
              Contact Support
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Sessions Section ── */
function SessionsSection() {
  const [sessions,       setSessions]       = useState<Session[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [revoking,       setRevoking]       = useState<string | null>(null);  // id of session being revoked
  const [revokingAll,    setRevokingAll]    = useState(false);

  /* ── Fetch sessions ── */
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await authApi.getSessions();
      setSessions(res.data?.data?.sessions ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  /* ── Revoke one ── */
  const revokeOne = async (id: string) => {
    setRevoking(id);
    // Optimistic remove
    setSessions(prev => prev.filter(s => s.id !== id));
    try {
      await authApi.revokeSession(id);
    } catch (e: any) {
      // Revert on failure
      setError(e?.response?.data?.message ?? "Failed to revoke session.");
      fetchSessions();
    } finally {
      setRevoking(null);
    }
  };

  /* ── Revoke all others ── */
  const revokeAll = async () => {
    setRevokingAll(true);
    // Optimistic — keep only current
    setSessions(prev => prev.filter(s => s.is_current));
    try {
      await authApi.revokeAllSessions();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to revoke sessions.");
      fetchSessions();
    } finally {
      setRevokingAll(false);
    }
  };

  /* ── Parse device_info into browser + OS ── */
  const parseDevice = (raw: string) => {
    // device_info is typically the User-Agent string
    if (!raw || raw === "Unknown device") return { browser: "Unknown", os: "Unknown device" };
    const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
    const oses     = ["Windows", "iPhone", "iPad", "Android", "Ubuntu", "Linux", "Mac"];
    const browser  = browsers.find(b => raw.includes(b)) ?? "Browser";
    const os       = oses.find(o => raw.includes(o)) ?? "Unknown OS";
    return { browser, os };
  };

  /* ── Format date ── */
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const diffMs  = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1)   return "Just now";
    if (diffMin < 60)  return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr  < 24)  return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const otherSessions = sessions.filter(s => !s.is_current);

  return (
    <Section
      title="Active Sessions"
      icon={Smartphone}
      action={
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
          <p className="text-[11px] text-slate-400">Loading sessions…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 mx-5 my-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
          <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
          <p className="text-[11px] text-rose-700">{error}</p>
          <button onClick={fetchSessions} className="ml-auto text-[11px] font-bold text-rose-600 hover:text-rose-700">
            Retry
          </button>
        </div>
      )}

      {/* Session list */}
      {!loading && sessions.map(session => {
        const { browser, os } = parseDevice(session.device_info);
        return (
          <div key={session.id} className="flex items-start justify-between px-5 py-4 gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5
                ${session.is_current ? "bg-emerald-100" : "bg-slate-100"}`}
              >
                <Smartphone className={`h-4 w-4 ${session.is_current ? "text-emerald-600" : "text-slate-500"}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">
                    {browser} · {os}
                  </p>
                  {session.is_current && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 shrink-0">
                      This device
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Wifi className="h-3 w-3" />
                    {session.ip_address}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatDate(session.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Revoke button */}
            {!session.is_current && (
              <button
                onClick={() => revokeOne(session.id)}
                disabled={revoking === session.id}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 px-2.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                {revoking === session.id
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <><X className="h-3 w-3" /> Revoke</>
                }
              </button>
            )}
          </div>
        );
      })}

      {/* Revoke all — only show if there are other sessions */}
      {!loading && otherSessions.length > 0 && (
        <div className="px-5 pb-4 pt-1">
          <button
            onClick={revokeAll}
            disabled={revokingAll}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            {revokingAll
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Revoking…</>
              : <><LogOut className="h-3.5 w-3.5" /> Revoke All Other Sessions ({otherSessions.length})</>
            }
          </button>
        </div>
      )}

      {/* Empty other sessions */}
      {!loading && !error && sessions.length > 0 && otherSessions.length === 0 && (
        <div className="px-5 pb-4 pt-2">
          <p className="text-center text-[11px] text-slate-400 py-2">
            No other active sessions
          </p>
        </div>
      )}
    </Section>
  );
}

/* ══════════════════════════════════════════
   SETTINGS PAGE
══════════════════════════════════════════ */
export function SettingsPage() {
  const navigate   = useNavigate();
  const logout     = useAuthStore((s: any) => s.logout);
  const user       = useAuthStore((s: any) => s.user);
  const updateUser = useAuthStore((s: any) => s.updateUser);
  const [loggingOut,      setLoggingOut]      = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatingTwoFactor, setUpdatingTwoFactor] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");

  const [notifs, setNotifs] = useState({
    transactions: true,
    fraud_alerts: true,
    login_alerts: true,
    promotions:   false,
    low_balance:  true,
  });

  const [privacy, setPrivacy] = useState({
    hide_balance:      false,
    hide_transactions: false,
    two_factor:        user?.two_factor_enabled ?? true,
  });

  const [theme,    setTheme]    = useState<"light" | "dark" | "system">("light");
  const [language, setLanguage] = useState("English");

  const toggle = (group: "notifs" | "privacy", key: string) => {
    if (group === "notifs")
      setNotifs(p  => ({ ...p, [key]: !p[key as keyof typeof p] }));
    else
      setPrivacy(p => ({ ...p, [key]: !p[key as keyof typeof p] }));
  };

  useEffect(() => {
    setPrivacy((current) => ({
      ...current,
      two_factor: user?.two_factor_enabled ?? true,
    }));
  }, [user?.two_factor_enabled]);

  const handleTwoFactorToggle = async () => {
    const enabled = !privacy.two_factor;
    setUpdatingTwoFactor(true);
    setTwoFactorError("");
    try {
      const response = await authApi.updateTwoFactor(enabled);
      const nextEnabled = response.data?.data?.two_factor_enabled;
      if (typeof nextEnabled !== "boolean") {
        throw new Error("The server returned an invalid security setting.");
      }
      updateUser({ two_factor_enabled: nextEnabled });
      setPrivacy((current) => ({ ...current, two_factor: nextEnabled }));
    } catch (error: any) {
      setTwoFactorError(
        error?.response?.data?.message ??
          error?.message ??
          "Unable to update two-factor authentication.",
      );
    } finally {
      setUpdatingTwoFactor(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    navigate({ to: "/sign-in" });
  };

  return (
    <>
      <AppLayout title="Settings" subtitle="Manage your preferences & security">
        <div className="p-5 md:p-7">
          <div className="mx-auto max-w-2xl space-y-5">

            {/* ── Notification Preferences ── */}
            <Section title="Notification Preferences" icon={Bell}>
              {[
                { key: "transactions", label: "Transaction Alerts",   description: "Get notified for every send/receive",        icon: CreditCard, ibg: "bg-teal-100",    ic: "text-teal-600"    },
                { key: "fraud_alerts", label: "Fraud Alerts",         description: "Instant alert when a transaction is blocked", icon: Shield,     ibg: "bg-rose-100",    ic: "text-rose-600"    },
                { key: "login_alerts", label: "Login Alerts",         description: "Notify on new device login",                  icon: Lock,       ibg: "bg-amber-100",   ic: "text-amber-600"   },
                { key: "low_balance",  label: "Low Balance Warning",  description: "Alert when balance drops below ₹1,000",    icon: Wallet,     ibg: "bg-emerald-100", ic: "text-emerald-600" },
                { key: "promotions",   label: "Promotions & Updates", description: "News, offers and app updates",                icon: Bell,       ibg: "bg-slate-100",   ic: "text-slate-500"   },
              ].map(({ key, label, description, icon, ibg, ic }) => (
                <SettingRow key={key} icon={icon} iconBg={ibg} iconColor={ic} label={label} description={description}>
                  <Toggle
                    enabled={notifs[key as keyof typeof notifs]}
                    onChange={() => toggle("notifs", key)}
                  />
                </SettingRow>
              ))}
            </Section>

            {/* ── Privacy ── */}
            <Section title="Privacy" icon={Eye}>
              <SettingRow icon={EyeOff} iconBg="bg-slate-100" iconColor="text-slate-600"
                label="Hide Balance" description="Mask wallet balance on dashboard by default">
                <Toggle enabled={privacy.hide_balance} onChange={() => toggle("privacy", "hide_balance")} />
              </SettingRow>
              <SettingRow icon={Lock} iconBg="bg-cyan-100" iconColor="text-cyan-600"
                label="Private Transaction History" description="Hide transaction details from screenshots">
                <Toggle enabled={privacy.hide_transactions} onChange={() => toggle("privacy", "hide_transactions")} />
              </SettingRow>
              <SettingRow icon={Shield} iconBg="bg-emerald-100" iconColor="text-emerald-600"
                label="Two-Factor Authentication"
                description={user?.is_verified
                  ? "Require an SMS verification code for each sign-in"
                  : "Verify your phone before enabling sign-in codes"}>
                <Toggle
                  enabled={privacy.two_factor}
                  onChange={handleTwoFactorToggle}
                  disabled={updatingTwoFactor || (!user?.is_verified && !privacy.two_factor)}
                />
              </SettingRow>
              {twoFactorError && (
                <p role="alert" className="px-5 pb-4 text-xs font-medium text-rose-600">
                  {twoFactorError}
                </p>
              )}
            </Section>

            {/* ── Appearance ── */}
            <Section title="Appearance" icon={Sun}>
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                    <Sun className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Theme</p>
                    <p className="text-[11px] text-slate-400">Choose your display theme</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "light",  label: "Light",  icon: Sun     },
                    { value: "dark",   label: "Dark",   icon: Moon    },
                    { value: "system", label: "System", icon: Monitor },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={() => setTheme(value)}
                      className={`flex flex-col items-center gap-2 rounded-xl border py-3 text-xs font-semibold transition-all
                        ${theme === value
                          ? "border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/20"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                      <Languages className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Language</p>
                      <p className="text-[11px] text-slate-400">App display language</p>
                    </div>
                  </div>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option>English</option>
                    <option>Urdu</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* ── Active Sessions — fully dynamic component ── */}
            <SessionsSection />

            {/* ── About ── */}
            <Section title="About" icon={Globe}>
              {[
                { label: "App Version",      value: "v1.0.0"             },
                { label: "Privacy Policy",   value: "View →"             },
                { label: "Terms of Service", value: "View →"             },
                { label: "Support",          value: "support@paysafe.in" },
              ].map(({ label, value }) => (
                <button key={label} className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className="text-sm font-semibold text-teal-600">{value}</p>
                </button>
              ))}
            </Section>

            {/* ── Danger Zone ── */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-400 mb-4">
                Danger Zone
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-rose-800">Log Out</p>
                    <p className="text-[11px] text-rose-500">Sign out from this device</p>
                  </div>
                  <Button variant="outline" onClick={handleLogout} disabled={loggingOut}
                    className="h-9 rounded-xl border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-100"
                  >
                    {loggingOut
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <><LogOut className="mr-1.5 h-3.5 w-3.5" /> Log Out</>
                    }
                  </Button>
                </div>
                <div className="border-t border-rose-200 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-rose-800">Delete Account</p>
                    <p className="text-[11px] text-rose-500">Permanently delete all data</p>
                  </div>
                  <Button onClick={() => setShowDeleteModal(true)}
                    className="h-9 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md shadow-rose-600/20"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </AppLayout>

      {showDeleteModal && <DeleteModal onClose={() => setShowDeleteModal(false)} />}
    </>
  );
}