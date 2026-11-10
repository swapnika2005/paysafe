import { useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import useAuthStore from "@/store/auth.store";
import { authApi } from "@/api/endpoints/auth.api";


const PUBLIC_ONLY_ROUTES = ["/sign-in", "/sign-up", "/verify_phone", "/forgot-password", "/reset-password"];


const PROTECTED_ROUTES   = ["/dashboard", "/wallet", "/send", "/history", "/notifications", "/profile", "/settings", "/sendMoney"];


const ADMIN_ROUTES       = ["/admin"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user, setAuth, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const pathname  = location.pathname;

  useEffect(() => {
    const initAuth = async () => {

    
      if (!isLoggedIn) {
        const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) ||
                            ADMIN_ROUTES.some((r) => pathname.startsWith(r));

        if (isProtected) {
          try {
           
            const { data } = await authApi.refresh();
            const { access_token } = data.data;

            
            const meRes  = await authApi.me();
            const user   = meRes.data.data.user;

            setAuth(user, access_token);
          

          } catch {
           
            logout();
            navigate({ to: "/sign-in" });
          }
        }
        return;
      }

     
      const isPublicOnly = PUBLIC_ONLY_ROUTES.some((r) => pathname.startsWith(r));
      if (isLoggedIn && isPublicOnly) {
        navigate({ to: "/dashboard" });
        return;
      }

      
      const isVerifyPage = pathname === "/verify_phone";
      if (isLoggedIn && !user?.is_verified && !isVerifyPage) {
        const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
        if (isProtected) {
          navigate({ to: "/verify_phone" });
        }
        return;
      }

      
      const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
      if (isAdminRoute && user?.role !== "admin") {
        navigate({ to: "/dashboard" });
        return;
      }
    };

    initAuth();
  }, [pathname, isLoggedIn]);

  return <>{children}</>;
}