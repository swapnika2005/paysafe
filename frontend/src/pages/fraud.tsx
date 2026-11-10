import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  Search,
  Shield,
  SlidersHorizontal,
  X,
  XCircle,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatIndianPhone } from "@/lib/formatters";
import { AppLayout } from "@/components/AppLayout";
import {
  useConfirmFraud,
  useFraudReports,
  useOverrideFraud,
} from "@/hooks/useFraud";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED_FRAUD" },
  { label: "False Alarm", value: "FALSE_ALARM" },
] as const;

const AVATAR_GRADIENTS = [
  "from-amber-500 to-orange-600",
  "from-slate-500 to-gray-600",
  "from-fuchsia-500 to-rose-600",
  "from-red-500 to-rose-600",
  "from-teal-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
];

type UiReport = {
  id: string;
  txn_id: string;
  user: string;
  phone: string;
  amount: number;
  risk_score: number;
  status: string;
  signals: string[];
  ml_version: string;
  time: string;
  avatar: string;
  reviewed_by: string | null;
  admin_note: string | null;
};

function mapReport(raw: any): UiReport {
  const sender = raw.transaction?.sender;
  const name = sender?.full_name || "Unknown";
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const score = Number(raw.risk_score ?? raw.transaction?.risk_score ?? 0);

  return {
    id: raw.id,
    txn_id: raw.transaction_id || raw.transaction?.id || "—",
    user: name,
    phone: sender?.phone || "—",
    amount: Number(raw.transaction?.amount ?? 0),
    risk_score: Math.round(score > 1 ? score : score * 100),
    status: raw.review_status,
    signals: Array.isArray(raw.fraud_signals) ? raw.fraud_signals : [],
    ml_version: raw.ml_model_version || "v1.0.0",
    time: raw.created_at
      ? new Date(raw.created_at).toLocaleString()
      : "—",
    avatar: AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length],
    reviewed_by: raw.reviewer?.full_name || null,
    admin_note: raw.admin_note || null,
  };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PENDING") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
        <Clock className="h-3 w-3" /> Pending Review
      </span>
    );
  }
  if (status === "CONFIRMED_FRAUD") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-700">
        <XCircle className="h-3 w-3" /> Confirmed Fraud
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> False Alarm
    </span>
  );
}

function RiskBar({ score }: { score: number }) {
  const color =
    score <= 30 ? "bg-emerald-500" : score <= 69 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span
        className={`text-[11px] font-bold ${
          score <= 30
            ? "text-emerald-600"
            : score <= 69
              ? "text-amber-600"
              : "text-rose-600"
        }`}
      >
        {score}%
      </span>
    </div>
  );
}

function FraudDrawer({
  report,
  onClose,
  onAction,
  busy,
}: {
  report: UiReport | null;
  onClose: () => void;
  onAction: (id: string, action: "override" | "confirm", note: string) => void;
  busy: boolean;
}) {
  const [note, setNote] = useState("");
  if (!report) return null;

  const isPending = report.status === "PENDING";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Fraud Report</p>
            <p className="font-mono text-[11px] text-slate-400">{report.id.slice(0, 8)}…</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br ${report.avatar} text-sm font-bold text-white shadow-sm`}
              >
                {report.user
                  .split(" ")
                  .map((s) => s[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{report.user}</p>
                <p className="font-mono text-[11px] text-slate-500">{formatIndianPhone(report.phone)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-0.5 text-[10px] text-rose-400">Blocked Amount</p>
                <p className="text-2xl font-black text-rose-700">
                  ₹{report.amount.toLocaleString("en-IN")}
                </p>
              </div>
              <StatusBadge status={report.status} />
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700">AI Risk Score</p>
              <span
                className={`text-lg font-black ${
                  report.risk_score >= 70
                    ? "text-rose-600"
                    : report.risk_score >= 30
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              >
                {report.risk_score}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  report.risk_score >= 70
                    ? "bg-rose-500"
                    : report.risk_score >= 30
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${report.risk_score}%` }}
              />
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Fraud Signals
            </p>
            <div className="space-y-1.5">
              {(report.signals.length ? report.signals : ["No signals listed"]).map(
                (signal, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2"
                  >
                    <AlertTriangle className="h-3 w-3 shrink-0 text-rose-500" />
                    <p className="text-[11px] font-medium text-rose-700">{signal}</p>
                  </div>
                ),
              )}
            </div>
          </div>

          {[
            { label: "Transaction ID", value: report.txn_id, mono: true },
            { label: "Time", value: report.time, mono: false },
            { label: "ML Model", value: report.ml_version, mono: true },
            { label: "Reviewed By", value: report.reviewed_by || "—", mono: false },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-slate-50 py-2.5"
            >
              <p className="text-[11px] font-medium text-slate-400">{label}</p>
              <p
                className={`text-sm font-semibold text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
              >
                {String(value).slice(0, 36)}
              </p>
            </div>
          ))}

          {report.admin_note && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Admin Note
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600">{report.admin_note}</p>
            </div>
          )}

          {isPending && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Admin Note
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a review note (optional)…"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4">
          {isPending ? (
            <div className="space-y-2">
              <Button
                disabled={busy}
                onClick={() => onAction(report.id, "confirm", note)}
                className="h-10 w-full rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700"
              >
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                Confirm Fraud
              </Button>
              <Button
                disabled={busy}
                onClick={() => onAction(report.id, "override", note)}
                variant="outline"
                className="h-10 w-full rounded-xl border-emerald-300 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
              >
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                Mark False Alarm
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="h-9 w-full rounded-xl border-slate-200 text-sm text-slate-500"
              >
                Close
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 w-full rounded-xl border-slate-200 text-sm font-semibold text-slate-600"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FraudLogPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReport, setSelectedReport] = useState<UiReport | null>(null);

  const queryParams = {
    page,
    limit: 10,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch, isFetching } =
    useFraudReports(queryParams);
  const confirmMutation = useConfirmFraud();
  const overrideMutation = useOverrideFraud();
  const busy = confirmMutation.isPending || overrideMutation.isPending;

  const reports = useMemo(
    () => (data?.reports ?? []).map(mapReport),
    [data?.reports],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.user.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.txn_id.toLowerCase().includes(q) ||
        r.phone.includes(search),
    );
  }, [reports, search]);

  const pagination = data?.pagination ?? { total: 0, page: 1, pages: 1 };
  const pending = reports.filter((r) => r.status === "PENDING").length;
  const confirmed = reports.filter((r) => r.status === "CONFIRMED_FRAUD").length;
  const cleared = reports.filter((r) => r.status === "FALSE_ALARM").length;
  const avgRisk = reports.length
    ? Math.round(reports.reduce((s, r) => s + r.risk_score, 0) / reports.length)
    : 0;

  async function handleAction(
    id: string,
    action: "override" | "confirm",
    note: string,
  ) {
    try {
      if (action === "confirm") {
        await confirmMutation.mutateAsync({ id, admin_note: note || undefined });
        toast.success("Fraud confirmed");
      } else {
        await overrideMutation.mutateAsync({ id, admin_note: note || undefined });
        toast.success("Marked false alarm — transfer settled");
      }
      setSelectedReport(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  }

  return (
    <AppLayout
      title="Fraud Detection Log"
      subtitle="AI-powered fraud reports & admin review"
    >
      <div className="p-5 md:p-7">
        {pending > 0 && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 w-fit">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <p className="text-xs font-bold text-rose-700">{pending} pending on this page</p>
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Pending (page)", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            { label: "Confirmed (page)", value: confirmed, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
            { label: "False Alarms", value: cleared, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Avg Risk", value: `${avgRisk}%`, icon: Activity, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`rounded-2xl border ${border} ${bg} p-4`}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-[11px] font-medium text-slate-500">{label}</p>
              <p className={`mt-0.5 text-xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {pending > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                Pending fraud reports need review
              </p>
              <p className="text-[11px] text-amber-600">
                Confirm fraud or override as false alarm (settles the transfer).
              </p>
            </div>
            <button
              onClick={() => {
                setStatusFilter("PENDING");
                setPage(1);
              }}
              className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              Review now <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search this page by name, report ID or txn…"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold ${
                  showFilters
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
              </button>
            </div>

            {showFilters && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                <p className="mb-1 w-full text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Status
                </p>
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => {
                      setStatusFilter(f.value);
                      setPage(1);
                    }}
                    className={`h-7 rounded-lg px-3 text-[11px] font-semibold ${
                      statusFilter === f.value
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading reports…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
              <p className="text-sm font-medium">
                {(error as any)?.response?.data?.message || "Failed to load fraud reports"}
              </p>
              <Button variant="outline" onClick={() => refetch()} className="rounded-xl">
                Retry
              </Button>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <li className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Shield className="mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm font-medium">No fraud reports found</p>
                  </li>
                ) : (
                  filtered.map((report) => (
                    <li
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="group grid cursor-pointer grid-cols-1 gap-2 px-5 py-4 transition-colors hover:bg-slate-50 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${report.avatar} text-[10px] font-bold text-white`}
                        >
                          {report.user
                            .split(" ")
                            .map((s) => s[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {report.user}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">
                            {report.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-rose-600 line-through">
                          ₹{report.amount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-slate-400">{report.time}</p>
                      </div>
                      <RiskBar score={report.risk_score} />
                      <div className="flex flex-wrap gap-1">
                        {report.signals.slice(0, 2).map((s, i) => (
                          <span
                            key={i}
                            className="max-w-25 truncate rounded-md border border-rose-100 bg-rose-50 px-1.5 py-0.5 text-[9px] font-medium text-rose-600"
                          >
                            {s}
                          </span>
                        ))}
                        {report.signals.length > 2 && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                            +{report.signals.length - 2}
                          </span>
                        )}
                      </div>
                      <StatusBadge status={report.status} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:border-teal-300 hover:text-teal-600"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))
                )}
              </ul>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-[11px] text-slate-400">
                  {pagination.total} total
                  {isFetching ? " · refreshing…" : ""}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-slate-600">
                    {pagination.page} / {Math.max(1, pagination.pages)}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (pagination.pages || 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedReport && (
        <FraudDrawer
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onAction={handleAction}
          busy={busy}
        />
      )}
    </AppLayout>
  );
}
