import axios from "axios";
import { APP_CONFIG } from "../config/appConfig";
import { APP_ROUTES } from "../lib/routes";
import { clearToken, getToken, isSuperAdminToken } from "../lib/storage";

const http = axios.create({
  baseURL: APP_CONFIG.apiUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

http.interceptors.request.use((config) => {
  const token = getToken();

  if (isSuperAdminToken(token)) {
    config.headers.Authorization = `Bearer ${token}`;
    console.info("[HTTP] Request", {
      method: config.method,
      url: `${config.baseURL || ""}${config.url || ""}`,
      hasAuth: true
    });
  } else if (token) {
    clearToken();
    console.warn("[HTTP] Dropped non-superadmin token");
  } else {
    console.info("[HTTP] Request", {
      method: config.method,
      url: `${config.baseURL || ""}${config.url || ""}`,
      hasAuth: false
    });
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn("[HTTP] Response error", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    if (error.response?.status === 401) {
      clearToken();

      if (window.location.pathname !== APP_ROUTES.login) {
        window.location.href = APP_ROUTES.login;
      }
    }

    return Promise.reject(error);
  }
);

export default http;
