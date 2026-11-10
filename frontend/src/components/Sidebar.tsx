import { Link, useLocation } from "@tanstack/react-router";
import {
  Bell, CreditCard, LayoutDashboard,
  LogOut, Send, Settings, Shield, User, Wallet, X,
  ShieldAlert,
} from "lucide-react";
import useAuthStore from "@/store/auth.store";
import { useLogout } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { formatIndianPhone } from "@/lib/formatters";


const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",     to: "/dashboard"      },
  { icon: Send,            label: "Send Money",    to: "/sendMoney"      },
  { icon: Wallet,          label: "Wallet",        to: "/wallet"         },
  { icon: CreditCard,      label: "History",       to: "/history"        },
  { icon: Bell,            label: "Notification", to: "/notification"  },
  { icon: User,            label: "Profile",       to: "/profile"        },
  { icon: Settings,        label: "Settings",      to: "/settings"       },
];

const ADMIN_NAV = [
  { icon: ShieldAlert, label: "Admin",     to: "/admin/dashboard" },
  { icon: Shield,      label: "Fraud Log", to: "/fraud" },
];


export function LogoMark({ size = 32 }: { size?: number }) {
  return <img src="/paysafe-logo.png" alt="PaySafe" width={size * 1.6} height={size} className="object-contain" />;
}


interface SidebarProps {
  open:    boolean;
  onClose: () => void;
}


export function Sidebar({ open, onClose }: SidebarProps) {
  const user     = useAuthStore((s) => s.user);
  const { mutate: logout } = useLogout();

  // Unread notification count for badge
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unread_count ?? 0;

  // Active route detection
  const location = useLocation();
  const pathname = location.pathname;

  // User initials for avatar
  const initials = user?.full_name
    ?.split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 flex w-64 flex-col
        bg-white border-r border-slate-100 shadow-sm
        transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}>

        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex flex-col items-start leading-none">
            <LogoMark size={34} />
            <p className="text-[9px] font-medium tracking-wide text-slate-500">
              Pay Smart. Stay Safe
            </p>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-600 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(({ icon: Icon, label, to }) => {
            const active = pathname === to || pathname.startsWith(to + "/");

            return (
              <Link
                key={label}
                to={to}
                onClick={onClose} // close on mobile when nav item clicked
                className={`
                  group flex items-center gap-3 rounded-xl px-3 py-2.5
                  text-sm font-medium transition-all duration-150
                  ${active
                    ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon className={`
                  h-4 w-4 shrink-0
                  ${active
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-600"
                  }
                `} />

                {label}

                {/* Notification badge */}
                {label === "Notification" && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Admin
              </p>
              {ADMIN_NAV.map(({ icon: Icon, label, to }) => {
                const active = pathname === to || pathname.startsWith(to + "/");
                return (
                  <Link
                    key={label}
                    to={to}
                    onClick={onClose}
                    className={`
                      group flex items-center gap-3 rounded-xl px-3 py-2.5
                      text-sm font-medium transition-all duration-150
                      ${active
                        ? "bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-md shadow-rose-600/25"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    {label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User card */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-cyan-600 text-xs font-bold text-white shadow-sm">
              {initials}
            </div>

            {/* User info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.full_name ?? "Loading…"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {formatIndianPhone(user?.phone)}
              </p>
            </div>

            {/* Logout */}
            <button
              onClick={() => logout()}
              title="Log out"
              className="text-slate-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}