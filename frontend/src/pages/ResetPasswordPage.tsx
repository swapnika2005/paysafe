import { useState, useEffect, useRef } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import {
  ArrowLeft, Eye, EyeOff, Lock,
  CheckCircle2, AlertTriangle, RefreshCw,
  Shield, KeyRound,
} from "lucide-react";
import { useResetPassword, useForgotPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const OTP_LENGTH   = 6;
const RESEND_TIMER = 60;

export function ResetPasswordPage() {
  // phone passed from ForgotPasswordPage via ?phone=...
  const { phone } = useSearch({ from: "/reset_password" }) as { phone: string };

  // ── Step state ───────────────────────────────
  const [step, setStep] = useState<"otp" | "password">("otp");

  // ── OTP state ────────────────────────────────
  const [otp,       setOtp]       = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpCode,   setOtpCode]   = useState(""); // confirmed code carried to step 2
  const [countdown, setCountdown] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Password state ───────────────────────────
  const [newPassword,  setNewPassword]  = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  // ── Hooks ────────────────────────────────────
  const {
    mutate:    resetPassword,
    isPending: isResetting,
    isError:   isResetError,
    error:     resetError,
    isSuccess: isReset,
  } = useResetPassword();

  const {
    mutate:    resendOtp,
    isPending: isResending,
    isError:   isResendError,
    error:     resendError,
  } = useForgotPassword();

  // ── Countdown ────────────────────────────────
  useEffect(() => {
    setCountdown(RESEND_TIMER);
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ── Error parser ─────────────────────────────
  const getError = (err: unknown) => {
    const e = err as any;
    const apiError = e?.response?.data?.error;
    if (apiError?.fields) return Object.values(apiError.fields)[0] as string;
    return apiError?.message || e?.response?.data?.message || "Something went wrong.";
  };

  // ── OTP digit handlers ───────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === OTP_LENGTH - 1) {
      const full = [...newOtp.slice(0, -1), digit].join("");
      if (full.length === OTP_LENGTH) advanceToPassword(full);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const n = [...otp]; n[index] = ""; setOtp(n);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const n = [...otp]; n[index - 1] = ""; setOtp(n);
      }
    }
    if (e.key === "ArrowLeft"  && index > 0)              inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    const last = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[last]?.focus();
    if (pasted.length === OTP_LENGTH) advanceToPassword(pasted);
  };

  const advanceToPassword = (code: string) => {
    setOtpCode(code);
    setStep("password");
  };

  // ── Password validation ──────────────────────
  const passwordStrength = () => {
    if (!newPassword) return null;
    const checks = [
      newPassword.length >= 8,
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
      /[A-Z]/.test(newPassword),
      /\d/.test(newPassword),
    ];
    const passed = checks.filter(Boolean).length;
    if (passed <= 1) return { label: "Weak",   color: "bg-rose-500",   width: "w-1/4" };
    if (passed === 2) return { label: "Fair",   color: "bg-amber-500",  width: "w-2/4" };
    if (passed === 3) return { label: "Good",   color: "bg-teal-500",   width: "w-3/4" };
    return               { label: "Strong", color: "bg-emerald-500", width: "w-full"  };
  };

  const strength = passwordStrength();
  const passMatch = newPassword && confirmPass && newPassword === confirmPass;
  const passMismatch = confirmPass && newPassword !== confirmPass;
  const canSubmit =
    newPassword.length >= 8 &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) &&
    newPassword === confirmPass;

  // ── Submit reset ─────────────────────────────
  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    resetPassword({
      phone,
      otp_code: otpCode,
      new_password: newPassword,
      confirm_password: confirmPass,
    });
  };

  // ── Masked phone ─────────────────────────────
  const maskedPhone = phone
    ? phone.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2")
    : "your phone";

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-purple-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />

      {/* Back */}
      <button
        onClick={() => step === "password" ? setStep("otp") : window.history.back()}
        className="group absolute left-6 top-6 p-3 bg-white/80 backdrop-blur-sm border border-white/50 hover:border-slate-200/70 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-x-1 transition-all z-50"
      >
        <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
      </button>

      <div className="relative z-10 w-full max-w-sm">
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-10">

          {/* ══ SUCCESS ══ */}
          {isReset ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="relative mb-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-400/30">
                  <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20" />
              </div>
              <p className="text-2xl font-black text-slate-900">Password Reset!</p>
              <p className="mt-2 text-sm text-slate-500">
                Your password has been updated. Redirecting to sign in…
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-2 w-2 rounded-full bg-teal-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>

          ) : step === "otp" ? (
            /* ══ STEP 1: OTP ══ */
            <>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold">1</div>
                  <span className="text-xs font-semibold text-teal-600">Verify Code</span>
                </div>
                <div className="flex-1 h-px bg-slate-200 mx-2" />
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-xs font-bold">2</div>
                  <span className="text-xs font-semibold text-slate-400">New Password</span>
                </div>
              </div>

              <div className="text-center mb-7">
                <div className="w-16 h-16 bg-linear-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/25">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Enter the code</h1>
                <p className="text-sm text-slate-500">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-slate-700">{maskedPhone}</span>
                </p>
              </div>

              {/* Resend error */}
              {isResendError && (
                <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <p className="text-sm font-medium text-amber-700">{getError(resendError)}</p>
                </div>
              )}

              {/* OTP boxes */}
              <div className="flex justify-center gap-3 mb-7" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={`h-13 w-11 rounded-2xl border-2 text-center text-lg font-bold transition-all outline-none
                      ${digit
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white/70 text-slate-800"
                      }
                      focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20
                    `}
                  />
                ))}
              </div>

              {import.meta.env.DEV && (
                <p className="mb-4 text-center text-[11px] text-slate-400">
                  Check your terminal for the OTP code
                </p>
              )}

              {/* Next button (also auto-advances on 6th digit) */}
              <button
                onClick={() => {
                  const code = otp.join("");
                  if (code.length === OTP_LENGTH) advanceToPassword(code);
                }}
                disabled={otp.join("").length < OTP_LENGTH}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                Continue
              </button>

              {/* Resend */}
              <div className="mt-5 text-center">
                {canResend ? (
                  <button
                    onClick={() => {
                      setOtp(Array(OTP_LENGTH).fill(""));
                      inputRefs.current[0]?.focus();
                      resendOtp(phone, {
                        onSuccess: () => {
                          setCountdown(RESEND_TIMER);
                          setCanResend(false);
                        },
                      });
                    }}
                    disabled={isResending}
                    className="flex items-center justify-center gap-2 mx-auto text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
                    {isResending ? "Sending…" : "Resend code"}
                  </button>
                ) : (
                  <p className="text-sm text-slate-400">
                    Resend in{" "}
                    <span className="font-semibold text-slate-600 tabular-nums">
                      {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                      {String(countdown % 60).padStart(2, "0")}
                    </span>
                  </p>
                )}
              </div>
            </>

          ) : (
            /* ══ STEP 2: NEW PASSWORD ══ */
            <>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">✓</div>
                  <span className="text-xs font-semibold text-emerald-600">Code Verified</span>
                </div>
                <div className="flex-1 h-px bg-teal-200 mx-2" />
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold">2</div>
                  <span className="text-xs font-semibold text-teal-600">New Password</span>
                </div>
              </div>

              <div className="text-center mb-7">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal-500/25">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Set new password</h1>
                <p className="text-sm text-slate-500">
                  Choose a strong password you haven't used before
                </p>
              </div>

              {/* Reset error */}
              {isResetError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                  <p className="text-sm font-medium text-rose-700">{getError(resetError)}</p>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-5">

                {/* New Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    New Password
                  </label>
                  <div className="group relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars with special character"
                      className="w-full h-12 px-4 pr-12 rounded-2xl bg-white/70 border-2 border-slate-200/60 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all text-sm placeholder:text-slate-400 outline-none"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {strength && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                      </div>
                      <p className={`text-[11px] font-semibold px-0.5
                        ${strength.label === "Weak"   ? "text-rose-500"    : ""}
                        ${strength.label === "Fair"   ? "text-amber-500"   : ""}
                        ${strength.label === "Good"   ? "text-teal-500"    : ""}
                        ${strength.label === "Strong" ? "text-emerald-500" : ""}
                      `}>
                        {strength.label} password
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <div className="group relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repeat your new password"
                      className={`w-full h-12 px-4 pr-12 rounded-2xl bg-white/70 border-2 transition-all text-sm placeholder:text-slate-400 outline-none
                        ${passMismatch
                          ? "border-rose-400 focus:ring-rose-500/20"
                          : passMatch
                            ? "border-emerald-400 focus:ring-emerald-500/20"
                            : "border-slate-200/60 focus:border-teal-500 focus:ring-teal-500/20"
                        }
                        focus:ring-4
                      `}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passMismatch && (
                    <p className="mt-1.5 text-[11px] font-medium text-rose-500 px-1">
                      Passwords do not match
                    </p>
                  )}
                  {passMatch && (
                    <p className="mt-1.5 text-[11px] font-medium text-emerald-500 px-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Password rules */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5">
                  {[
                    { rule: "At least 8 characters",           met: newPassword.length >= 8 },
                    { rule: "One special character (!@#$...)",  met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
                    { rule: "One uppercase letter",             met: /[A-Z]/.test(newPassword) },
                    { rule: "One number",                       met: /\d/.test(newPassword) },
                  ].map(({ rule, met }) => (
                    <div key={rule} className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center transition-colors
                        ${met ? "bg-emerald-100" : "bg-slate-100"}`}
                      >
                        {met
                          ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          : <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        }
                      </div>
                      <p className={`text-[11px] font-medium transition-colors ${met ? "text-emerald-600" : "text-slate-400"}`}>
                        {rule}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isResetting || !canSubmit}
                  className="group relative w-full h-12 rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isResetting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Resetting…
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </span>
                </Button>
              </form>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl text-xs text-slate-500 shadow-lg">
            🔒 Protected with enterprise-grade security
          </div>
        </div>
      </div>
    </div>
  );
}