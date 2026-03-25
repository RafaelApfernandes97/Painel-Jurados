import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

const tabs = [
  { key: "registrations", label: "Inscricoes" },
  { key: "financial", label: "Financeiro" },
  { key: "coreographies", label: "Coreografias" },
  { key: "blocks", label: "Blocos" },
  { key: "judges", label: "Jurados" },
  { key: "order", label: "Ordem" },
  { key: "schedule", label: "Cronograma" },
  { key: "live", label: "Ao vivo" },
  { key: "results", label: "Resultados" },
  { key: "certificates", label: "Certificados" }
];

export default function EventTabs({ eventId }) {
  const location = useLocation();

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const to = `/events/${eventId}/${tab.key}`;
        const isActive = location.pathname === to;

        return (
          <Link
            key={tab.key}
            to={to}
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
              isActive ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
