import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,ArrowRight, AlertTriangle,
  CheckCircle2, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForgotPassword } from "@/hooks/useAuth";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");

  const {
    mutate:    forgotPassword,
    isPending,
    isError,
    error,
    
  } = useForgotPassword();

  const getError = (err: unknown) => {
    const e = err as any;
    const apiError = e?.response?.data?.error;
    if (apiError?.fields) return Object.values(apiError.fields)[0] as string;
    return (
      apiError?.message ||
      e?.response?.data?.message ||
      "Something went wrong. Please try again."
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = phone;
    forgotPassword(fullPhone, {
      onSuccess: () => {
        // Pass phone to reset page via navigation state
        navigate({
          to: "/reset_password",
          search: { phone: fullPhone },
        });
      },
    });
  };

  const isValid = /^[6-9]\d{9}$/.test(phone);

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-purple-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />

      {/* Back */}
      <Link
        to="/sign-in"
        className="group absolute left-6 top-6 p-3 bg-white/80 backdrop-blur-sm border border-white/50 hover:border-slate-200/70 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-x-1 transition-all duration-300 z-50"
      >
        <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
      </Link>

      <div className="relative z-10 w-full max-w-sm">
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-10">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-linear-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/25">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Forgot password?
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Enter your registered phone number. We'll send a verification code to reset your password.
            </p>
          </div>

          {/* Error */}
          {isError && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <p className="text-sm font-medium text-rose-700">{getError(error)}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number
              </label>
              <div className="flex overflow-hidden rounded-2xl border-2 border-slate-200/60 bg-white/70 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/20 transition-all">
                <span className="flex items-center border-r border-slate-200 bg-white/50 px-4 text-sm font-semibold text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="3001234567"
                  className="flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  required
                  autoFocus
                />
                {isValid && (
                  <span className="flex items-center pr-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 px-1">
                We'll send a 6-digit OTP to this number
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending || !isValid}
              className="group relative w-full h-12 rounded-2xl bg-linear-to-r from-teal-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending code…
                  </>
                ) : (
                  <>
                    Send Reset Code
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Remember your password?{" "}
            <Link
              to="/sign-in"
              className="font-semibold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              Sign in
            </Link>
          </p>
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
