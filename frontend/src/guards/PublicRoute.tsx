import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import useAuthStore from "@/store/auth.store";

interface Props {
  children: React.ReactNode;
}

export function PublicRoute({ children }: Props) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user       = useAuthStore((s) => s.user);
  const navigate   = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) return;

    if (!user?.is_verified) {
      navigate({ to: "/verify_phone" });
      return;
    }

    
    navigate({ to: "/dashboard" });
  }, [isLoggedIn,navigate, user]);

  return <>{children}</>;
}