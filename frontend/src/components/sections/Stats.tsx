import { Shield, TrendingUp, Users, Zap } from "lucide-react";

export function Stats() {
  const items = [
    ["50,000+", "Active users", Users],
    ["₹2.4B+", "Transferred safely", TrendingUp],
    ["99.97%", "Uptime guarantee", Zap],
    ["0.3%", "Fraud rate", Shield],
  ] as const;
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-teal-500/30 blur-3xl" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />
      </div>
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-0 md:grid-cols-4">
        {items.map(([v, l, Icon]) => (
          <div key={l} className="bg-slate-950/60 p-8 backdrop-blur">
            <Icon className="h-5 w-5 text-teal-400" />
            <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{v}</p>
            <p className="mt-1 text-sm text-slate-400">{l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
