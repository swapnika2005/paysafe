import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authApi } from "../api/endpoints/auth.api";
import useAuthStore from "../store/auth.store";
import { QUERY_KEYS } from "../api/queryKeys";

/** @typedef {{ full_name: string; email: string; phone: string; pan: string; password: string; pin: string }} RegisterPayload */
/** @typedef {{ email: string; password: string }} LoginPayload */
/** @typedef {"PHONE_VERIFY" | "EMAIL_VERIFY"} OtpType */
/** @typedef {{ code: string; type: OtpType }} VerifyOtpPayload */
/** @typedef {{ phone: string; otp_code: string; new_password: string; confirm_password: string }} ResetPasswordPayload */

export const useMe = () => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return useQuery({
    queryKey: QUERY_KEYS.user,
    queryFn:  async () => {
      const { data } = await authApi.me();
      return data.data.user;
    },
    enabled:  isLoggedIn,  // only fetch if logged in
    staleTime: 1000 * 60 * 5, // 5 min
  });
};


export const useRegister = () => {
  const setAuth    = useAuthStore((s) => s.setAuth);
  const navigate   = useNavigate();

  /** @param {RegisterPayload} formData */
  const mutationFn = (formData) => authApi.register(formData);

  return useMutation({
    mutationFn,

    onSuccess: ({ data }) => {
      const { user, access_token } = data.data;
      setAuth(user, access_token);
      navigate({ to: "/verify_phone" });
    },
  });
};


export const useLogin = () => {
  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  /** @param {LoginPayload} credentials */
  const mutationFn = (credentials) => authApi.login(credentials);

  return useMutation({
    mutationFn,

    onSuccess: ({ data }) => {
      const { user, access_token, requires_verification } = data.data;
      if (data.data.requires_2fa) return;

      setAuth(user, access_token);

      if (requires_verification) {
        // Unverified user → send OTP then verify
        navigate({ to: "/verify_phone" });
      } else {
        navigate({ to: "/dashboard" });
      }
    },
  });
};


export const useLogout = () => {
  const logout      = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  return useMutation({
    mutationFn: () => authApi.logout(),

    onSettled: () => {
      logout();
      queryClient.clear();  
      navigate({ to: "/sign-in" });
    },
  });
};


export const useSendOtp = () => {
  /** @param {OtpType} type */
  const mutationFn = (type) => authApi.sendOtp(type);

  return useMutation({
    mutationFn,
  });
};


export const useVerifyOtp = () => {
  const updateUser  = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  /** @param {VerifyOtpPayload} payload */
  const mutationFn = ({ code, type }) => authApi.verifyOtp(code, type);

  return useMutation({
    mutationFn,

    onSuccess: (_, { type }) => {
      if (type === "PHONE_VERIFY") {
        // Mark user as verified in store + cache
        updateUser({ is_verified: true });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user });
        navigate({ to: "/dashboard" });
      }
      if (type === "EMAIL_VERIFY") {
        updateUser({ is_email_verified: true });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user });
      }
    },
  });
};


export const useForgotPassword = () => {
  /** @param {string} phone */
  const mutationFn = (phone) => authApi.forgotPassword(phone);

  return useMutation({
    mutationFn,
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();

  /** @param {ResetPasswordPayload} data */
  const mutationFn = (data) => authApi.resetPassword(data);

  return useMutation({
    mutationFn,

    onSuccess: () => {
      navigate({ to: "/sign-in" });
    },
  });
};


export const useChangePin = () => {
  return useMutation({
    mutationFn: (data) => authApi.changePin(data),
  });
};


export const useVerifyPin = () => {
  return useMutation({
    mutationFn: (pin) => authApi.verifyPin(pin),
  });
};