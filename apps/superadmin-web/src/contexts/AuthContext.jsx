import { createContext, useContext, useMemo, useState } from "react";
import { authApi } from "../api/client";
import { clearToken, getToken, isSuperAdminToken, parseTokenPayload, setToken } from "../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => {
    const storedToken = getToken();

    if (!isSuperAdminToken(storedToken)) {
      clearToken();
      return null;
    }

    return storedToken;
  });

  const value = useMemo(
    () => {
      const payload = parseTokenPayload(token);

      return {
        token,
        user: payload,
        isAuthenticated: isSuperAdminToken(token),
        async login(email, password) {
          const response = await authApi.login({ email, password });

          if (!isSuperAdminToken(response.token)) {
            clearToken();
            setTokenState(null);

            throw new Error("Token de SuperAdmin invalido");
          }

          setToken(response.token);
          setTokenState(response.token);
          console.info("[AUTH] Logged in", { user: parseTokenPayload(response.token) });
        },
        logout() {
          clearToken();
          setTokenState(null);
          console.info("[AUTH] Logged out");
        }
      };
    },
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
