import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Shield,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  SlidersHorizontal,
  X,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { walletApi } from "@/api/endpoints/wallet.api";
import useAuthStore from "@/store/auth.store";
import { formatIndianPhone } from "@/lib/formatters";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface RawTransaction {
  id: string;
  amount: string;
  note: string | null;
  status: "APPROVED" | "BLOCKED";
  risk_score: string | null;
  is_fraud: boolean;
  hour_of_day: number | null;
  created_at: string;
  sender: { id: string; full_name: string; phone: string };
  receiver: { id: string; full_name: string; phone: string };
}

interface NormalizedTxn {
  id: string;
  name: string;
  phone: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  status: "APPROVED" | "BLOCKED";
  risk_score: number;
  time: string;
  note: string;
  avatar: string;
  sender: { id: string; full_name: string; phone: string };
  receiver: { id: string; full_name: string; phone: string };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const STATUS_FILTERS = ["All", "Approved", "Blocked"] as const;
const TYPE_FILTERS = ["All", "Sent", "Received"] as const;
const PER_PAGE = 20;

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-teal-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-teal-600",
  "from-fuchsia-500 to-rose-600",
  "from-lime-500 to-green-600",
  "from-yellow-500 to-amber-600",
  "from-slate-500 to-gray-600",
];

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86_400_000);
  const time = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  if (days < 7)
    return `${date.toLocaleDateString("en-IN", { weekday: "short" })}, ${time}`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function normalize(
  raw: RawTransaction,
  currentUserId: string | null,
): NormalizedTxn {
  const isSender = raw.sender.id === currentUserId;
  const isSelf = raw.sender.id === raw.receiver.id;
  const type: "CREDIT" | "DEBIT" = !isSelf && isSender ? "DEBIT" : "CREDIT";
  const counterparty = type === "DEBIT" ? raw.receiver : raw.sender;
  return {
    id: raw.id,
    name: counterparty.full_name,
    phone: counterparty.phone,
    type,
    amount: parseFloat(raw.amount),
    status: raw.status,
    risk_score:
      raw.risk_score != null ? Math.round(parseFloat(raw.risk_score)) : 0,
    time: formatDate(raw.created_at),
    note: raw.note ?? "",
    avatar: avatarGradient(counterparty.full_name),
    sender: raw.sender,
    receiver: raw.receiver,
  };
}

/* ─────────────────────────────────────────────────────────────
   RISK BADGE
───────────────────────────────────────────────────────────── */
function RiskBadge({ score }: { score: number }) {
  if (score <= 30)
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
        {score}% Safe
      </span>
    );
  if (score <= 69)
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
        {score}% Medium
      </span>
    );
  return (
    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700">
      {score}% High Risk
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   TRANSACTION DRAWER
───────────────────────────────────────────────────────────── */
function TxnDrawer({
  txn,
  onClose,
}: {
  txn: NormalizedTxn | null;
  onClose: () => void;
}) {
  if (!txn) return null;

  const isCredit = txn.type === "CREDIT";
  const isBlocked = txn.status === "BLOCKED";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-bold text-slate-900">Transaction Detail</p>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div
            className={`mb-5 rounded-2xl p-5 text-center ${
              isBlocked
                ? "bg-rose-50 border border-rose-100"
                : "bg-emerald-50 border border-emerald-100"
            }`}
          >
            {isBlocked ? (
              <XCircle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
            ) : (
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
            )}
            <p
              className={`text-2xl font-black ${
                isBlocked
                  ? "text-rose-600"
                  : isCredit
                    ? "text-emerald-700"
                    : "text-slate-800"
              }`}
            >
              {isCredit ? "+" : "−"}₹{txn.amount.toLocaleString("en-IN")}
            </p>
            <span
              className={`mt-1 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase ${
                isBlocked
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {txn.status}
            </span>
          </div>

          {[
            { label: "Transaction ID", value: txn.id, mono: true },
            { label: "Type", value: txn.type, mono: false },
            { label: "Note", value: txn.note || "—", mono: false },
            { label: "Time", value: txn.time, mono: false },
            {
              label: txn.type === "CREDIT" ? "From" : "To",
              value: txn.name,
              mono: false,
            },
            { label: "Phone", value: formatIndianPhone(txn.phone), mono: true },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-center justify-between py-3 border-b border-slate-50"
            >
              <p className="text-[11px] font-medium text-slate-400">{label}</p>
              <p
                className={`text-sm font-semibold text-slate-800 ${mono ? "font-mono text-xs" : ""}`}
              >
                {value}
              </p>
            </div>
          ))}

          <div className="flex items-center justify-between py-3 border-b border-slate-50">
            <p className="text-[11px] font-medium text-slate-400">
              AI Risk Score
            </p>
            <RiskBadge score={txn.risk_score} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] text-slate-400">Risk Level</p>
              <p className="text-[11px] font-bold text-slate-700">
                {txn.risk_score}%
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  txn.risk_score <= 30
                    ? "bg-emerald-500"
                    : txn.risk_score <= 69
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${txn.risk_score}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-emerald-600 font-medium">
                Safe
              </span>
              <span className="text-[9px] text-amber-600 font-medium">
                Medium
              </span>
              <span className="text-[9px] text-rose-600 font-medium">
                High Risk
              </span>
            </div>
          </div>

          {isBlocked && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-rose-600" />
                <p className="text-xs font-bold text-rose-800">
                  Blocked by AI Fraud Detection
                </p>
              </div>
              <p className="text-[11px] text-rose-600 leading-relaxed">
                This transaction was automatically blocked because our AI
                detected suspicious activity patterns. No money was deducted
                from your wallet.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-xl border-slate-200 text-sm font-semibold"
            onClick={onClose}
          >
            Close
          </Button>
          {!isBlocked && (
            <Button className="flex-1 h-10 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 text-white text-sm font-bold shadow-md shadow-teal-600/20">
              <Download className="mr-1.5 h-4 w-4" /> Receipt
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export function HistoryPage() {
  /* ── Get current user from Zustand (replaces localStorage hack) ── */
  const storeUser = useAuthStore((s) => s.user);
  const currentUserId = storeUser?.id ?? null;

  /* ── Data state ── */
  const [transactions, setTransactions] = useState<NormalizedTxn[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: PER_PAGE,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    sent: 0,
    received: 0,
    blocked: 0,
    total: 0,
  });

  /* ── Filter / UI state ── */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("All");
  const [typeFilter, setTypeFilter] =
    useState<(typeof TYPE_FILTERS)[number]>("All");
  const [selectedTxn, setSelectedTxn] = useState<NormalizedTxn | null>(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  /* ── Close filter popover on outside click ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    }
    if (showFilters) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  /* ── Fetch history ── */
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PER_PAGE),
      };
      if (statusFilter !== "All") params.status = statusFilter.toUpperCase();
      if (typeFilter !== "All") params.type = typeFilter.toUpperCase();

      const res: any = await walletApi.getHistory(params);
      const raw: RawTransaction[] = res.data?.data?.transactions ?? [];
      setTransactions(raw.map((t) => normalize(t, currentUserId)));
      setPagination(
        res.data?.data?.pagination ?? {
          total: 0,
          page: 1,
          limit: PER_PAGE,
          pages: 1,
        },
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "Failed to load transactions.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, currentUserId]);

  /* ── Fetch stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const res: any = await walletApi.getStats();
      const d = res.data?.data ?? {};
      setStats({
        sent: parseFloat(d.total_sent ?? 0),
        received: parseFloat(d.total_received ?? 0),
        blocked: parseFloat(d.total_blocked ?? 0),
        total: d.total_transactions ?? 0,
      });
    } catch {
      /* stats are non-critical */
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ── Filter helpers ── */
  const applyStatusFilter = (f: (typeof STATUS_FILTERS)[number]) => {
    setStatusFilter(f);
    setPage(1);
  };
  const applyTypeFilter = (f: (typeof TYPE_FILTERS)[number]) => {
    setTypeFilter(f);
    setPage(1);
  };
  const clearFilters = () => {
    setStatusFilter("All");
    setTypeFilter("All");
    setPage(1);
  };

  /* ── Client-side search on current page ── */
  const filtered = transactions.filter((txn) => {
    const q = search.toLowerCase();
    return (
      txn.name.toLowerCase().includes(q) ||
      txn.note.toLowerCase().includes(q) ||
      txn.id.toLowerCase().includes(q) ||
      txn.phone.includes(search)
    );
  });

  const activeFilterCount = [
    statusFilter !== "All",
    typeFilter !== "All",
  ].filter(Boolean).length;

  /* ── CSV export ── */
  const handleExportCSV = () => {
    const rows = [
      [
        "Date",
        "ID",
        "Name",
        "Phone",
        "Type",
        "Amount",
        "Status",
        "Risk Score",
        "Note",
      ],
      ...filtered.map((t) => [
        t.time,
        t.id,
        t.name,
        t.phone,
        t.type,
        t.amount,
        t.status,
        t.risk_score,
        t.note,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Header right slot ── */
  const headerRight = (
    <div className="flex items-center gap-2">
      {/* AI badge */}
      <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 sm:flex">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[11px] font-semibold text-emerald-700">
          AI protection active
        </span>
      </div>

      {/* Export CSV — desktop */}
      <button
        onClick={handleExportCSV}
        disabled={loading || filtered.length === 0}
        className="hidden sm:flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download className="h-3.5 w-3.5" /> Export CSV
      </button>
    </div>
  );


  return (
    <AppLayout
      title="Transaction History"
      subtitle={loading ? "Loading…" : `${pagination.total} transactions total`}
      headerRight={headerRight}
    >
      <div className="p-5 md:p-8">
        <div className="mx-auto max-w-5xl">
          {/* ── Summary stats ── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
            {[
              {
                label: "Total Transactions",
                value: stats.total,
                color: "text-teal-600",
                bg: "bg-teal-50",
                border: "border-teal-100",
                icon: CreditCard,
              },
              {
                label: "Total Sent",
                value: `₹${stats.sent.toLocaleString("en-IN")}`,
                color: "text-rose-600",
                bg: "bg-rose-50",
                border: "border-rose-100",
                icon: TrendingDown,
              },
              {
                label: "Total Received",
                value: `₹${stats.received.toLocaleString("en-IN")}`,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                border: "border-emerald-100",
                icon: TrendingUp,
              },
              {
                label: "Blocked Amount",
                value: `₹${stats.blocked.toLocaleString("en-IN")}`,
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-100",
                icon: Shield,
              },
            ].map(({ label, value, color, bg, border, icon: Icon }) => (
              <div
                key={label}
                className={`rounded-2xl border ${border} ${bg} p-4`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm mb-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  {label}
                </p>
                <p className={`text-base font-black ${color} mt-0.5`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Table card ── */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            {/* Search + filters toolbar */}
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, note, ID or phone…"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters button + popover */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all ${
                      activeFilterCount > 0
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {showFilters && (
                    <div className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-slate-800">
                          Filters
                        </p>
                        {activeFilterCount > 0 && (
                          <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-700"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="mb-4">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                          Status
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {STATUS_FILTERS.map((f) => (
                            <button
                              key={f}
                              onClick={() => applyStatusFilter(f)}
                              className={`flex h-8 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all ${
                                statusFilter === f
                                  ? "bg-teal-600 text-white shadow-sm"
                                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200"
                              }`}
                            >
                              {statusFilter === f && (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                          Direction
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {TYPE_FILTERS.map((f) => (
                            <button
                              key={f}
                              onClick={() => applyTypeFilter(f)}
                              className={`flex h-8 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all ${
                                typeFilter === f
                                  ? "bg-teal-600 text-white shadow-sm"
                                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200"
                              }`}
                            >
                              {f === "Sent" && (
                                <ArrowUpRight className="h-3 w-3" />
                              )}
                              {f === "Received" && (
                                <ArrowDownLeft className="h-3 w-3" />
                              )}
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setShowFilters(false)}
                        className="mt-4 w-full h-9 rounded-xl bg-teal-600 text-xs font-bold text-white hover:bg-teal-700 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={fetchHistory}
                  disabled={loading}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                  />
                </button>

                {/* Mobile export */}
                <button
                  onClick={handleExportCSV}
                  disabled={loading || filtered.length === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40 sm:hidden"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Table header — desktop only */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5">
              {["Contact", "Amount", "Type", "Risk Score", "Time", ""].map(
                (h) => (
                  <p
                    key={h}
                    className="text-[10px] font-semibold uppercase tracking-widest text-slate-400"
                  >
                    {h}
                  </p>
                ),
              )}
            </div>

            {/* Rows */}
            <ul className="divide-y divide-slate-50">
              {loading ? (
                <li className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Loader2 className="h-7 w-7 mb-3 animate-spin text-teal-500" />
                  <p className="text-sm font-medium text-slate-500">
                    Loading transactions…
                  </p>
                </li>
              ) : error ? (
                <li className="flex flex-col items-center justify-center py-16 gap-3">
                  <AlertCircle className="h-8 w-8 text-rose-400" />
                  <p className="text-sm font-medium text-slate-600">{error}</p>
                  <button
                    onClick={fetchHistory}
                    className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </button>
                </li>
              ) : filtered.length === 0 ? (
                <li className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <CreditCard className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No transactions found</p>
                  <p className="text-[11px] mt-1">Try adjusting your filters</p>
                </li>
              ) : (
                filtered.map((txn) => {
                  const isCredit = txn.type === "CREDIT";
                  const isBlocked = txn.status === "BLOCKED";

                  return (
                    <li
                      key={txn.id}
                      onClick={() => setSelectedTxn(txn)}
                      className="group grid grid-cols-1 gap-2 px-5 py-3.5 transition-colors hover:bg-slate-50 cursor-pointer md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4"
                    >
                      {/* Contact */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${txn.avatar} text-[10px] font-bold text-white shadow-sm`}
                        >
                          {initials(txn.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {txn.name}
                            </p>
                            {isBlocked && (
                              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-rose-600">
                                Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {txn.id}
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            isBlocked
                              ? "text-rose-500 line-through"
                              : isCredit
                                ? "text-emerald-600"
                                : "text-slate-800"
                          }`}
                        >
                          {isCredit ? "+" : "−"}₹
                          {txn.amount.toLocaleString("en-IN")}
                        </p>
                        {txn.note && (
                          <p className="text-[10px] text-slate-400 truncate">
                            {txn.note}
                          </p>
                        )}
                      </div>

                      {/* Type */}
                      <div className="flex items-center gap-1.5">
                        {isCredit ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <ArrowUpRight
                            className={`h-3.5 w-3.5 ${isBlocked ? "text-rose-400" : "text-slate-400"}`}
                          />
                        )}
                        <span className="text-[11px] font-semibold text-slate-600">
                          {isCredit
                            ? "Received"
                            : isBlocked
                              ? "Blocked"
                              : "Sent"}
                        </span>
                      </div>

                      {/* Risk */}
                      <div>
                        <RiskBadge score={txn.risk_score} />
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3 shrink-0" />
                        {txn.time}
                      </div>

                      {/* Action */}
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:border-teal-300 hover:text-teal-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTxn(txn);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            {/* Pagination */}
            {!loading && !error && pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-[11px] text-slate-400">
                  Page {pagination.page} of {pagination.pages} ·{" "}
                  {pagination.total} total
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === pagination.pages ||
                        Math.abs(p - page) <= 1,
                    )
                    .reduce<(number | "…")[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1)
                        acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "…" ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="px-1 text-xs text-slate-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                            page === p
                              ? "bg-teal-600 text-white shadow-sm"
                              : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}

                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.pages, p + 1))
                    }
                    disabled={page === pagination.pages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction drawer */}
      {selectedTxn && (
        <TxnDrawer txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
      )}
    </AppLayout>
  );
}
