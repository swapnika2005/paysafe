import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight, Eye, EyeOff, User, Mail, Hash,
  Shield, ArrowLeft, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/hooks/useAuth";


const VALIDATORS = {
  full_name: (v: string) =>
    v.trim().length < 2 ? "Full name must be at least 2 characters." : null,

  email: (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email address.",

  phone: (v: string) =>
    /^[6-9]\d{9}$/.test(v) ? null : "Enter a valid 10-digit Indian mobile number.",

  pan: (v: string) =>
    /^[A-Z]{5}\d{4}[A-Z]$/.test(v) ? null : "Enter a valid PAN (e.g. ABCDE1234F).",

  password: (v: string) => {
    if (v.length < 8) return "Password must be at least 8 characters.";
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v))
      return "Must contain at least one special character (e.g. @, !, #).";
    return null;
  },

  pin: (v: string) =>
    /^\d{4}$/.test(v) ? null : "PIN must be exactly 4 digits.",
};

type FormField = keyof typeof VALIDATORS;

export function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [pan, setPan] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    pin: "",
  });

 

  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});

  const { mutate: register, isPending, isError, error } = useRegister();

 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleBlur = (field: FormField) => {
    setTouched((p) => ({ ...p, [field]: true }));
  };


  const fieldError = (field: FormField): string | null => {
    if (!touched[field]) return null;
    const value = field === "pan" ? pan : field === "phone" ? form.phone : form[field];
    return VALIDATORS[field](value);
  };

const getApiErrorMessage = (): string | null => {
  if (!error) return null;
  const data = (error as any)?.response?.data;
  const apiError = data?.errors ?? data?.error;  
  if (apiError?.fields) {
    return Object.values(apiError.fields)[0] as string;
  }
  return apiError?.message || data?.message || "Something went wrong. Please try again.";
};
  const isFormValid =
    !VALIDATORS.full_name(form.full_name) &&
    !VALIDATORS.email(form.email) &&
    !VALIDATORS.phone(form.phone) &&
    !VALIDATORS.pan(pan) &&
    !VALIDATORS.password(form.password) &&
    !VALIDATORS.pin(form.pin);

  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    
    setTouched({
      full_name: true, email: true, phone: true,
      pan: true, password: true, pin: true,
    });

    if (!isFormValid) return;

    register({
      full_name: form.full_name,
      email:     form.email,
      phone:     form.phone,
      pan,
      password:  form.password,
      pin:       form.pin,
    });
  };

 
  const inputClass = (field: FormField, extra = "") => {
    const err = fieldError(field);
    const isDirty = touched[field];
    const base =
      "w-full h-13 px-5 pr-12 rounded-2xl bg-white/70 border-2 transition-all text-sm placeholder:text-slate-400 focus:ring-4 outline-none";
    if (isDirty && err)
      return `${base} border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 ${extra}`;
    if (isDirty && !err)
      return `${base} border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20 ${extra}`;
    return `${base} border-slate-200/60 focus:border-teal-500 focus:ring-teal-500/20 ${extra}`;
  };

  
  const FieldMessage = ({ field }: { field: FormField }) => {
    const err = fieldError(field);
    if (!touched[field]) return null;
    if (err)
      return (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-rose-500 px-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {err}
        </p>
      );
    return (
      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 px-1">
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        Looks good!
      </p>
    );
  };

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

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-linear-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-linear-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              Get Started
            </h1>
            <p className="text-slate-500 text-sm">Create your account in seconds</p>
          </div>

          {/* API Error Banner (server errors only) */}
          {isError && (
            <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <p className="text-sm font-medium text-rose-700">{getApiErrorMessage()}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
              <div className="group relative">
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  onBlur={() => handleBlur("full_name")}
                  placeholder="Enter your full name"
                  className={inputClass("full_name")}
                />
                <User className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
              </div>
              <FieldMessage field="full_name" />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
              <div className="group relative">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  placeholder="you@example.com"
                  className={inputClass("email")}
                />
                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
              </div>
              <FieldMessage field="email" />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Phone Number</label>
              <div className={`flex overflow-hidden rounded-2xl border-2 bg-white/70 transition-all focus-within:ring-4 ${
                touched.phone && fieldError("phone")
                  ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/20"
                  : touched.phone && !fieldError("phone")
                  ? "border-emerald-400 focus-within:border-emerald-500 focus-within:ring-emerald-500/20"
                  : "border-slate-200/60 focus-within:border-teal-500 focus-within:ring-teal-500/20"
              }`}>
                <span className="flex items-center border-r border-slate-200 bg-white/50 px-4 text-sm font-semibold text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  onBlur={() => handleBlur("phone")}
                  placeholder="9876543210"
                  className="flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <FieldMessage field="phone" />
            </div>

            {/* PAN */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">PAN</label>
              <div className="group relative">
                <input
                  type="text"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                  onBlur={() => handleBlur("pan")}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className={inputClass("pan", "font-mono tracking-wider")}
                />
                <Hash className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
              </div>
              <FieldMessage field="pan" />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="group relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur("password")}
                  placeholder="Min 8 chars with special character"
                  className={inputClass("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <FieldMessage field="password" />
            </div>

            {/* PIN */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                4-Digit Transaction PIN
              </label>
              <div className="group relative">
                <input
                  type="password"
                  name="pin"
                  value={form.pin}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                  onBlur={() => handleBlur("pin")}
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={4}
                  className={inputClass("pin", "text-center tracking-[0.5em] font-mono")}
                />
                <Shield className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
              </div>
              <FieldMessage field="pin" />
              {!touched.pin && (
                <p className="mt-1.5 text-[11px] text-slate-400 px-1">
                  Used to confirm every money transfer
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="group relative w-full h-13 rounded-2xl bg-linear-to-r from-teal-600 via-cyan-600 to-purple-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
            >
              <span className="flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="font-semibold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent hover:from-teal-700 hover:to-cyan-700 transition-all"
            >
              Sign in
            </Link>
          </p>
        </div>

         </div>
    </div>
  );
}