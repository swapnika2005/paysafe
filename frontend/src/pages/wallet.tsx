import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import useAuthStore from "@/store/auth.store";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  Clock,
  CheckCircle2,
  Bell,
  User,
  Settings,
  LayoutDashboard,
  AlertCircle,
  Loader2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIndianPhone } from "@/lib/formatters";
import {
  useWallet,
  useTopUp,
  useWalletLogs,
  useWalletStats,
  useExportLogs,
} from "@/hooks/useWallet";

const FILTERS = ["All", "Credit", "Debit", "Top Up"];

const FILTER_MAP: Record<string, string> = {
  All: "ALL",
  Credit: "CREDIT",
  Debit: "DEBIT",
  "Top Up": "TOPUP",
};

function LogIcon({ type }: { type: string }) {
  if (type === "CREDIT")
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
        <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
      </div>
    );
  if (type === "TOPUP")
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100">
        <Plus className="h-4 w-4 text-teal-600" />
      </div>
    );
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
      <ArrowUpRight className="h-4 w-4 text-slate-500" />
    </div>
  );
}

function LogoMark({ size = 32 }: { size?: number }) {
  return <img src="/paysafe-logo.png" alt="PaySafe" width={size * 1.6} height={size} className="object-contain" />;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function WalletPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpError, setTopUpError] = useState("");
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: wallet,
    isLoading: loadingWallet,
    refetch: refetchWallet,
  } = useWallet();

  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useWalletStats();

  const logsParams = {
    ...(FILTER_MAP[activeFilter] !== "ALL"
      ? { type: FILTER_MAP[activeFilter] }
      : {}),
    ...(search ? { search } : {}),
  };
  const {
    data: logsData,
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useWalletLogs(logsParams);

  const logs: any[] = Array.isArray(logsData)
    ? logsData
    : ((logsData as any)?.logs ?? []);

  const topUpMutation = useTopUp();

  const exportMutation = useExportLogs();

  const displayBalance: number = (wallet as any)?.balance ?? 0;

  const displayStats = [
    {
      label: "Total Sent",
      value: stats ? `₹${Number((stats as any).total_sent).toLocaleString("en-IN")}` : "—",
      icon: TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
    {
      label: "Total Received",
      value: stats
        ? `₹${Number((stats as any).total_received).toLocaleString("en-IN")}`
        : "—",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Transactions",
      value: stats ? String((stats as any).total_transactions) : "—",
      icon: CreditCard,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
    },
    {
      label: "Blocked",
      value: stats ? String((stats as any).total_blocked) : "—",
      icon: Shield,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchWallet(), refetchStats(), refetchLogs()]);
    setIsRefreshing(false);
  };

  const handleExport = () => {
    exportMutation.mutate(undefined, {
      onError: (e: any) => setGlobalError(e?.message ?? "Export failed"),
    });
  };

  const handleTopUp = () => {
    const amount = Number(topUpAmount);
    if (!amount || amount < 100) return;

    setTopUpError("");
    setTopUpSuccess(false);

    topUpMutation.mutate(amount, {
      onSuccess: () => {
        setTopUpSuccess(true);
        setTimeout(() => {
          setShowTopUp(false);
          setTopUpAmount("");
          setTopUpSuccess(false);
          topUpMutation.reset();
        }, 1500);
      },
      onError: (e: any) => {
        setTopUpError(
          e?.response?.data?.message ??
            e?.message ??
            "Top-up failed. Please try again.",
        );
      },
    });
  };

  const closeTopUp = () => {
    setShowTopUp(false);
    setTopUpAmount("");
    setTopUpError("");
    setTopUpSuccess(false);
    topUpMutation.reset();
  };

  const topUpLoading = topUpMutation.isPending;
  const exportLoading = exportMutation.isPending;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-100 shadow-sm">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex flex-col items-start leading-none">
            <LogoMark size={40} />
            <p className="text-[9px] font-medium tracking-wide text-slate-500">
              Pay Smart. Stay Safe
            </p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {[
            { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
            { label: "Send Money", to: "/sendMoney", icon: Send },
            { label: "Wallet", to: "/wallet", icon: Wallet, active: true },
            { label: "History", to: "/history", icon: CreditCard },
            { label: "Notifications", to: "/notification", icon: Bell },
            { label: "Profile", to: "/profile", icon: User },
            { label: "Settings", to: "/settings", icon: Settings },
          ].map(({ label, to, active }) => (
            <Link
              key={label}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                ${
                  active
                    ? "bg-linear-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <Wallet className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-cyan-600 text-xs font-bold text-white">
              {user?.full_name
                ?.split(" ")
                .map((s) => s[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.full_name ?? "User"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {formatIndianPhone(user?.phone)}
              </p>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate({ to: "/sign-in" });
              }}
              className="text-slate-400 hover:text-rose-500 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 shadow-sm">
          <div>
            <h1 className="text-base font-bold text-slate-900">My Wallet</h1>
            <p className="text-[11px] text-slate-400">
              Audit trail & balance overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {exportLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}{" "}
              Export
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          {globalError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <p className="text-sm text-rose-700 font-medium">{globalError}</p>
              <button
                onClick={() => setGlobalError("")}
                className="ml-auto text-rose-400 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-teal-900 to-cyan-900 p-6 text-white shadow-xl shadow-teal-900/30 mb-5">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-6 right-16 h-24 w-24 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-200">
                    Wallet Balance
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {loadingWallet ? (
                      <Skeleton className="h-10 w-48 bg-white/20" />
                    ) : (
                      <p className="text-4xl font-black tracking-tight">
                        {balanceVisible
                          ? `₹${displayBalance.toLocaleString("en-IN")}`
                          : "₹••••••"}
                      </p>
                    )}
                    <button
                      onClick={() => setBalanceVisible((v) => !v)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-teal-200 transition hover:bg-white/20"
                    >
                      {balanceVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[11px] text-teal-200">
                      Updated {(wallet as any)?.last_updated ?? "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-teal-200 hover:bg-white/20 transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Sent",
                    value: stats
                      ? `₹${Number((stats as any).total_sent).toLocaleString("en-IN")}`
                      : "—",
                    color: "text-rose-300",
                  },
                  {
                    label: "Received",
                    value: stats
                      ? `₹${Number((stats as any).total_received).toLocaleString("en-IN")}`
                      : "—",
                    color: "text-emerald-300",
                  },
                  {
                    label: "Blocked",
                    value: stats
                      ? `₹${Number((stats as any).total_blocked).toLocaleString("en-IN")}`
                      : "—",
                    color: "text-amber-300",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur"
                  >
                    <p className="text-[10px] text-teal-200">{label}</p>
                    {loadingWallet ? (
                      <Skeleton className="mt-1 h-4 w-20 bg-white/20" />
                    ) : (
                      <p className={`mt-0.5 text-sm font-bold ${color}`}>
                        {value}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <Link to="/sendMoney">
                  <Button className="h-9 rounded-xl bg-white text-teal-700 text-xs font-bold shadow hover:bg-teal-50">
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Send Money
                  </Button>
                </Link>
                <Button
                  onClick={() => setShowTopUp(true)}
                  variant="outline"
                  className="h-9 rounded-xl border-white/20 bg-white/10 text-white text-xs font-bold hover:bg-white/20"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Top Up
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-5">
            {displayStats.map(
              ({ label, value, icon: Icon, color, bg, border }) => (
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
                  {loadingStats ? (
                    <Skeleton className="mt-1 h-5 w-16" />
                  ) : (
                    <p className={`text-base font-black ${color} mt-0.5`}>
                      {value}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Wallet Audit Log
                </p>
                <p className="text-[11px] text-slate-400">
                  {loadingLogs ? "Loading…" : `${logs.length} entries`}
                </p>
              </div>
              <Link
                to="/history"
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700"
              >
                Full history <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, note or ID…"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`h-7 rounded-lg px-3 text-[11px] font-semibold transition-all
                      ${
                        activeFilter === f
                          ? "bg-teal-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* log list */}
            <ul className="divide-y divide-slate-50">
              {loadingLogs ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-3.5 w-20 ml-auto" />
                      <Skeleton className="h-3 w-28 ml-auto" />
                    </div>
                  </li>
                ))
              ) : logs.length === 0 ? (
                <li className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Wallet className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">
                    {activeFilter === "All"
                      ? "No transactions yet"
                      : `No ${activeFilter} transactions found`}
                  </p>
                </li>
              ) : (
                logs.map((log: any) => (
                  <li
                    key={log.id}
                    className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <LogIcon type={log.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {log.type === "TOPUP"
                            ? "Wallet Top Up"
                            : log.type === "CREDIT"
                              ? "Money Received"
                              : "Money Sent"}
                        </p>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase
      ${
        log.type === "CREDIT"
          ? "bg-emerald-100 text-emerald-700"
          : log.type === "TOPUP"
            ? "bg-teal-100 text-teal-700"
            : "bg-slate-100 text-slate-600"
      }`}
                        >
                          {log.type === "TOPUP" ? "Top Up" : log.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {log.transaction_id ?? "—"}
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          log.type === "CREDIT" || log.type === "TOPUP"
                            ? "text-emerald-600"
                            : "text-slate-800"
                        }`}
                      >
                        {log.type === "CREDIT" || log.type === "TOPUP"
                          ? "+"
                          : "-"}
                        ₹{Number(log.amount).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Balance: ₹
                        {Number(log.balance_after).toLocaleString("en-IN")}
                      </p>
                    </div>
                    {log.type === "CREDIT" || log.type === "TOPUP" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-300" />
                    )}
                  </li>
                ))
              )}
            </ul>

            {/* footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-[11px] text-slate-400">
                Showing {logs.length} of{" "}
                {(logsData as any)?.pagination?.total ?? logs.length} entries
              </p>
            </div>
          </div>
        </main>
      </div>

      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            {/* modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Top Up Wallet
                </p>
                <p className="text-[11px] text-slate-400">
                  Add funds to your PaySafe wallet
                </p>
              </div>
              <button
                onClick={closeTopUp}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {/* current balance */}
              <div className="mb-4 rounded-xl bg-slate-50 p-4 text-center">
                <p className="text-[11px] text-slate-400 mb-1">
                  Current Balance
                </p>
                {loadingWallet ? (
                  <Skeleton className="mx-auto h-8 w-36" />
                ) : (
                  <p className="text-2xl font-black text-slate-900">
                    ₹{displayBalance.toLocaleString("en-IN")}
                  </p>
                )}
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Quick Amount
              </p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1000, 2000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopUpAmount(String(amt))}
                    disabled={topUpLoading}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all disabled:opacity-50
                      ${
                        topUpAmount === String(amt)
                          ? "border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/20"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-300"
                      }`}
                  >
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Or enter amount
              </p>
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => {
                    setTopUpAmount(e.target.value);
                    setTopUpError("");
                  }}
                  placeholder="0"
                  min="100"
                  max="296000"
                  disabled={topUpLoading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50"
                />
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2.5">
                <Shield className="h-4 w-4 shrink-0 text-teal-600" />
                <p className="text-[11px] text-teal-700 font-medium">
                  Max top-up: ₹296,000 per transaction
                </p>
              </div>

              {topUpError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <p className="text-[11px] text-rose-700 font-medium">
                    {topUpError}
                  </p>
                </div>
              )}

              {topUpSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Top-up successful!
                  </p>
                </div>
              )}

              {topUpAmount && Number(topUpAmount) > 0 && !topUpSuccess && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                  <p className="text-[11px] text-emerald-600 mb-0.5">
                    New Balance After Top Up
                  </p>
                  <p className="text-xl font-black text-emerald-700">
                    ₹
                    {(displayBalance + Number(topUpAmount)).toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={closeTopUp}
                  disabled={topUpLoading}
                  className="flex-1 h-11 rounded-xl border-slate-200 text-slate-600 text-sm font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTopUp}
                  disabled={
                    !topUpAmount ||
                    Number(topUpAmount) < 100 ||
                    topUpLoading ||
                    topUpSuccess
                  }
                  className="flex-1 h-11 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 text-white text-sm font-bold shadow-md shadow-teal-600/20 disabled:opacity-40"
                >
                  {topUpLoading ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 h-4 w-4" />
                  )}
                  Add ₹
                  {topUpAmount ? Number(topUpAmount).toLocaleString("en-IN") : "0"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
