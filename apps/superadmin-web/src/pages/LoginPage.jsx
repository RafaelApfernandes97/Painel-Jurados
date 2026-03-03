import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../config/appConfig";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../lib/httpError";
import { APP_ROUTES } from "../lib/routes";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to={APP_ROUTES.dashboard} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form.email, form.password);
      navigate(location.state?.from || APP_ROUTES.dashboard, { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Nao foi possivel entrar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="panel w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-600">SuperAdmin</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Entrar no painel</h1>
        <p className="mt-2 text-sm text-slate-500">Operacao global da plataforma e dos tenants.</p>
        <p className="mt-1 text-xs text-slate-400">API conectada em {APP_CONFIG.apiUrl}</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              placeholder="admin@plataforma.com"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              className="input"
              placeholder="Senha"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </div>
          {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
