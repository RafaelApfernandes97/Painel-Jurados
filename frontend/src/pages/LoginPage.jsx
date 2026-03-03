import { LogIn } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form.email, form.password);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Nao foi possivel entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-soft lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-200">Festivais em Foco</p>
          <h1 className="mt-6 max-w-md text-4xl font-extrabold leading-tight">
            Painel SaaS para conduzir avaliacao de eventos sem atrito.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
            Controle eventos, ordem de apresentacao, jurados e notas ao vivo em uma operacao limpa e
            objetiva.
          </p>
        </div>

        <div className="panel p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-600">Login</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Entrar no painel</h2>
            <p className="mt-2 text-sm text-slate-500">Use as credenciais do usuario admin do cliente.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="admin@cliente.com"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="Sua senha"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </div>

            {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
