function normalizeUrl(url, fallback) {
  const value = (url || fallback || "").trim();

  return value.replace(/\/+$/, "");
}

export const APP_CONFIG = {
  apiUrl: normalizeUrl(import.meta.env.VITE_API_URL, "http://localhost:3000")
};
