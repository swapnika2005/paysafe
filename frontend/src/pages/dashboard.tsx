import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Send,
  Settings,
  Shield,
  User,
  Wallet,
  X,
  Menu,
  Search,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import useAuthStore from "@/store/auth.store";
import { walletApi } from "@/api/endpoints/wallet.api";
import { notificationsApi } from "@/api/endpoints/notifications.api";
import { formatIndianPhone } from "@/lib/formatters";

interface RawTransaction {
  id: string;
  amount: string | number;
  note?: string | null;
  status: "APPROVED" | "BLOCKED" | "PENDING";
  created_at: string;
  sender: { id: string; full_name: string; phone: string };
  receiver: { id: string; full_name: string; phone: string };
}

interface Transaction {
  id: string;
  name: string;
  phone: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  status: "APPROVED" | "BLOCKED" | "PENDING";
  created_at: string;
  avatar: string;
}

interface RecentContact {
  name?: string;
  full_name?: string;
  phone?: string;
  avatar?: string;
}


const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Send, label: "Send Money", to: "/sendMoney" },
  { icon: Wallet, label: "Wallet", to: "/wallet" },
  { icon: CreditCard, label: "History", to: "/history" },
  { icon: Bell, label: "Notifications", to: "/notification" },
  { icon: User, label: "Profile", to: "/profile" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

const AVATAR_GRADIENTS = [
  "from-teal-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
];


function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}


function normalizeTransaction(
  raw: RawTransaction,
  currentUserId: string | null,
): Transaction {
  const isSender = raw.sender.id === currentUserId;
  const isSelf = raw.sender.id === raw.receiver.id;
  const type: "CREDIT" | "DEBIT" = !isSelf && isSender ? "DEBIT" : "CREDIT";
  const counterparty = type === "DEBIT" ? raw.receiver : raw.sender;
  return {
    id: raw.id,
    name: counterparty.full_name,
    phone: counterparty.phone,
    type,
    amount: parseFloat(String(raw.amount)),
    status: raw.status ?? "APPROVED",
    created_at: raw.created_at,
    avatar: avatarGradient(counterparty.full_name),
  };
}


function LogoMark({ size = 32 }: { size?: number }) {
  return <img src="/paysafe-logo.png" alt="PaySafe" width={size * 1.6} height={size} className="object-contain" />;
}


export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const initials = getInitials(user?.full_name);
  const phone = user?.phone ?? "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  /* ── Wallet balance ── */
  const {
    data: wallet,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = useWallet();
  const balance: number = (wallet as any)?.balance ?? 0;

  /* ── Recent transactions ── */
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  /* ── Wallet stats ── */
  const [sent, setSent] = useState(0);
  const [received, setReceived] = useState(0);
  const [blocked, setBlocked] = useState(0);

  /* ── Recent contacts ── */
  const [contacts, setContacts] = useState<RecentContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  /* ── Notifications ── */
  const [unreadCount, setUnreadCount] = useState(0);

  /* ── Security score (from stats or default) ── */
  const [securityScore, setSecurityScore] = useState(85);

  /* ── Fraud alert (most recent blocked tx) ── */
  const blockedTx = transactions.find((tx) => tx.status === "BLOCKED");

  /* ── Fetch transactions ── */
  const fetchTransactions = () => {
    setTxLoading(true);
    walletApi
      .getHistory({ limit: 5 })
      .then((res: any) => {
        const raw: RawTransaction[] =
          res.data?.data?.transactions ?? res.data?.data ?? [];
        setTransactions(
          raw.map((t) => normalizeTransaction(t, user?.id ?? null)),
        );
      })
      .catch(() => {})
      .finally(() => setTxLoading(false));
  };

  /* ── Fetch stats ── */
  const fetchStats = () => {
    walletApi
      .getStats()
      .then((res: any) => {
        const data = res.data?.data ?? res.data ?? {};
        setSent(data.monthly_spent ?? data.total_sent ?? 0);
        setReceived(data.monthly_income ?? data.total_received ?? 0);
        setBlocked(data.blocked_transactions ?? data.total_blocked ?? 0);
        if (data.security_score) setSecurityScore(data.security_score);
      })
      .catch(() => {});
  };

  /* ── Fetch contacts ── */
  const fetchContacts = () => {
    setContactsLoading(true);
    walletApi
      .getRecentContacts()
      .then((res: any) => {
        const list = res.data?.data ?? [];
        setContacts(
          list.map((u: any, i: number) => ({
            name: u.full_name ?? u.name ?? "User",
            phone: u.phone ?? u.phone_number ?? "",
            avatar: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
          })),
        );
      })
      .catch(() => {})
      .finally(() => setContactsLoading(false));
  };

  
  const fetchNotifications = () => {
    notificationsApi
      .getAll({})
      .then((res: any) => {
        setUnreadCount(res.data?.data?.unread_count ?? 0);
      })
      .catch(() => {});
  };

  
  useEffect(() => {
    fetchTransactions();
    fetchStats();
    fetchContacts();
    fetchNotifications();
  }, []);

  /* ── Refresh all ── */
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchWallet(),
      new Promise<void>((r) => {
        fetchTransactions();
        fetchStats();
        fetchContacts();
        fetchNotifications();
        r();
      }),
    ]);
    setTimeout(() => setRefreshing(false), 700);
  };

  /* ── Greeting ── */
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* ── Filtered transactions by search ── */
  const filtered = transactions.filter(
    (tx) =>
      !search ||
      tx.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.phone.includes(search),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fb] font-sans">
      {/* ════ SIDEBAR ════ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`
        fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200/70 bg-white shadow-sm
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}
      >
        {/* Logo */}
        <div className="flex h-[72px] items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex flex-col items-start leading-none">
            <LogoMark size={40} />
            <p className="text-[9px] font-medium tracking-wide text-slate-500">
              Pay Smart. Stay Safe
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-slate-400 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {NAV.map(({ icon: Icon, label, to }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={label}
                to={to}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
                  ${
                    active
                      ? "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${active ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                {label}
                {label === "Notifications" && unreadCount > 0 && (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-cyan-600 text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.full_name ?? "User"}
              </p>
              <p className="truncate text-[11px] text-slate-500">{formatIndianPhone(phone)}</p>
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

      {/* ════ MAIN ════ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/90 px-5 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions…"
                className="h-10 w-64 rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-teal-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/notification"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-teal-500" : ""}`}
              />
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1440px]">
          {/* Greeting */}
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
                {greet}, {firstName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Here's what's happening with your wallet today.
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
                user?.is_verified
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  user?.is_verified ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {user?.is_verified ? "Phone verified" : "Verification required"}
            </div>
          </div>

          {/* ── Top row ── */}
          <div className="grid gap-5 xl:grid-cols-3">
            {/* Wallet balance card */}
            <div className="relative col-span-1 overflow-hidden rounded-[28px] bg-linear-to-br from-[#10233f] via-[#123c70] to-[#2556a5] p-6 text-white shadow-xl shadow-teal-950/15 sm:p-8 xl:col-span-2">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 right-16 h-24 w-24 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/80">
                      Total Balance
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      {walletLoading ? (
                        <span className="inline-block h-10 w-44 animate-pulse rounded-xl bg-white/10 align-middle" />
                      ) : (
                        <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                          {balanceVisible
                            ? `₹${balance.toLocaleString("en-IN")}`
                            : "₹••••••"}
                        </p>
                      )}
                      <button
                        onClick={() => setBalanceVisible((v) => !v)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-teal-100 transition hover:bg-white/20"
                      >
                        {balanceVisible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {!walletLoading && (
                      <p className="mt-2 text-xs text-teal-100/65">
                        Indian rupees · INR
                      </p>
                    )}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                    <Wallet className="h-5 w-5 text-teal-100" />
                  </div>
                </div>

                {/* Mini stats */}
                <div className="mt-7 grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Sent",
                      value: sent > 0 ? `₹${sent.toLocaleString("en-IN")}` : "—",
                      color: "text-rose-300",
                    },
                    {
                      label: "Received",
                      value:
                        received > 0 ? `₹${received.toLocaleString("en-IN")}` : "—",
                      color: "text-emerald-300",
                    },
                    {
                      label: "Blocked",
                      value: `${blocked} txn${blocked !== 1 ? "s" : ""}`,
                      color: "text-amber-300",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3 backdrop-blur"
                    >
                      <p className="text-[10px] text-teal-200">{label}</p>
                      <p className={`mt-0.5 text-sm font-bold ${color}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link to="/sendMoney">
                    <Button className="h-9 rounded-xl bg-white text-teal-700 text-xs font-bold shadow hover:bg-teal-50 transition-colors">
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Send
                    </Button>
                  </Link>
                  <Link to="/wallet">
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl border-white/20 bg-white/10 text-white text-xs font-bold backdrop-blur hover:bg-white/20"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Top Up
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick send */}
            <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">Quick Send</p>
                <Link
                  to="/sendMoney"
                  className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                >
                  + New
                </Link>
              </div>

              {contactsLoading ? (
                <div className="flex gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div className="h-11 w-11 rounded-full animate-pulse bg-slate-200" />
                      <div className="h-2.5 w-10 rounded animate-pulse bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : contacts.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {contacts.slice(0, 4).map((c, i) => {
                    const name = c.name ?? "User";
                    return (
                      <Link
                        key={i}
                        to="/sendMoney"
                        className="flex flex-col items-center gap-1.5 group shrink-0"
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br ${c.avatar ?? AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} text-xs font-bold text-white shadow-sm ring-2 ring-white transition group-hover:ring-teal-300`}
                        >
                          {getInitials(name)}
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-800 transition truncate max-w-11 text-center">
                          {name.split(" ")[0]}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-3">
                  No recent contacts
                </p>
              )}

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Pay by mobile
                </p>
                <div className="flex gap-2">
                  <div className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-teal-500/20">
                    <span className="mr-2 border-r border-slate-200 pr-2 text-xs font-semibold text-slate-500">+91</span>
                    <input
                      placeholder="98765 43210"
                      className="h-9 min-w-0 flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <Link to="/sendMoney">
                    <Button className="h-9 w-9 shrink-0 rounded-xl bg-linear-to-r from-teal-600 to-cyan-600 p-0 shadow-md shadow-teal-600/20">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                <Shield className="h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-[11px] leading-snug text-emerald-700 font-medium">
                  AI fraud check runs on every transfer
                </p>
              </div>
            </div>
          </div>

          {/* ── Bottom row ── */}
          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            {/* Recent transactions */}
            <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">
                  Recent Transactions
                </p>
                <Link
                  to="/history"
                  className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {txLoading ? (
                <div className="space-y-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    >
                      <div className="h-10 w-10 rounded-full animate-pulse bg-slate-200 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                        <div className="h-2.5 w-44 animate-pulse rounded bg-slate-200" />
                      </div>
                      <div className="space-y-1.5 text-right">
                        <div className="h-3 w-20 animate-pulse rounded bg-slate-200 ml-auto" />
                        <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <CreditCard className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-semibold">
                    {search
                      ? `No transactions matching "${search}"`
                      : "No transactions yet"}
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((tx) => {
                    const isCredit = tx.type === "CREDIT";
                    const isBlocked = tx.status === "BLOCKED";
                    const timeStr = formatTime(tx.created_at);
                    return (
                      <li
                        key={tx.id}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${tx.avatar} text-[11px] font-bold text-white shadow-sm`}
                        >
                          {getInitials(tx.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {tx.name}
                            </p>
                            {isBlocked && (
                              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-600 shrink-0">
                                Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {formatIndianPhone(tx.phone)}
                            {timeStr ? ` · ${timeStr}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-sm font-bold ${
                              isCredit
                                ? "text-emerald-600"
                                : isBlocked
                                  ? "text-rose-500 line-through"
                                  : "text-slate-800"
                            }`}
                          >
                            {isCredit ? "+" : "-"}₹
                            {tx.amount.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {isCredit ? (
                              <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <ArrowUpRight
                                className={`h-3 w-3 ${isBlocked ? "text-rose-400" : "text-slate-400"}`}
                              />
                            )}
                            <span className="text-[10px] text-slate-400">
                              {isCredit
                                ? "Received"
                                : isBlocked
                                  ? "Blocked"
                                  : "Sent"}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">
              {/* Fraud alert card — only shown if there's a blocked tx */}
              {blockedTx ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100">
                      <Shield className="h-4 w-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-800">
                        Fraud Alert
                      </p>
                      <p className="text-[11px] text-rose-500">
                        {blocked} transaction{blocked !== 1 ? "s" : ""} blocked
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-800 truncate max-w-30">
                          {blockedTx.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          ₹{blockedTx.amount.toLocaleString("en-IN")}
                          {blockedTx.created_at
                            ? ` · ${formatTime(blockedTx.created_at)}`
                            : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0">
                        Blocked
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">
                      Flagged by AI fraud detection.
                    </p>
                  </div>
                  <Link
                    to="/history"
                    className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    Review report <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                      <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-800">
                        All Clear
                      </p>
                      <p className="text-[11px] text-emerald-600">
                        No suspicious activity detected
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security score */}
              <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
                <p className="text-sm font-bold text-slate-800 mb-3">
                  Account Security
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 shrink-0">
                    <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="url(#sg)"
                        strokeWidth="3"
                        strokeDasharray={`${securityScore} 100`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient
                          id="sg"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#0d9488" />
                          <stop offset="100%" stopColor="#0891b2" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-teal-600">
                      {securityScore}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-700">
                      {securityScore >= 90
                        ? "Excellent"
                        : securityScore >= 70
                          ? "Good standing"
                          : "Needs attention"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Enable 2FA to reach 100
                    </p>
                    <Link
                      to="/settings"
                      className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      <Lock className="h-3 w-3" /> Enable 2FA
                    </Link>
                  </div>
                </div>
                {[
                  { label: "Phone verified", done: !!user?.phone },
                  { label: "PIN set", done: true },
                  { label: "2FA enabled", done: user?.two_factor_enabled ?? true },
                ].map(({ label, done }) => (
                  <div key={label} className="mt-2 flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center ${done ? "bg-emerald-100" : "bg-slate-100"}`}
                    >
                      {done ? (
                        <svg
                          className="h-2.5 w-2.5 text-emerald-600"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      )}
                    </div>
                    <p
                      className={`text-[11px] ${done ? "text-slate-600" : "text-slate-400"}`}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
                <p className="text-sm font-bold text-slate-800 mb-3">
                  Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      icon: User,
                      label: "Profile",
                      to: "/profile",
                      color: "bg-teal-50 text-teal-600",
                    },
                    {
                      icon: CreditCard,
                      label: "Wallet",
                      to: "/wallet",
                      color: "bg-cyan-50 text-cyan-600",
                    },
                    {
                      icon: Bell,
                      label: "Alerts",
                      to: "/notification",
                      color: "bg-amber-50 text-amber-600",
                    },
                    {
                      icon: Settings,
                      label: "Settings",
                      to: "/settings",
                      color: "bg-slate-100 text-slate-600",
                    },
                  ].map(({ icon: Icon, label, to, color }) => (
                    <Link
                      key={label}
                      to={to}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 py-3 text-[11px] font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50/50"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
