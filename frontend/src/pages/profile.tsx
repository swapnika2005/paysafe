import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  AlertTriangle,
  Camera,
  Check,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Wallet,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { authApi } from "@/api/endpoints/auth.api";
import useAuthStore from "@/store/auth.store";
import { formatIndianPhone } from "@/lib/formatters";

/* ── Types ── */
interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_verified: boolean;
  is_frozen: boolean;
  is_email_verified?: boolean;
  pan?: string;
  avatar_url: string | null;
  created_at: string;
  last_login: string;
  wallet: {
    id: string;
    balance: string;
    currency: string;
  };
}

/* ── InfoRow ── */
function InfoRow({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <p className="text-[11px] font-medium text-slate-400 w-28 shrink-0">
        {label}
      </p>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <p
          className={`text-sm font-semibold text-slate-800 truncate ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </p>
        {copyable && (
          <button
            onClick={copy}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Change Password Modal ── */
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.current || !form.newPass || !form.confirm) {
      setError("All fields are required.");
      return;
    }
    if (form.newPass !== form.confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (form.newPass.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // POST /auth/change-password — adjust endpoint if your backend differs
      await (authApi as any).changePassword?.({
        current_password: form.current,
        new_password: form.newPass,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "Failed to update password. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Change Password</p>
            <p className="text-[11px] text-slate-400">
              Keep your account secure
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {success ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-emerald-700">
                Password changed!
              </p>
            </div>
          ) : (
            <>
              {[
                {
                  key: "current",
                  label: "Current Password",
                  showKey: "current",
                },
                { key: "newPass", label: "New Password", showKey: "newPass" },
                {
                  key: "confirm",
                  label: "Confirm Password",
                  showKey: "confirm",
                },
              ].map(({ key, label, showKey }) => (
                <div key={key}>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">
                    {label}
                  </p>
                  <div className="relative">
                    <input
                      type={
                        show[showKey as keyof typeof show] ? "text" : "password"
                      }
                      value={form[key as keyof typeof form]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [key]: e.target.value }))
                      }
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShow((p) => ({
                          ...p,
                          [showKey]: !p[showKey as keyof typeof p],
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {show[showKey as keyof typeof show] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {error && (
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {error}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl border-slate-200 text-sm font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 text-white text-sm font-bold shadow-md shadow-teal-600/20"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Change PIN Modal ── */
function ChangePinModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ current: "", newPin: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.current || !form.newPin || !form.confirm) {
      setError("All fields are required.");
      return;
    }
    if (!/^\d{4}$/.test(form.newPin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    if (form.newPin !== form.confirm) {
      setError("PINs do not match.");
      return;
    }
    const weak = ["1234", "4321", "0000", "1111", "2222", "3333", "4444"];
    if (weak.includes(form.newPin)) {
      setError("PIN is too weak. Choose a stronger one.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Uses authApi.changePin — calls POST /auth/pin/change
      await authApi.changePin({
        current_pin: form.current,
        new_pin: form.newPin,
        confirm_pin: form.confirm,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "Failed to update PIN. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-slate-900">
              Change Transaction PIN
            </p>
            <p className="text-[11px] text-slate-400">
              4-digit PIN for sending money
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {success ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-emerald-700">PIN updated!</p>
            </div>
          ) : (
            <>
              {[
                { key: "current", label: "Current PIN", placeholder: "••••" },
                { key: "newPin", label: "New PIN", placeholder: "4 digits" },
                {
                  key: "confirm",
                  label: "Confirm PIN",
                  placeholder: "4 digits",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">
                    {label}
                  </p>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [key]: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 tracking-widest placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder={placeholder}
                  />
                </div>
              ))}
              {error && (
                <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {error}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl border-slate-200 text-sm font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 text-white text-sm font-bold shadow-md shadow-teal-600/20"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update PIN"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-pulse">
      <div className="rounded-2xl bg-slate-200 h-44" />
      <div className="rounded-2xl bg-white border border-slate-100 p-5 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between py-2">
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white border border-slate-100 h-40" />
      <div className="rounded-2xl bg-slate-100 h-20" />
    </div>
  );
}

/* ══════════════════════════════════════════
   PROFILE PAGE
══════════════════════════════════════════ */
export function ProfilePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Data state ── */
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── UI state ── */
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [displayName, setDisplayName] = useState("");

  /* ── Fetch profile ── */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await authApi.me();
      const u: UserProfile = res.data?.data?.user ?? res.data?.data ?? res.data;
      setUser(u);
      setDisplayName(u.full_name);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? e?.message ?? "Failed to load profile.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ── Logout ── */
  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    logout();
    navigate({ to: "/sign-in" });
  };

  /* ── Derived ── */
  const initials = displayName
    ? displayName
        .split(" ")
        .map((s: string) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  const joinDate = user
    ? new Date(user.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const lastLogin = user
    ? new Date(user.last_login).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const walletBalance = user
    ? parseFloat(user.wallet.balance).toLocaleString("en-IN")
    : "0";

  /* ── Header right ── */
  const headerRight = (
    <button
      onClick={fetchProfile}
      disabled={loading}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40"
      title="Refresh"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
    </button>
  );

  return (
    <>
      <AppLayout
        title="My Profile"
        subtitle="Manage your account information"
        headerRight={headerRight}
      >
        <div className="p-5 md:p-7">
          {/* Loading */}
          {loading && <ProfileSkeleton />}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <p className="text-sm font-medium text-slate-600">{error}</p>
              <button
                onClick={fetchProfile}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && user && (
            <div className="mx-auto max-w-2xl space-y-5">
              {/* ── Avatar + name hero ── */}
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-teal-900 to-cyan-900 p-6 text-white shadow-xl shadow-teal-900/30">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
                <div className="absolute -bottom-4 right-20 h-16 w-16 rounded-full bg-white/5" />
                <div className="relative flex items-center gap-5">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-teal-400 to-cyan-500 text-2xl font-black text-white shadow-lg overflow-hidden">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-white text-teal-600 shadow-md hover:bg-teal-50 transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-black text-white truncate">
                        {displayName}
                      </p>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {user.is_verified && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                      {user.is_frozen && (
                        <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                          Frozen
                        </span>
                      )}
                      <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-200 uppercase tracking-widest">
                        {user.role}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-teal-200">
                      Member since {joinDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Account info ── */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                  <User className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-bold text-slate-800">
                    Account Information
                  </p>
                </div>
                <div className="px-5 py-2">
                  <InfoRow label="Full Name" value={displayName} />
                  <InfoRow label="User ID" value={user.id} mono copyable />
                  <InfoRow label="Role" value={user.role} />
                  <InfoRow label="Joined" value={joinDate} />
                  <InfoRow label="Last Login" value={lastLogin} />
                </div>
              </div>

              {/* ── Contact info ── */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-bold text-slate-800">
                    Contact Details
                  </p>
                </div>
                <div className="divide-y divide-slate-50 px-5">
                  {/* Phone */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                        <Phone className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">
                          Phone Number
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatIndianPhone(user.phone)}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100">
                        <Mail className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">
                          Email Address
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {user.is_email_verified ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        <BadgeCheck className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => authApi.sendOtp("email")}
                        className="flex items-center gap-1 rounded-xl bg-teal-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-teal-700 transition-colors"
                      >
                        Verify email
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 py-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                      <MapPin className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Address</p>
                      <p className="text-sm font-semibold text-slate-800">
                        Bengaluru, India
                      </p>
                    </div>
                  </div>

                  {user.pan && (
                    <div className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                          <Shield className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">PAN</p>
                          <p className="text-sm font-semibold font-mono text-slate-800">
                            {user.pan.replace(/^(.{5}).{4}(.)$/, "$1****$2")}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                        Masked
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Wallet snapshot ── */}
              <div className="rounded-2xl border border-teal-100 bg-linear-to-r from-teal-50 to-cyan-50 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 shadow-md shadow-teal-600/20">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] text-teal-600 font-medium">
                        Wallet Balance · {user.wallet.currency}
                      </p>
                      <p className="text-xl font-black text-teal-900">
                        ₹{walletBalance}
                      </p>
                    </div>
                  </div>
                  <Link to="/wallet">
                    <Button className="h-9 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md shadow-teal-600/20 hover:bg-teal-700">
                      View Wallet
                    </Button>
                  </Link>
                </div>
              </div>

              {/* ── Security ── */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-bold text-slate-800">Security</p>
                </div>
                <div className="divide-y divide-slate-50">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-teal-100 transition-colors">
                        <KeyRound className="h-4 w-4 text-slate-500 group-hover:text-teal-600 transition-colors" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-800">
                          Change Password
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Update your login password
                        </p>
                      </div>
                    </div>
                    <Edit2 className="h-4 w-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </button>
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-teal-100 transition-colors">
                        <Shield className="h-4 w-4 text-slate-500 group-hover:text-teal-600 transition-colors" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-800">
                          Change Transaction PIN
                        </p>
                        <p className="text-[11px] text-slate-400">
                          4-digit PIN used to send money
                        </p>
                      </div>
                    </div>
                    <Edit2 className="h-4 w-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </button>
                </div>
              </div>

              {/* ── Danger zone ── */}
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-400 mb-3">
                  Danger Zone
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-rose-800">Log Out</p>
                    <p className="text-[11px] text-rose-500">
                      Sign out from this device
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="h-9 rounded-xl border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-100 hover:border-rose-400"
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" /> Log Out
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>

      {/* ── Modals ── */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
      {showPinModal && (
        <ChangePinModal onClose={() => setShowPinModal(false)} />
      )}
      
    </>
  );
}
