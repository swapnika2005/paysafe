import { ArrowRight, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  const steps = [
    { n: "01", t: "Create your account", d: "Register with your Indian mobile number and PAN. Verify with OTP and set your transaction PIN." },
    { n: "02", t: "Add money to wallet", d: "Add funds to your PaySafe wallet and keep your available balance close at hand." },
    { n: "03", t: "Send money safely", d: "Enter the recipient's phone, amount, and PIN. AI checks for fraud. Money arrives in seconds." },
  ];
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-slate-50 to-white py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <Globe className="h-3 w-3" /> How it works
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl">Send money in 3 steps</h2>
        </div>
        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div className="absolute left-1/2 top-12 hidden h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-teal-200 to-transparent md:block" />
          {steps.map((s, i) => (
            <div key={s.n} className="group relative rounded-2xl border border-slate-200 bg-white/80 p-8 backdrop-blur transition hover:border-teal-300 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-teal-600 to-cyan-700 text-sm font-bold text-white shadow-lg shadow-teal-600/30">{s.n}</div>
                {i < steps.length - 1 && <ChevronRight className="h-5 w-5 text-slate-300 md:hidden" />}
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Button size="lg" className="h-12 rounded-full bg-linear-to-r from-teal-600 to-cyan-600 px-7 text-base shadow-lg shadow-teal-600/30 hover:shadow-xl">
            Get started for free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
