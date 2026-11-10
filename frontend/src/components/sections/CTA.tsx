import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-teal-600 via-cyan-700 to-violet-700" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 25% 20%, white 1px, transparent 1px), radial-gradient(circle at 75% 80%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-teal-400/40 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-violet-400/40 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          <Sparkles className="h-3 w-3" /> Free forever plan
        </span>
        <h2 className="mt-5 text-4xl font-bold tracking-[-0.03em] text-white sm:text-6xl">Ready to send <br />money safely?</h2>
        <p className="mt-5 text-lg text-teal-100">Join 50,000+ users. Free to sign up. No hidden fees ever.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="h-12 rounded-full bg-white px-7 text-base text-teal-700 shadow-xl hover:bg-teal-50 hover:text-teal-800">
            Create free account <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 rounded-full border-white/30 bg-white/10 px-7 text-base text-white backdrop-blur hover:bg-white/20 hover:text-white">
            Sign in
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-teal-200">
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Setup in 2 minutes</span>
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}
