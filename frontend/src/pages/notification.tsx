import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CheckSquare,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ArrowUpRight,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Inbox,
} from "lucide-react";
import api from "@/api/axios";
import { AppLayout } from "@/components/AppLayout";

/* ── Types ── */
type NotifType = "SUCCESS" | "WARNING" | "FRAUD_ALERT" | "INFO";
type FilterTab = "All" | "Unread" | "Success" | "Alerts" | "Info";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotifType;
  is_read: boolean;
  created_at: string;
  transaction_id: string | null;
}

/* ── Constants ── */
const FILTER_TABS: FilterTab[] = ["All", "Unread", "Success", "Alerts", "Info"];

/* ── Helpers ── */
function formatTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── Notif Icon ── */
function NotifIcon({ type }: { type: NotifType }) {
  const configs = {
    SUCCESS: {
      icon: CheckCircle2,
      bg: "bg-emerald-100",
      color: "text-emerald-600",
    },
    FRAUD_ALERT: { icon: XCircle, bg: "bg-rose-100", color: "text-rose-600" },
    WARNING: {
      icon: AlertTriangle,
      bg: "bg-amber-100",
      color: "text-amber-600",
    },
    INFO: { icon: Info, bg: "bg-teal-100", color: "text-teal-600" },
  };
  const { icon: Icon, bg, color } = configs[type];
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg}`}
    >
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
  );
}

function typeBorderColor(type: NotifType): string {
  return {
    SUCCESS: "border-l-emerald-400",
    FRAUD_ALERT: "border-l-rose-400",
    WARNING: "border-l-amber-400",
    INFO: "border-l-teal-400",
  }[type];
}

/* ── Confirm delete modal ── */
function ConfirmDeleteModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 mb-4">
          <Trash2 className="h-5.5 w-5.5 text-rose-600" />
        </div>
        <p className="text-base font-bold text-slate-900">
          Delete {count} notification{count > 1 ? "s" : ""}?
        </p>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          This can't be undone. The selected notification{count > 1 ? "s" : ""}{" "}
          will be permanently removed.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-rose-600 text-sm font-bold text-white shadow-md shadow-rose-600/25 hover:bg-rose-700 hover:shadow-rose-600/35 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   NOTIFICATIONS PAGE
══════════════════════════════════════════ */
export function NotificationsPage() {
  /* ── Data state ── */
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── UI state ── */
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSingle, setConfirmSingle] = useState<string | null>(null);

  /* ── Fetch ── */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get("/notifications");
      const data = res.data?.data ?? {};
      setNotifs(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          e?.message ??
          "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* ── Mark one read ── */
  const markRead = useCallback(async (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch {
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  /* ── Mark all read ── */
  const markAllRead = useCallback(async () => {
    const prevNotifs = notifs;
    const prevUnread = unreadCount;
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await api.post("/notifications/read-all");
    } catch {
      setNotifs(prevNotifs);
      setUnreadCount(prevUnread);
    }
  }, [notifs, unreadCount]);

  /* ── Delete one (after confirmation) ── */
  const confirmDeleteOne = useCallback(async () => {
    const id = confirmSingle;
    if (!id) return;
    const removed = notifs.find((n) => n.id === id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    if (removed && !removed.is_read)
      setUnreadCount((prev) => Math.max(0, prev - 1));
    setConfirmSingle(null);
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      // Silently ignore — backend delete endpoint may not exist yet
    }
  }, [notifs, confirmSingle]);

  /* ── Delete selected (after confirmation) ── */
  const deleteSelected = useCallback(async () => {
    const removedItems = notifs.filter((n) => selected.includes(n.id));
    const removedUnread = removedItems.filter((n) => !n.is_read).length;
    setNotifs((prev) => prev.filter((n) => !selected.includes(n.id)));
    setUnreadCount((prev) => Math.max(0, prev - removedUnread));
    const ids = selected;
    setSelected([]);
    setSelectMode(false);
    setConfirmDelete(false);
    try {
      await Promise.all(ids.map((id) => api.delete(`/notifications/${id}`)));
    } catch {
      // Silently ignore — local state already updated
    }
  }, [notifs, selected]);

  /* ── Toggle select ── */
  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const selectAll = () => setSelected(filtered.map((n) => n.id));
  const deselectAll = () => setSelected([]);

  /* ── Filter ── */
  const filtered = notifs.filter((n) => {
    if (activeFilter === "Unread") return !n.is_read;
    if (activeFilter === "Success") return n.type === "SUCCESS";
    if (activeFilter === "Alerts")
      return n.type === "FRAUD_ALERT" || n.type === "WARNING";
    if (activeFilter === "Info") return n.type === "INFO";
    return true;
  });

  const tabCount = (tab: FilterTab): number => {
    if (tab === "Unread") return notifs.filter((n) => !n.is_read).length;
    if (tab === "Success")
      return notifs.filter((n) => n.type === "SUCCESS").length;
    if (tab === "Alerts")
      return notifs.filter(
        (n) => n.type === "FRAUD_ALERT" || n.type === "WARNING",
      ).length;
    if (tab === "Info") return notifs.filter((n) => n.type === "INFO").length;
    return notifs.length;
  };

  const alertCount = notifs.filter(
    (n) => n.type === "FRAUD_ALERT" || n.type === "WARNING",
  ).length;
  const allSelected =
    filtered.length > 0 && selected.length === filtered.length;

  /* ── Header right actions ── */
  const headerRight = (
    <div className="flex items-center gap-2">
      <button
        onClick={fetchNotifications}
        disabled={loading}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40"
        title="Refresh"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>

      {selectMode ? (
        <button
          onClick={() => {
            setSelectMode(false);
            setSelected([]);
          }}
          className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      ) : (
        <>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="hidden sm:flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={() => setSelectMode(true)}
              className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <CheckSquare className="h-3.5 w-3.5" /> Select
            </button>
          )}
        </>
      )}
    </div>
  );

  /* ── Render ── */
  return (
    <AppLayout
      title="Notifications"
      subtitle={
        loading
          ? "Loading…"
          : unreadCount > 0
            ? `${unreadCount} unread`
            : "All caught up!"
      }
      headerRight={headerRight}
    >
      <div className="p-5 md:p-7">
        <div className="mx-auto max-w-3xl">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Loading notifications…
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <p className="text-sm font-medium text-slate-600">{error}</p>
              <button
                onClick={fetchNotifications}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Summary stats */}
              {notifs.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm mb-2">
                      <Inbox className="h-4 w-4 text-teal-600" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500">
                      Total
                    </p>
                    <p className="text-base font-black text-teal-600 mt-0.5">
                      {notifs.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm mb-2">
                      <Bell className="h-4 w-4 text-slate-600" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500">
                      Unread
                    </p>
                    <p className="text-base font-black text-slate-700 mt-0.5">
                      {unreadCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm mb-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500">
                      Alerts
                    </p>
                    <p className="text-base font-black text-rose-600 mt-0.5">
                      {alertCount}
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile mark-all-read */}
              {unreadCount > 0 && !selectMode && (
                <button
                  onClick={markAllRead}
                  className="mb-4 flex sm:hidden w-full h-10 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 text-xs font-bold text-teal-700 hover:bg-teal-100 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all {unreadCount}{" "}
                  as read
                </button>
              )}

              {/* Filter tabs */}
              <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
                {FILTER_TABS.map((tab) => {
                  const count = tabCount(tab);
                  const isActive = activeFilter === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold transition-all
                        ${
                          isActive
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {tab}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold
                        ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Select-mode toolbar */}
              {selectMode && filtered.length > 0 && (
                <div className="mb-3 flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5">
                  <button
                    onClick={allSelected ? deselectAll : selectAll}
                    className="flex items-center gap-2 text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all ${
                        allSelected
                          ? "border-teal-600 bg-teal-600"
                          : "border-teal-300 bg-white"
                      }`}
                    >
                      {allSelected && (
                        <Check className="h-2.5 w-2.5 text-white" />
                      )}
                    </div>
                    {allSelected ? "Deselect all" : "Select all"}
                    {selected.length > 0 && (
                      <span className="text-teal-500">
                        · {selected.length} selected
                      </span>
                    )}
                  </button>

                  {/* Bulk delete — attractive gradient pill, disabled state when empty */}
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={selected.length === 0}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all ${
                      selected.length > 0
                        ? "bg-linear-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/30 hover:shadow-rose-500/45 hover:scale-[1.03]"
                        : "bg-slate-100 text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete{selected.length > 0 ? ` (${selected.length})` : ""}
                  </button>
                </div>
              )}

              {/* Notification list */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-20 text-slate-400 shadow-sm">
                  <BellOff className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-semibold">
                    {activeFilter === "All"
                      ? "No notifications"
                      : `No ${activeFilter.toLowerCase()} notifications`}
                  </p>
                  <p className="text-[11px] mt-1">
                    {activeFilter === "All"
                      ? "You're all caught up!"
                      : "Try a different filter"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (selectMode) {
                          toggleSelect(notif.id);
                          return;
                        }
                        if (!notif.is_read) markRead(notif.id);
                      }}
                      className={`group relative flex items-start gap-3 rounded-2xl border-l-4 bg-white pl-5 pr-3 py-4 shadow-sm transition-all cursor-pointer
                        ${typeBorderColor(notif.type)}
                        ${!notif.is_read ? "border border-slate-200 shadow-md" : "border border-slate-100"}
                        ${selectMode ? "hover:bg-slate-50" : "hover:shadow-md"}
                        ${selected.includes(notif.id) ? "ring-2 ring-teal-500 ring-offset-1" : ""}
                      `}
                    >
                      {/* Select checkbox */}
                      {selectMode && (
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all
                          ${
                            selected.includes(notif.id)
                              ? "border-teal-600 bg-teal-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected.includes(notif.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      )}

                      {/* Icon */}
                      <NotifIcon type={notif.type} />

                      {/* Content */}
                      <div
                        className={`flex-1 min-w-0 ${!selectMode ? "sm:pr-16" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug
                            ${
                              !notif.is_read
                                ? "font-bold text-slate-900"
                                : "font-semibold text-slate-700"
                            }`}
                          >
                            {notif.title}
                          </p>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(notif.created_at)}
                            </span>
                            {!notif.is_read && (
                              <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">
                          {notif.message}
                        </p>
                        {notif.transaction_id && (
                          <Link
                            to="/history"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                          >
                            View transaction{" "}
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>

                      {/* Row actions — beautiful pill buttons, always visible on mobile, hover-reveal on desktop */}
                      {!selectMode && (
                        <div className="flex shrink-0 items-center gap-1.5 sm:absolute sm:right-3 sm:top-3 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-x-1 sm:group-hover:translate-x-0 transition-all duration-200">
                          {!notif.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead(notif.id);
                              }}
                              title="Mark as read"
                              className="flex h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-md hover:shadow-emerald-600/30 transition-all"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">
                                Mark read
                              </span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmSingle(notif.id);
                            }}
                            title="Delete"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white hover:shadow-md hover:shadow-rose-600/30 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Single-delete confirmation */}
      {confirmSingle && (
        <ConfirmDeleteModal
          count={1}
          onConfirm={confirmDeleteOne}
          onCancel={() => setConfirmSingle(null)}
        />
      )}

      {/* Bulk delete confirmation */}
      {confirmDelete && (
        <ConfirmDeleteModal
          count={selected.length}
          onConfirm={deleteSelected}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </AppLayout>
  );
}
