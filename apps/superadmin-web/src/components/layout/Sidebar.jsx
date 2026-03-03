import { BarChart3, Building2, ChevronLeft, Shield } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { APP_ROUTES } from "../../lib/routes";

const navigation = [
  { to: APP_ROUTES.dashboard, label: "Dashboard", icon: BarChart3 },
  { to: APP_ROUTES.clients, label: "Clientes", icon: Building2 }
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6 text-white transition lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link to={APP_ROUTES.dashboard} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Platform Admin</p>
              <p className="text-xs text-slate-400">Gestao central</p>
            </div>
          </Link>
          <button type="button" className="btn-secondary lg:hidden" onClick={onClose}>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-slate-950 shadow-xl shadow-slate-950/10"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-sm font-semibold text-white">Visao multi-tenant</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Controle clientes, planos, bloqueios e atividade da plataforma em um unico painel.
          </p>
        </div>
      </aside>
    </>
  );
}
