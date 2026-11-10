import { BarChart3, Lock, Shield, Sparkles, Star, Users, Wallet, Zap } from "lucide-react";

export function Features() {
  const features = [
    { icon: Shield, title: "AI fraud detection", desc: "Every transaction is scanned by our ML model in under 200ms. Suspicious activity blocked automatically.", tags: ["94% accuracy", "200ms response"], color: "blue", popular: false },
    { icon: Zap, title: "Quick transfers", desc: "Send money to another PaySafe user in a few simple steps.", tags: ["Easy to use", "Secure"], color: "amber", popular: true },
    { icon: Wallet, title: "Clear payments", desc: "See payment details and your available balance before you confirm.", tags: ["₹0 fees", "No hidden charges"], color: "emerald", popular: false },
    { icon: BarChart3, title: "Digital wallet", desc: "Top up your wallet instantly. Track every rupee with a complete audit trail and downloadable history.", tags: ["Full history", "Instant top-up"], color: "indigo", popular: false },
    { icon: Users, title: "Admin controls", desc: "Freeze accounts, override decisions, monitor fraud in real-time from a dedicated admin panel.", tags: ["Real-time monitor", "Account controls"], color: "rose", popular: false },
    { icon: Lock, title: "Bank-grade security", desc: "JWT auth, bcrypt encryption, PIN verification, and ACID transactions on PostgreSQL.", tags: ["ACID transactions", "bcrypt + JWT"], color: "violet", popular: false },
  ];
  const colorMap: Record<string, string> = {
    blue: "from-teal-500 to-teal-600 shadow-teal-500/30",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/30",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    indigo: "from-cyan-500 to-violet-600 shadow-cyan-500/30",
    rose: "from-rose-500 to-pink-600 shadow-rose-500/30",
    violet: "from-violet-500 to-purple-600 shadow-violet-500/30",
  };
  return (
    <section className="relative bg-white py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <Sparkles className="h-3 w-3" /> Why PaySafe
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl">
            Everything you need.<br /><span className="text-slate-400">Nothing you don't.</span>
          </h2>
          <p className="mt-5 text-lg text-slate-600">A modern payments experience, thoughtfully designed for everyday life in India.</p>
        </div>
        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/60">
              <div className="absolute inset-0 z-0 bg-linear-to-br from-slate-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              {f.popular && (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-md shadow-amber-500/30">
                  <Star className="h-2.5 w-2.5 fill-current" /> Popular
                </span>
              )}
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-lg ${colorMap[f.color]}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-6 text-lg font-semibold tracking-tight text-slate-900">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
              <div className="relative mt-5 flex flex-wrap gap-1.5">
                {f.tags.map((t) => <span key={t} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
