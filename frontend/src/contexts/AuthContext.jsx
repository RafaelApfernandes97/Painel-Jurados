import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/client";
import { clearToken, getToken, parseJwt, setToken } from "../lib/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(() => parseJwt(getToken()));

  useEffect(() => {
    const syncAuth = () => {
      const nextToken = getToken();
      setTokenState(nextToken);
      setUser(parseJwt(nextToken));
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      async login(email, password) {
        const response = await authApi.loginClient({ email, password });
        setToken(response.token);
        setTokenState(response.token);
        setUser(parseJwt(response.token));
      },
      logout() {
        clearToken();
        setTokenState(null);
        setUser(null);
      }
    }),
    [token, user]
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
