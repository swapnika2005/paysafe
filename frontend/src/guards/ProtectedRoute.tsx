import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import useAuthStore from "@/store/auth.store";
import { authApi } from "@/api/endpoints/auth.api";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { isLoggedIn, user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      
      if (isLoggedIn && user) {
        if (requireAdmin && user.role !== "admin") {
          navigate({ to: "/dashboard" });
          return;
        }
        if (!user.is_verified) {
          navigate({ to: "/verify_phone" });
          return;
        }
        setChecking(false);
        return;
      }

     
      
      try {
        const { data }   = await authApi.refresh();
        const meRes      = await authApi.me();
        const fetchedUser = meRes.data.data.user;

        setAuth(fetchedUser, data.data.access_token);

        if (requireAdmin && fetchedUser.role !== "admin") {
          navigate({ to: "/dashboard" });
          return;
        }
        if (!fetchedUser.is_verified) {
          navigate({ to: "/verify_phone" });
          return;
        }

        setChecking(false);

      } catch {
        logout();
        navigate({ to: "/sign-in" });
      }
    };

    check();
  }, []);

 
  if (checking && !isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}