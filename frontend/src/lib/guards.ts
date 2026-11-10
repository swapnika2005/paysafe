import { redirect } from "@tanstack/react-router";
import useAuthStore from "@/store/auth.store";
import { authApi } from "@/api/endpoints/auth.api";


export const requireAuth = async () => {
  const { isLoggedIn, user, getToken, setAuth, logout } = useAuthStore.getState();

  if (isLoggedIn && user?.is_verified && getToken()) return;

  if (isLoggedIn && !user?.is_verified) {
    throw redirect({ to: "/verify_phone" });
  }

  let fetchedUser;
  try {
    const { data }    = await authApi.refresh();
    const meRes       = await authApi.me();
    fetchedUser = meRes.data.data.user;

    setAuth(fetchedUser, data.data.access_token);
  } catch {
    logout();
    throw redirect({ to: "/sign-in" });
  }

  if (!fetchedUser.is_verified) {
    throw redirect({ to: "/verify_phone" });
  }
};

export const requireAdmin = async () => {
  await requireAuth(); 

  const { user } = useAuthStore.getState();

  if (user?.role !== "admin") {
    throw redirect({ to: "/dashboard" });
  }
};


export const requireGuest = async () => {
  const { isLoggedIn, user, getToken, setAuth, logout } = useAuthStore.getState();

  if (!isLoggedIn) return;

  if (getToken()) {
    if (!user?.is_verified) {
      throw redirect({ to: "/verify_phone" });
    }

    throw redirect({ to: "/dashboard" });
  }

  let fetchedUser;
  try {
    const { data } = await authApi.refresh();
    const meRes = await authApi.me();
    fetchedUser = meRes.data.data.user;
    setAuth(fetchedUser, data.data.access_token);
  } catch {
    logout();
    return;
  }

  if (!fetchedUser.is_verified) {
    throw redirect({ to: "/verify_phone" });
  }

  throw redirect({ to: "/dashboard" });
};