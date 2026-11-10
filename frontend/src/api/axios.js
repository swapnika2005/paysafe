import axios from "axios";
import useAuthStore from "../store/auth.store";

const api = axios.create({
  baseURL:        import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  withCredentials: true,   
  timeout:         10000,
});


api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


let isRefreshing   = false;
let failedQueue    = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestPath = new URL(
      originalRequest.url,
      originalRequest.baseURL || api.defaults.baseURL
    ).pathname;
    const isAuthRequest = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/auth/forgot-password",
      "/auth/reset-password",
    ].some((path) => requestPath.endsWith(path));

    if (requestPath.endsWith("/auth/refresh")) {
      useAuthStore.getState().logout();
      window.location.href = "/sign-in";
      return Promise.reject(error);
    }

    if (isAuthRequest) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
     
      const { data } = await api.post("/auth/refresh");
      const newToken = data.data.access_token;

      useAuthStore.getState().setAccessToken(newToken);
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      window.location.href = "/sign-in";
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;