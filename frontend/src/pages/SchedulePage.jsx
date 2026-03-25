import { Clock, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { choreographiesApi, eventsApi } from "../api/client";

import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";

const STATUS_LABELS = {
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  primeira_chamada: "1a Chamada",
  no_palco: "No Palco",
  apresentado: "Apresentado",
  desistencia: "Desistencia"
};

const STATUS_COLORS = {
  aguardando: "bg-slate-100 text-slate-600 border-slate-200",
  confirmado: "bg-sky-50 text-sky-700 border-sky-200",
  primeira_chamada: "bg-amber-50 text-amber-700 border-amber-200",
  no_palco: "bg-purple-50 text-purple-700 border-purple-200",
  apresentado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  desistencia: "bg-red-50 text-red-700 border-red-200"
};

export default function SchedulePage() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [eventItem, setEventItem] = useState(null);
  const [choreographies, setChoreographies] = useState([]);
  const [palcoFilter, setPalcoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);
    try {
      const [events, coreos] = await Promise.all([
        eventsApi.list(),
        choreographiesApi.list(eventId)
      ]);
      setEventItem(events.find((e) => e._id === eventId) || null);
      setChoreographies(coreos);
    } finally {
      setLoading(false);
    }
  }

  const palcos = useMemo(() => {
    return eventItem?.palcos?.map((p) => p.nome) || [];
  }, [eventItem]);

  const filtered = useMemo(() => {
    let items = choreographies;
    if (palcoFilter) {
      items = items.filter((c) => c.palco === palcoFilter);
    }
    if (statusFilter) {
      items = items.filter((c) => (c.status_cronograma || "aguardando") === statusFilter);
    }
    return items;
  }, [choreographies, palcoFilter, statusFilter]);

  // Agrupar por status
  const groups = useMemo(() => {
    const order = ["no_palco", "primeira_chamada", "confirmado", "aguardando", "apresentado", "desistencia"];
    const grouped = {};
    for (const status of order) {
      grouped[status] = filtered.filter((c) => (c.status_cronograma || "aguardando") === status);
    }
    return grouped;
  }, [filtered]);

  async function handleStatusChange(choreographyId, newStatus) {
    setUpdating(choreographyId);
    try {
      const updated = await choreographiesApi.update(choreographyId, { status_cronograma: newStatus });
      setChoreographies((prev) => prev.map((c) => (c._id === choreographyId ? updated : c)));
    } finally {
      setUpdating("");
    }
  }

  async function handleTimeChange(choreographyId, horario) {
    try {
      await choreographiesApi.update(choreographyId, { horario_previsto: horario || null });
      setChoreographies((prev) =>
        prev.map((c) => (c._id === choreographyId ? { ...c, horario_previsto: horario } : c))
      );
    } catch {
      // silent
    }
  }

  // Stats
  const stats = useMemo(() => {
    const total = choreographies.length;
    const apresentadas = choreographies.filter((c) => (c.status_cronograma || "aguardando") === "apresentado").length;
    const aguardando = choreographies.filter((c) => (c.status_cronograma || "aguardando") === "aguardando").length;
    const desistencias = choreographies.filter((c) => c.desistencia).length;
    return { total, apresentadas, aguardando, desistencias };
  }, [choreographies]);

  if (loading) {
    return <LoadingState label="Carregando cronograma..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evento"
        title={eventItem ? `${eventItem.nome} - Cronograma` : "Cronograma"}
        description="Gerencie horarios e status de cada apresentacao."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Aguardando" value={stats.aguardando} color="amber" />
        <MiniStat label="Apresentadas" value={stats.apresentadas} color="emerald" />
        <MiniStat label="Desistencias" value={stats.desistencias} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-slate-400" />

        {/* Palco filter */}
        {palcos.length > 0 && (
          <>
            <button
              type="button"
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                !palcoFilter ? "bg-slate-950 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
              onClick={() => setPalcoFilter("")}
            >
              Todos palcos
            </button>
            {palcos.map((p) => (
              <button
                key={p}
                type="button"
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  palcoFilter === p ? "bg-slate-950 text-white" : "bg-white text-slate-600 border border-slate-200"
                }`}
                onClick={() => setPalcoFilter(p)}
              >
                {p}
              </button>
            ))}
            <span className="text-slate-300 mx-1">|</span>
          </>
        )}

        {/* Status filter */}
        <button
          type="button"
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
            !statusFilter ? "bg-slate-950 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
          onClick={() => setStatusFilter("")}
        >
          Todos status
        </button>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
              statusFilter === key ? "bg-slate-950 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline by status groups */}
      {filtered.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groups).map(([status, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={status}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs text-slate-500">({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-stretch rounded-2xl border border-slate-200 bg-white hover:shadow-sm transition"
                    >
                      <div className={`w-2 shrink-0 rounded-l-2xl ${
                        status === "apresentado" ? "bg-emerald-500"
                        : status === "no_palco" ? "bg-purple-500"
                        : status === "primeira_chamada" ? "bg-amber-400"
                        : status === "desistencia" ? "bg-red-500"
                        : "bg-slate-300"
                      }`} />
                      <div className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                              #{c.n_inscricao}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{c.nome_coreografia}</span>
                            {c.palco && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                                {c.palco}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                            <span>{c.escola}</span>
                            <span className="text-slate-300">|</span>
                            <span>{c.modalidade} - {c.categoria}</span>
                            {c.tempo_apresentacao && (
                              <>
                                <span className="text-slate-300">|</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {c.tempo_apresentacao}
                                </span>
                              </>
                            )}
                            {c.quantidade_bailarinos > 0 && (
                              <>
                                <span className="text-slate-300">|</span>
                                <span>{c.quantidade_bailarinos} bailarino(s)</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {/* Horário previsto */}
                          <input
                            type="time"
                            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                            value={c.horario_previsto ? new Date(c.horario_previsto).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                            onChange={(e) => {
                              if (e.target.value) {
                                const [h, m] = e.target.value.split(":");
                                const date = eventItem?.data ? new Date(eventItem.data) : new Date();
                                date.setHours(Number(h), Number(m), 0, 0);
                                handleTimeChange(c._id, date.toISOString());
                              } else {
                                handleTimeChange(c._id, null);
                              }
                            }}
                          />

                          {/* Status dropdown */}
                          <select
                            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold"
                            value={c.status_cronograma || "aguardando"}
                            onChange={(e) => handleStatusChange(c._id, e.target.value)}
                            disabled={updating === c._id}
                          >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma coreografia encontrada"
          description="Ajuste os filtros ou adicione coreografias ao evento."
        />
      )}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  const colors = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700"
  };
  const cls = color ? colors[color] : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${cls}`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold">{label}</p>
    </div>
  );
}
