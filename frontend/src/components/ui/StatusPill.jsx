import { cn } from "../../lib/utils";

const statusMap = {
  ativo: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pendente: "bg-amber-50 text-amber-700 ring-amber-200",
  enviado: "bg-brand-50 text-brand-700 ring-brand-200",
  bloqueado: "bg-red-50 text-red-700 ring-red-200",
  expirado: "bg-slate-100 text-slate-700 ring-slate-200",
  encerrado: "bg-slate-100 text-slate-700 ring-slate-200",
  rascunho: "bg-slate-100 text-slate-700 ring-slate-200"
};

export default function StatusPill({ label, tone = "rascunho" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        statusMap[tone] || statusMap.rascunho
      )}
    >
      {label}
    </span>
  );
}
