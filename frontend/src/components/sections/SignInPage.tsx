import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight, Eye, EyeOff, Mail,
  ArrowLeft, AlertTriangle, Lock, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/hooks/useAuth";
import { authApi } from "@/api/endpoints/auth.api";
import useAuthStore from "@/store/auth.store";

export function SignInPage() {
  const [form, setForm]             = useState({ email: "", password: "" });
  const [showPassword, setShowPass] = useState(false);
  const [challenge, setChallenge] = useState<{
    challenge_token: string;
    phone_hint: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [challengeError, setChallengeError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const setAuth = useAuthStore((state: any) => state.setAuth);
  const navigate = useNavigate();

  const {
    mutate:    login,
    isPending,
    isError,
    error,
  } = useLogin();

  // ── Extract API error ──────────────────────────
  const getErrorMessage = () => {
    if (!error) return null;
    const err = error as any;
    const apiError = err?.response?.data?.error;

    // Field-level validation errors
    if (apiError?.fields) {
      return Object.values(apiError.fields)[0] as string;
    }

   
    const codeMessages: Record<string, string> = {
      INVALID_CREDENTIALS: "Incorrect email or password. Please try again.",
      ACCOUNT_FROZEN:      "Your account has been frozen. Contact support.",
      VALIDATION_ERROR:    "Please fill in all required fields.",
    };

    const code = apiError?.code;
    if (code && codeMessages[code]) return codeMessages[code];

    return (
      apiError?.message ||
      err?.response?.data?.message ||
      "Something went wrong. Please try again."
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) return;
    login(
      { email: form.email.trim(), password: form.password },
      {
        onSuccess: (response: any) => {
          const loginData = response.data.data;
          if (loginData.requires_2fa) {
            setChallenge({
              challenge_token: loginData.challenge_token,
              phone_hint: loginData.phone_hint,
            });
          }
        },
      },
    );
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge || !/^\d{6}$/.test(verificationCode)) return;
    setIsVerifying(true);
    setChallengeError("");
    try {
      const { data } = await authApi.verifyLoginOtp({
        challenge_token: challenge.challenge_token,
        code: verificationCode,
      });
      setAuth(data.data.user, data.data.access_token);
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      setChallengeError(
        error?.response?.data?.message ?? "Unable to verify the code. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendLoginCode = async () => {
    if (!challenge) return;
    setIsResending(true);
    setChallengeError("");
    try {
      const { data } = await authApi.resendLoginOtp(challenge.challenge_token);
      setChallenge((current) =>
        current
          ? {
              challenge_token: data.data.challenge_token,
              phone_hint: data.data.phone_hint,
            }
          : current,
      );
      setVerificationCode("");
    } catch (error: any) {
      setChallengeError(
        error?.response?.data?.message ?? "Unable to resend the code. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const isFormValid = form.email.trim() && form.password.trim();

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-purple-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Back Button */}
      <Link
        to="/"
        className="group absolute left-6 top-6 p-3 bg-white/80 backdrop-blur-sm border border-white/50 hover:border-slate-200/70 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-x-1 transition-all duration-300 z-50"
      >
        <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
      </Link>

      <div className="relative z-10 w-full max-w-sm">
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-10 transition-all duration-500 hover:shadow-3xl hover:-translate-y-1">

          {/* ── Header ── */}
          <div className="text-center mb-8">
            <img src="/paysafe-logo.png" alt="PaySafe" className="mx-auto mb-6 h-20 w-32 object-contain" />
            <h1 className="text-3xl font-bold bg-linear-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              {challenge ? "Verify it’s you" : "Welcome back"}
            </h1>
            <p className="text-slate-500 text-sm">
              {challenge
                ? `Enter the code sent to ${challenge.phone_hint}`
                : "Sign in to your PaySafe account"}
            </p>
          </div>

          {!challenge ? (
            <>
              {isError && (
                <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                  <p className="text-sm font-medium text-rose-700">{getErrorMessage()}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="group relative">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-13 px-5 pr-12 rounded-2xl bg-white/70 border-2 border-slate-200/60 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all text-sm placeholder:text-slate-400 outline-none"
                  required
                />
                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot_password"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="group relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-13 px-5 pr-12 rounded-2xl bg-white/70 border-2 border-slate-200/60 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition-all text-sm placeholder:text-slate-400 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="h-5 w-5" />
                    : <Eye    className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* ── Submit ── */}
            <Button
              type="submit"
              disabled={isPending || !isFormValid}
              className="group relative w-full h-13 rounded-2xl bg-linear-to-r from-teal-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
            >
              <span className="flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"
                      />
                      <path
                        className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Sign In
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>
              </form>

              <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white/60 px-3 text-xs font-medium text-slate-400">
                New to PaySafe?
              </span>
            </div>
              </div>

              <Link to="/sign-up">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-2xl border-2 border-slate-200 bg-white/50 text-slate-700 text-sm font-semibold hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all"
            >
              Create an account
            </Button>
              </Link>
            </>
          ) : (
            <>
              {challengeError && (
                <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <p className="text-sm font-medium text-rose-700">{challengeError}</p>
                </div>
              )}
              <form onSubmit={handleVerifyLogin} className="space-y-5">
                <label htmlFor="login-otp" className="block text-sm font-semibold text-slate-700">
                  6-digit SMS code
                </label>
                <div className="relative">
                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) =>
                      setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter code"
                    className="h-13 w-full rounded-2xl border-2 border-slate-200/70 bg-white/70 px-5 text-center font-mono text-lg tracking-[0.5em] outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="w-full h-13 rounded-2xl bg-linear-to-r from-teal-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-xl disabled:opacity-50"
                >
                  {isVerifying ? "Verifying…" : <><Smartphone className="mr-2 h-4 w-4" /> Verify and sign in</>}
                </Button>
              </form>
              <div className="mt-6 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setChallenge(null);
                    setChallengeError("");
                    setVerificationCode("");
                  }}
                  className="font-semibold text-slate-500 hover:text-slate-800"
                >
                  Back to sign in
                </button>
                <button
                  type="button"
                  onClick={handleResendLoginCode}
                  disabled={isResending}
                  className="font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-50"
                >
                  {isResending ? "Sending…" : "Resend code"}
                </button>
              </div>
              <p className="mt-5 text-center text-xs text-slate-400">
                Your code expires in 10 minutes. Never share it with anyone.
              </p>
            </>
          )}
        </div>

      
      </div>
    </div>
  );
}