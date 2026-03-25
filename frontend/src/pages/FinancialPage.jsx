import { DollarSign, Download, School, TrendingUp, Users2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { eventsApi, financialApi } from "../api/client";

import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";

export default function FinancialPage() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [eventItem, setEventItem] = useState(null);
  const [summary, setSummary] = useState(null);
  const [schools, setSchools] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);
    try {
      const [events, sum, sch] = await Promise.all([
        eventsApi.list(),
        financialApi.getSummary(eventId),
        financialApi.getBySchool(eventId)
      ]);
      setEventItem(events.find((e) => e._id === eventId) || null);
      setSummary(sum);
      setSchools(sch);
    } finally {
      setLoading(false);
    }
  }

  const filteredSchools = useMemo(() => {
    if (!schoolSearch.trim()) return schools;
    const q = schoolSearch.toLowerCase().trim();
    return schools.filter((s) => s.nome_escola.toLowerCase().includes(q));
  }, [schools, schoolSearch]);

  function fmtMoney(val) {
    return `R$ ${(val || 0).toFixed(2)}`;
  }

  function exportToCSV() {
    if (!schools.length) return;
    const headers = ["Escola", "Inscricoes", "Coreografias", "Bailarinos", "Total", "Pago", "Pendente"];
    const rows = schools.map((s) => [
      s.nome_escola,
      s.total_inscricoes,
      s.total_coreografias,
      s.total_bailarinos,
      s.valor_total.toFixed(2),
      s.valor_pago.toFixed(2),
      s.valor_pendente.toFixed(2)
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${eventItem?.nome || "evento"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <LoadingState label="Carregando dados financeiros..." />;
  }

  if (!summary) {
    return <EmptyState title="Sem dados financeiros" description="Nenhuma inscricao encontrada para este evento." />;
  }

  const percentPago = summary.receita_total > 0
    ? Math.round((summary.total_pago / summary.receita_total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evento"
        title={eventItem ? `${eventItem.nome} - Financeiro` : "Financeiro"}
        description="Controle financeiro completo: receita, pagamentos e visao por escola."
        actions={
          <button type="button" className="btn-secondary" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </button>
        }
      />

      {/* ── Summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={TrendingUp}
          label="Receita total"
          value={fmtMoney(summary.receita_total)}
          sublabel={`${summary.total_inscricoes} inscricoes`}
          color="sky"
        />
        <SummaryCard
          icon={DollarSign}
          label="Total recebido"
          value={fmtMoney(summary.total_pago)}
          sublabel={`${percentPago}% da receita`}
          color="emerald"
        />
        <SummaryCard
          icon={DollarSign}
          label="Pendente"
          value={fmtMoney(summary.total_pendente)}
          sublabel={`${summary.por_status.pendente + (summary.por_status.parcial || 0)} inscricoes`}
          color="amber"
        />
        <SummaryCard
          icon={Users2}
          label="Totais"
          value={`${summary.total_coreografias} coreos`}
          sublabel={`${summary.total_bailarinos} bailarinos`}
          color="slate"
        />
      </div>

      {/* ── Progress bar ── */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Progresso de arrecadacao</span>
          <span className="text-sm font-bold text-slate-900">{percentPago}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(100, percentPago)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>Recebido: {fmtMoney(summary.total_pago)}</span>
          <span>Meta: {fmtMoney(summary.receita_total)}</span>
        </div>
      </Card>

      {/* ── Status breakdown ── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <MiniCard label="Pendentes" value={summary.por_status.pendente || 0} color="amber" />
        <MiniCard label="Parciais" value={summary.por_status.parcial || 0} color="orange" />
        <MiniCard label="Pagos" value={summary.por_status.pago || 0} color="emerald" />
        <MiniCard label="Isentos" value={summary.por_status.isento || 0} color="slate" />
      </div>

      {/* ── Schools table ── */}
      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <School className="h-5 w-5 text-slate-500" />
            <h3 className="text-lg font-bold text-slate-900">Visao por escola</h3>
          </div>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none sm:w-64"
            placeholder="Buscar escola..."
            value={schoolSearch}
            onChange={(e) => setSchoolSearch(e.target.value)}
          />
        </div>

        {filteredSchools.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-3 pr-4 font-semibold text-slate-500">Escola</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-500 text-center">Inscr.</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-500 text-center">Coreos</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-500 text-center">Bailarinos</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-500 text-right">Total</th>
                  <th className="pb-3 pr-4 font-semibold text-slate-500 text-right">Pago</th>
                  <th className="pb-3 font-semibold text-slate-500 text-right">Pendente</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.nome_escola} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-slate-900">{school.nome_escola}</td>
                    <td className="py-3 pr-4 text-center text-slate-600">{school.total_inscricoes}</td>
                    <td className="py-3 pr-4 text-center text-slate-600">{school.total_coreografias}</td>
                    <td className="py-3 pr-4 text-center text-slate-600">{school.total_bailarinos}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-slate-900">{fmtMoney(school.valor_total)}</td>
                    <td className="py-3 pr-4 text-right text-emerald-700">{fmtMoney(school.valor_pago)}</td>
                    <td className={`py-3 text-right font-semibold ${school.valor_pendente > 0 ? "text-amber-600" : "text-slate-400"}`}>
                      {fmtMoney(school.valor_pendente)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300">
                  <td className="pt-3 pr-4 font-bold text-slate-900">Total</td>
                  <td className="pt-3 pr-4 text-center font-bold text-slate-900">
                    {filteredSchools.reduce((s, sc) => s + sc.total_inscricoes, 0)}
                  </td>
                  <td className="pt-3 pr-4 text-center font-bold text-slate-900">
                    {filteredSchools.reduce((s, sc) => s + sc.total_coreografias, 0)}
                  </td>
                  <td className="pt-3 pr-4 text-center font-bold text-slate-900">
                    {filteredSchools.reduce((s, sc) => s + sc.total_bailarinos, 0)}
                  </td>
                  <td className="pt-3 pr-4 text-right font-bold text-slate-900">
                    {fmtMoney(filteredSchools.reduce((s, sc) => s + sc.valor_total, 0))}
                  </td>
                  <td className="pt-3 pr-4 text-right font-bold text-emerald-700">
                    {fmtMoney(filteredSchools.reduce((s, sc) => s + sc.valor_pago, 0))}
                  </td>
                  <td className="pt-3 text-right font-bold text-amber-600">
                    {fmtMoney(filteredSchools.reduce((s, sc) => s + sc.valor_pendente, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <EmptyState title="Nenhuma escola encontrada" description="Ajuste a busca ou aguarde novas inscricoes." />
        )}
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sublabel, color }) {
  const bgColors = {
    sky: "bg-sky-50 border-sky-200",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
    slate: "bg-slate-50 border-slate-200"
  };
  const iconColors = {
    sky: "bg-sky-100 text-sky-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    slate: "bg-slate-100 text-slate-600"
  };

  return (
    <div className={`rounded-2xl border p-4 ${bgColors[color]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-slate-500">{sublabel}</p>}
        </div>
        <div className={`rounded-xl p-2 ${iconColors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MiniCard({ label, value, color }) {
  const colors = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600"
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${colors[color]}`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold">{label}</p>
    </div>
  );
}
