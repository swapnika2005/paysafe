/// <reference types="vite/client" />
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, CheckCircle2, RefreshCw,
  Shield, Smartphone, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSendOtp, useVerifyOtp } from "@/hooks/useAuth";
import useAuthStore from "@/store/auth.store";

const OTP_LENGTH   = 6;
const RESEND_TIMER = 60;

export function VerifyPhonePage() {
  const user = useAuthStore((s) => s.user);

  const [otp,       setOtp]       = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const [otpSent,   setOtpSent]   = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    mutate:    sendOtp,
    isPending: isSending,
    isError:   isSendError,
    error:     sendError,
  } = useSendOtp();

  const {
    mutate:    verifyOtp,
    isPending: isVerifying,
    isError:   isVerifyError,
    error:     verifyError,
    isSuccess: isVerified,
  } = useVerifyOtp();

  // ── Send OTP — defined BEFORE useEffect that calls it ──
  const handleSendOtp = useCallback(() => {
    sendOtp("PHONE_VERIFY", {
      onSuccess: () => setOtpSent(true),
    });
  }, [sendOtp]);

  // ── Auto-send OTP on mount ──
  useEffect(() => {
    handleSendOtp();
  }, [handleSendOtp]);

  // ── Countdown timer ──
  useEffect(() => {
    if (!otpSent) return;
    setCountdown(RESEND_TIMER);
    setCanResend(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent]);

  // ── Focus first input on mount ──
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ── Handle digit input ──
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === OTP_LENGTH - 1) {
      const fullCode = [...newOtp.slice(0, -1), digit].join("");
      if (fullCode.length === OTP_LENGTH) handleVerify(fullCode);
    }
  };

  // ── Handle backspace ──
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
    if (e.key === "ArrowLeft"  && index > 0)             inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  // ── Handle paste ──
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newOtp = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, i) => { newOtp[i] = digit; });
    setOtp(newOtp);

    const lastIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIndex]?.focus();

    if (pasted.length === OTP_LENGTH) handleVerify(pasted);
  };

  // ── Verify OTP ──
  const handleVerify = (code?: string) => {
    const finalCode = code ?? otp.join("");
    if (finalCode.length !== OTP_LENGTH) return;
    verifyOtp({ code: finalCode, type: "PHONE_VERIFY" });
  };

  // ── Error messages ──
  const getError = (err: unknown) => {
    const e = err as any;
    const apiError = e?.response?.data?.error;
    if (apiError?.fields) return Object.values(apiError.fields)[0] as string;
    return apiError?.message || e?.response?.data?.message || "Something went wrong.";
  };

  const maskedPhone = user?.phone
    ? `+91 ${user.phone.replace(/(\d{2})\d{4}(\d{4})/, "$1****$2")}`
    : "your phone";

  const otpCode    = otp.join("");
  const isComplete = otpCode.length === OTP_LENGTH;

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-purple-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">

      <Link
        to="/sign-in"
        className="group absolute left-6 top-6 p-3 bg-white/80 backdrop-blur-sm border border-white/50 hover:border-slate-200/70 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-x-1 transition-all z-50"
      >
        <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
      </Link>

      <div className="relative z-10 w-full max-w-sm">
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-10">

          {isVerified ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="relative mb-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-400/30">
                  <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20" />
              </div>
              <p className="text-2xl font-black text-slate-900">Verified!</p>
              <p className="mt-2 text-sm text-slate-500">
                Your phone is verified. Redirecting to dashboard…
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-teal-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-linear-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Verify your phone
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                  We sent a {OTP_LENGTH}-digit code to{" "}
                  <span className="font-semibold text-slate-700">{maskedPhone}</span>
                </p>
              </div>

              {isSendError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <p className="text-sm font-medium text-amber-700">{getError(sendError)}</p>
                </div>
              )}

              {isVerifyError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                  <p className="text-sm font-medium text-rose-700">{getError(verifyError)}</p>
                </div>
              )}

              <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isVerifying || isVerified}
                    className={`
                      h-13 w-11 rounded-2xl border-2 text-center text-lg font-bold
                      transition-all duration-200 outline-none
                      ${digit
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-white/70 text-slate-800"
                      }
                      focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  />
                ))}
              </div>

              {import.meta.env.DEV && (
                <p className="mb-4 text-center text-[11px] text-slate-400">
                  Check your terminal for the OTP code
                </p>
              )}

              <Button
                onClick={() => handleVerify()}
                disabled={!isComplete || isVerifying}
                className="w-full h-13 rounded-2xl bg-linear-to-r from-teal-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Verifying…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4" /> Verify Phone
                  </span>
                )}
              </Button>

              <div className="mt-6 text-center">
                {canResend ? (
                  <button
                    onClick={() => {
                      setOtp(Array(OTP_LENGTH).fill(""));
                      inputRefs.current[0]?.focus();
                      handleSendOtp();
                    }}
                    disabled={isSending}
                    className="flex items-center justify-center gap-2 mx-auto text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSending ? "animate-spin" : ""}`} />
                    {isSending ? "Sending…" : "Resend code"}
                  </button>
                ) : (
                  <p className="text-sm text-slate-400">
                    Resend code in{" "}
                    <span className="font-semibold text-slate-600 tabular-nums">
                      {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                      {String(countdown % 60).padStart(2, "0")}
                    </span>
                  </p>
                )}
              </div>

              <p className="mt-5 text-center text-xs text-slate-400">
                Wrong number?{" "}
                <Link to="/sign-up" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                  Go back and edit
                </Link>
              </p>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm border border-white/40 rounded-2xl text-xs text-slate-500 shadow-lg">
            🔒 Code expires in 10 minutes
          </div>
        </div>
      </div>
    </div>
  );
}