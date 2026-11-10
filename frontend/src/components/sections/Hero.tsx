import { ArrowRight, Check, ChevronRight, Fingerprint, Shield, Sparkles,TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-slate-50 via-teal-50/40 to-white" />
        <div className="absolute -left-32 top-20 h-125 w-125 rounded-full bg-teal-300/30 blur-3xl" />
        <div className="absolute -right-32 top-40 h-125 w-125 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-75 w-75 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      </div>
      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:py-32">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200/60 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-teal-700 shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
            </span>
            AI-powered fraud protection
            <ChevronRight className="h-3 w-3" />
          </span>
          <h1 className="mt-7 text-[clamp(2.75rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.04em] text-slate-900">
            Send money{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-linear-to-r from-teal-600 via-cyan-600 to-teal-700 bg-clip-text text-transparent">safely.</span>
              <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                <path d="M0,5 Q50,0 100,5 T200,5" fill="none" stroke="url(#g)" strokeWidth="3" strokeLinecap="round"/>
                <defs><linearGradient id="g"><stop offset="0%" stopColor="#0d9488"/><stop offset="100%" stopColor="#0891b2"/></linearGradient></defs>
              </svg>
            </span>
            <br />Blocked before it hurts.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">PaySafe helps you move money with a clean, familiar payments experience and an extra layer of transaction protection.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
           <button className="group relative h-12 overflow-hidden rounded-full bg-linear-to-r from-teal-600 to-cyan-600 px-7 text-sm font-semibold text-white shadow-lg shadow-teal-600/30 transition-all duration-300 hover:shadow-xl hover:shadow-teal-600/40 hover:scale-[1.03] active:scale-[0.98]">
              {/* shimmer sweep */}
              <span className="absolute inset-0 -translate-x-full skew-x-[-20deg] bg-white/20 transition-transform duration-500 group-hover:translate-x-[150%]" />
              <a href="/sign-up" className="relative flex items-center gap-2">
                Get started — it's free
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </a>
            </button>

            {/* ── improved watch demo button ── */}
            <button className="group flex h-12 items-center gap-3 rounded-full border border-slate-200 bg-white py-2 pl-2 pr-6 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-px">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-600 to-cyan-600 shadow-md shadow-teal-600/30 transition-shadow duration-200 group-hover:shadow-lg group-hover:shadow-teal-600/40">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-25" />
                <svg className="relative h-3 w-3 translate-x-px text-white" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 1.5l7 4.5-7 4.5V1.5z" />
                </svg>
              </span>
              See how it works
            </button>

          </div>
             <div className="mt-10 flex flex-wrap items-center gap-6">
            {/* verified users pill */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
              {/* stacked avatars with real photos via ui-avatars */}
              <div className="flex -space-x-3">
                {[
                  { name: "Aisha K",  bg: "from-violet-500 to-purple-600" },
                  { name: "Saad M",   bg: "from-emerald-500 to-teal-600"  },
                  { name: "Bilal R",  bg: "from-orange-500 to-rose-500"   },
                  { name: "Fatima H", bg: "from-teal-500 to-cyan-600"   },
                  { name: "+",        bg: "from-slate-400 to-slate-500"   },
                ].map(({ name, bg }) => (
                  <div
                    key={name}
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br ${bg} text-[10px] font-bold text-white ring-2 ring-white shadow-sm`}
                  >
                    {name === "+" ? "49k" : name.split(" ").map(s => s[0]).join("")}
                  </div>
                ))}
              </div>
              <div className="border-l border-slate-100 pl-3">
                <p className="text-xs font-bold text-slate-900">50,000+ users</p>
                <p className="text-[11px] text-slate-500">across India</p>
              </div>
            </div>

            {/* rating pill */}
           

            {/* verified badge */}
           
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute -left-4 top-8 z-20 hidden rounded-2xl border border-emerald-200 bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur md:flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-4 w-4" strokeWidth={3} /></div>
            <div><p className="text-[11px] font-medium text-slate-500">Transfer complete</p><p className="text-xs font-semibold text-slate-900">₹5,500 sent</p></div>
          </div>
          <div className="absolute -right-2 bottom-12 z-20 hidden rounded-2xl border border-rose-200 bg-white/90 px-3.5 py-2.5 shadow-xl backdrop-blur md:flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600"><Shield className="h-4 w-4" /></div>
            <div><p className="text-[11px] font-medium text-slate-500">Fraud blocked</p><p className="text-xs font-semibold text-slate-900">Risk score 87</p></div>
          </div>
          <div className="absolute inset-0 z-0 mx-auto h-full w-[90%] rounded-4xl bg-linear-to-br from-teal-400/30 via-cyan-400/20 to-transparent blur-2xl" />
          <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_-20px_rgba(13,148,136,0.25)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-cyan-600 text-sm font-semibold text-white shadow-md">AH</div>
                <div><p className="text-sm font-semibold text-slate-900">Aarav Sharma</p><p className="text-xs text-slate-500">+91 98765 43210</p></div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"><Fingerprint className="h-3 w-3" /> Verified</span>
            </div>
            <div className="mt-6 rounded-2xl bg-linear-to-br from-slate-900 via-teal-900 to-cyan-900 p-5 text-white shadow-inner">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-teal-200">Wallet balance</p>
                <Sparkles className="h-3.5 w-3.5 text-teal-200" />
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight">₹45,200</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300"><TrendingUp className="h-3 w-3" /> +12.5% this month</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"><p className="text-[11px] text-slate-500">Sent today</p><p className="mt-0.5 text-sm font-bold text-slate-900">₹5,000</p></div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"><p className="text-[11px] text-slate-500">Received</p><p className="mt-0.5 text-sm font-bold text-emerald-600">+ ₹12,000</p></div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Recent activity</p>
                <a href="/sign-in" className="text-[11px] font-medium text-teal-600">View all</a>
              </div>
              <ul className="space-y-2.5">
                {[["Aarav Sharma","2:45 PM","-₹2,000","text-rose-600","from-teal-100 to-teal-200 text-teal-700"],["Mira Patel","1:12 PM","+₹5,500","text-emerald-600","from-emerald-100 to-emerald-200 text-emerald-700"],["Rohan Mehta","11:30 AM","-₹1,200","text-rose-600","from-amber-100 to-orange-200 text-amber-700"]].map(([n,time,a,c,av]) => (
                  <li key={n} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${av} text-[11px] font-semibold`}>{n.split(" ").map((s:string) => s[0]).join("")}</div>
                      <div><p className="text-sm font-medium text-slate-800">{n}</p><p className="text-[11px] text-slate-500">{time}</p></div>
                    </div>
                    <span className={`text-sm font-semibold ${c}`}>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button className="mt-5 w-full rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 py-5 shadow-md shadow-teal-600/25">
              Send money <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}