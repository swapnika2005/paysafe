import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, AlertCircle,
         MessageSquare, HeadphonesIcon, Building2, ArrowLeft, Wallet } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const CONTACT_CARDS = [
  {
    icon: HeadphonesIcon,
    title: "Customer Support",
    value: "support@paysafe.in",
    sub: "Replies within 2 hours",
    color: "bg-teal-100 text-teal-600",
    href: "mailto:support@paysafe.in",
  },
  {
    icon: Wallet,
    title: "Payment currency",
    value: "Indian Rupee · INR",
    sub: "Balances and transfers in ₹",
    color: "bg-emerald-100 text-emerald-600",
    href: "tel:0800723732",
  },
  {
    icon: Building2,
    title: "Head Office",
    value: "Bengaluru, India",
    sub: "Bengaluru, Karnataka",
    color: "bg-violet-100 text-violet-600",
    href: "#",
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: "9am – 9pm",
    sub: "Monday to Saturday",
    color: "bg-amber-100 text-amber-600",
    href: "#",
  },
];

const TOPICS = [
  "Account & Login",
  "Transaction Issue",
  "Fraud & Security",
  "Wallet & Balance",
  "Technical Problem",
  "Partnership / Business",
  "Other",
];

type FormState = "idle" | "loading" | "success" | "error";

export function ContactPage() {
  const [form, setForm] = useState({
    name:    "",
    email:   "",
    phone:   "",
    topic:   "",
    message: "",
  });
  const [formState, setFormState] = useState<FormState>("idle");

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
  };

  const isValid = form.name.trim() && form.email.includes("@") && form.topic && form.message.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid) return;
    setFormState("loading");
    // Simulate submission (swap for real API call)
    await new Promise(r => setTimeout(r, 1500));
    setFormState("success");
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-600/20 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-600/15 blur-3xl" />
        </div>
        {/* Back button */}
        <button
          onClick={() => navigate({ to: "/" })}
          className="absolute left-6 top-6 flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-teal-300">
            <MessageSquare className="h-3.5 w-3.5" /> Get in Touch
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            We're here to
            <br />
            <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              help you
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Have a question, issue, or feedback? Our support team is ready to help. Reach out any way you prefer.
          </p>
        </div>
      </section>

      {/* ── Contact Cards ── */}
      <section className="border-b border-slate-100 bg-slate-50 px-6 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {CONTACT_CARDS.map(({ icon: Icon, title, value, sub, color, href }) => (
            <a
              key={title}
              href={href}
              className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all hover:border-teal-200 hover:shadow-md"
            >
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── Form + Info ── */}
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.6fr]">

          {/* Left info */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-600">Support</p>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Send us a message
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Fill in the form and our team will get back to you within 2 hours during business hours. For urgent issues, call our helpline directly.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Email</p>
                  <p className="text-xs text-slate-500">support@paysafe.in</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Payment currency</p>
                  <p className="text-xs text-slate-500">Indian Rupee (INR) · ₹</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Office</p>
                  <p className="text-xs text-slate-500">Bengaluru, Karnataka, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm">

            {formState === "success" ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="relative mb-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-400/30">
                    <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20" />
                </div>
                <p className="text-xl font-black text-slate-900">Message Sent!</p>
                <p className="mt-2 max-w-xs text-sm text-slate-500">
                  We've received your message and will reply to <span className="font-semibold text-slate-700">{form.email}</span> within 2 hours.
                </p>
                <button
                  onClick={() => {
                    setForm({ name: "", email: "", phone: "", topic: "", message: "" });
                    setFormState("idle");
                  }}
                  className="mt-6 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formState === "error" && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <p className="text-xs font-medium text-rose-700">Something went wrong. Please try again.</p>
                  </div>
                )}

                {/* Name + Email */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={e => handleChange("name", e.target.value)}
                      placeholder="Ali Ahmed"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => handleChange("email", e.target.value)}
                      placeholder="ali@example.com"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Phone Number <span className="text-slate-300">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => handleChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                  />
                </div>

                {/* Topic */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Topic <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={form.topic}
                    onChange={e => handleChange("topic", e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                  >
                    <option value="">Select a topic…</option>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Message <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => handleChange("message", e.target.value)}
                    rows={4}
                    placeholder="Describe your issue or question in detail…"
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    {form.message.length} chars {form.message.length < 10 && form.message.length > 0 && <span className="text-amber-500">(min 10)</span>}
                  </p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!isValid || formState === "loading"}
                  className="h-12 w-full rounded-2xl bg-linear-to-r from-teal-600 to-cyan-600 text-sm font-bold text-white shadow-lg shadow-teal-600/25 hover:scale-[1.01] hover:shadow-xl hover:shadow-teal-600/30 transition-all disabled:opacity-40 disabled:hover:scale-100"
                >
                  {formState === "loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Sending…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" /> Send Message
                    </span>
                  )}
                </Button>

                <p className="text-center text-[11px] text-slate-400">
                  By submitting, you agree to our{" "}
                  <a href="#" className="font-semibold text-teal-600 hover:underline">Privacy Policy</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}