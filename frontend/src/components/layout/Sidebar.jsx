import {
  CalendarRange,
  ChevronLeft,
  LayoutDashboard,
  Sparkles,
  Theater
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "Eventos", icon: CalendarRange }
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6 text-white transition lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
              <Theater className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Festivais em Foco</p>
              <p className="text-xs text-slate-400">Controle do produtor</p>
            </div>
          </Link>
          <button type="button" className="btn-secondary lg:hidden" onClick={onClose}>
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* <div className="panel mb-6 border-slate-800 bg-slate-900/70 p-4 text-slate-200 shadow-none">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-600/20 p-2 text-brand-100">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Operacao enxuta</p>
              <p className="text-xs text-slate-400">Eventos, jurados e notas em um so fluxo.</p>
            </div>
          </div>
        </div> */}

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-white text-slate-950 shadow-soft"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* <div className="mt-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <p className="text-sm font-semibold text-white">Ao vivo pronto</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Chamada de coreografia, status de jurados e ranking em uma interface unica.
          </p>
        </div> */}
      </aside>
    </>
  );
}
