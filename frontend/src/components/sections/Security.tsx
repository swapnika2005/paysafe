import { Check, Shield } from "lucide-react";

export function Security() {
  const signals = [
    { label: "Transaction amount", status: "Normal", color: "emerald" },
    { label: "Time of day", status: "Normal", color: "emerald" },
    { label: "New recipient", status: "First time", color: "amber" },
    { label: "Device recognized", status: "Trusted", color: "emerald" },
    { label: "Location", status: "Unusual", color: "rose" },
    { label: "Amount vs history", status: "3x higher", color: "rose" },
    { label: "Hour of day", status: "2:00 AM", color: "rose" },
  ];
  const dotMap: Record<string, string> = { emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500" };
  const badgeMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <section className="relative bg-white py-28">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <Shield className="h-3 w-3" /> AI-powered security
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl">
            Fraud stopped <br />
            <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">before it happens.</span>
          </h2>
          <p className="mt-5 text-lg text-slate-600">Our ML model analyzes 7 signals on every transaction in under 200ms. Amount, time, location, device, history, recipient, and behavior.</p>
          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {signals.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotMap[s.color]}`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${dotMap[s.color]}`} />
                  </span>
                  <span className="truncate text-sm text-slate-700">{s.label}</span>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${badgeMap[s.color]}`}>{s.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 mx-auto h-full w-[90%] rounded-[2rem] bg-linear-to-br from-rose-300/30 via-pink-300/20 to-transparent blur-2xl" />
          <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white p-8 shadow-[0_30px_80px_-20px_rgba(244,63,94,0.25)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500 to-pink-600 text-3xl font-bold text-white shadow-xl shadow-rose-500/40">✕</div>
            <h3 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">Transfer blocked</h3>
            <p className="mt-1 text-center text-sm text-slate-500">₹25,000 to <span className="font-medium text-slate-700">Unknown recipient</span></p>
            <div className="mt-7 rounded-2xl bg-linear-to-br from-slate-50 to-rose-50/50 p-5 ring-1 ring-slate-100">
              <div className="flex items-end justify-between">
                <span className="text-xs font-medium text-slate-600">Risk score</span>
                <span className="text-2xl font-bold text-rose-600">87<span className="text-sm text-slate-400">/100</span></span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 shadow-inner" style={{ width: "87%" }} />
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400">
                <span>Safe</span><span>Caution</span><span>High risk</span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Unusual location", "Odd hour", "Large amount"].map((t) => (
                <span key={t} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">{t}</span>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <Check className="h-4 w-4" strokeWidth={3} /> Money never left your wallet
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
