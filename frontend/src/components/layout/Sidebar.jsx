import {
  ArrowLeft,
  Award,
  CalendarRange,
  ChevronLeft,
  Clock,
  ClipboardList,
  DollarSign,
  GalleryVerticalEnd,
  Layers3,
  LayoutDashboard,
  ListOrdered,
  Radio,
  Theater,
  Trophy,
  Users
} from "lucide-react";
import { Link, NavLink, useLocation, useParams } from "react-router-dom";
import { cn } from "../../lib/utils";

const mainNavigation = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/events", label: "Eventos", icon: CalendarRange }
];

const eventNavigation = [
  { key: "registrations", label: "Inscricoes", icon: ClipboardList },
  { key: "financial", label: "Financeiro", icon: DollarSign },
  { key: "coreographies", label: "Coreografias", icon: GalleryVerticalEnd },
  { key: "blocks", label: "Blocos", icon: Layers3 },
  { key: "judges", label: "Jurados", icon: Users },
  { key: "order", label: "Ordem", icon: ListOrdered },
  { key: "schedule", label: "Cronograma", icon: Clock },
  { key: "live", label: "Ao vivo", icon: Radio },
  { key: "results", label: "Resultados", icon: Trophy },
  { key: "certificates", label: "Certificados", icon: Award }
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  // Detect if we are inside an event route
  const eventMatch = location.pathname.match(/^\/events\/([a-f0-9]+)\//);
  const eventId = eventMatch ? eventMatch[1] : null;

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
        {/* Logo */}
        <div className="mb-6 flex items-center justify-between">
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

        {eventId ? (
          /* ── Event context menu ── */
          <div className="flex flex-1 flex-col">
            {/* Back to events */}
            <NavLink
              to="/events"
              onClick={onClose}
              className="mb-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar aos eventos
            </NavLink>

            {/* Divider */}
            <div className="mb-4 border-t border-slate-800" />

            {/* Event label */}
            <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Modulos do evento
            </p>

            {/* Event nav items */}
            <nav className="space-y-1">
              {eventNavigation.map((item) => {
                const to = `/events/${eventId}/${item.key}`;
                const Icon = item.icon;
                const isActive = location.pathname === to;

                return (
                  <NavLink
                    key={item.key}
                    to={to}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                      isActive
                        ? "bg-white text-slate-950 shadow-soft"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {item.key === "live" && (
                      <span className={cn(
                        "ml-auto h-2 w-2 rounded-full",
                        isActive ? "bg-emerald-500" : "bg-emerald-400 animate-pulse"
                      )} />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ) : (
          /* ── Main menu ── */
          <nav className="space-y-2">
            {mainNavigation.map((item) => {
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
        )}
      </aside>
    </>
  );
}
