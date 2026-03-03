const TOKEN_KEY = "painel_jurados_superadmin_token";

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding ? normalized.padEnd(normalized.length + (4 - padding), "=") : normalized;

  return atob(padded);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function parseTokenPayload(token) {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

export function isSuperAdminToken(token) {
  const payload = parseTokenPayload(token);

  if (!payload || payload.role !== "superadmin") {
    return false;
  }

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    return false;
  }

  return true;
}
