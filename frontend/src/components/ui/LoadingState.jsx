export default function LoadingState({ label = "Carregando..." }) {
  return (
    <div className="panel flex items-center justify-center gap-3 px-6 py-10 text-sm font-semibold text-slate-500">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-600" />
      {label}
    </div>
  );
}
