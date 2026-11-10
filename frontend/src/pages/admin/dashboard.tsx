import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Search,
  Shield,
  Snowflake,
  Sun,
  Users,
  Activity,
  Ban,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { formatIndianPhone } from "@/lib/formatters";
import {
  useAdminStats,
  useAdminUsers,
  useFreezeUser,
  useUnfreezeUser,
} from "@/hooks/useAdmin";

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const {
    data: usersData,
    isLoading: usersLoading,
    refetch,
  } = useAdminUsers({ page, limit: 15, search: query || undefined });
  const freezeMutation = useFreezeUser();
  const unfreezeMutation = useUnfreezeUser();

  async function toggleFreeze(user: any) {
    try {
      if (user.is_frozen) {
        await unfreezeMutation.mutateAsync(user.id);
        toast.success(`${user.full_name} unfrozen`);
      } else {
        const reason = window.prompt("Freeze reason (optional):") ?? undefined;
        await freezeMutation.mutateAsync({ id: user.id, reason });
        toast.success(`${user.full_name} frozen`);
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  }

  const users = usersData?.users ?? [];
  const pagination = usersData?.pagination ?? { total: 0, page: 1, pages: 1 };

  return (
    <AppLayout title="Admin Dashboard" subtitle="Users, volume & fraud overview">
      <div className="space-y-6 p-5 md:p-7">
        <div className="flex flex-wrap gap-2">
          <Link
            to="/fraud"
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            <Shield className="h-3.5 w-3.5" /> Fraud log
            {stats?.fraud?.pending_reviews > 0 && (
              <span className="rounded-full bg-rose-600 px-1.5 text-[10px] text-white">
                {stats.fraud.pending_reviews}
              </span>
            )}
          </Link>
        </div>

        {statsLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading stats…
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                label: "Active users",
                value: stats?.users?.active ?? 0,
                icon: Users,
                color: "text-teal-600",
                bg: "bg-teal-50",
              },
              {
                label: "Frozen",
                value: stats?.users?.frozen ?? 0,
                icon: Snowflake,
                color: "text-cyan-600",
                bg: "bg-cyan-50",
              },
              {
                label: "Blocked txns",
                value: stats?.transactions?.blocked ?? 0,
                icon: Ban,
                color: "text-rose-600",
                bg: "bg-rose-50",
              },
              {
                label: "Pending fraud",
                value: stats?.fraud?.pending_reviews ?? 0,
                icon: AlertTriangle,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Today volume",
                value: `₹${Number(stats?.volume?.today_inr ?? 0).toLocaleString("en-IN")}`,
                icon: Activity,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Fraud rate",
                value: stats?.transactions?.fraud_rate ?? "0%",
                icon: Shield,
                color: "text-cyan-600",
                bg: "bg-cyan-50",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-2xl border border-slate-100 ${bg} p-4`}>
                <Icon className={`mb-2 h-4 w-4 ${color}`} />
                <p className="text-[11px] font-medium text-slate-500">{label}</p>
                <p className={`mt-0.5 text-lg font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setQuery(search.trim());
                    setPage(1);
                  }
                }}
                placeholder="Search users by name, email, phone…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <Button
              onClick={() => {
                setQuery(search.trim());
                setPage(1);
              }}
              className="h-9 rounded-xl bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Search
            </Button>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading users…
            </div>
          ) : (
            <>
              <ul className="divide-y divide-slate-50">
                {users.length === 0 ? (
                  <li className="py-12 text-center text-sm text-slate-400">No users found</li>
                ) : (
                  users.map((user: any) => (
                    <li
                      key={user.id}
                      className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {user.full_name}
                          {user.role === "admin" && (
                            <span className="ml-2 rounded-md bg-cyan-50 px-1.5 py-0.5 text-[10px] font-bold text-cyan-600">
                              ADMIN
                            </span>
                          )}
                          {user.is_frozen && (
                            <span className="ml-2 rounded-md bg-cyan-50 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700">
                              FROZEN
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {user.email} · {formatIndianPhone(user.phone) || "no phone"} · bal{" "}
                          ₹{Number(user.wallet?.balance ?? 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        disabled={
                          freezeMutation.isPending || unfreezeMutation.isPending
                        }
                        onClick={() => toggleFreeze(user)}
                        className={`h-9 rounded-xl text-xs font-bold ${
                          user.is_frozen
                            ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            : "border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                        }`}
                      >
                        {user.is_frozen ? (
                          <>
                            <Sun className="mr-1.5 h-3.5 w-3.5" /> Unfreeze
                          </>
                        ) : (
                          <>
                            <Snowflake className="mr-1.5 h-3.5 w-3.5" /> Freeze
                          </>
                        )}
                      </Button>
                    </li>
                  ))
                )}
              </ul>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <p className="text-[11px] text-slate-400">{pagination.total} users</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-8 rounded-lg text-xs"
                  >
                    Prev
                  </Button>
                  <span className="flex items-center text-xs text-slate-500">
                    {pagination.page}/{Math.max(1, pagination.pages)}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= (pagination.pages || 1)}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 rounded-lg text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
