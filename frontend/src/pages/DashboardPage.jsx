import {
  CalendarClock,
  CheckCircle2,
  DollarSign,
  GalleryVerticalEnd,
  School,
  Users,
  Users2
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eventsApi, judgesApi, registrationsApi } from "../api/client";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import StatusPill from "../components/ui/StatusPill";
import { eventStatusLabel, formatDate } from "../lib/utils";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({
    judgesCount: 0,
    totalBailarinos: 0,
    totalEscolas: 0,
    totalCoreografias: 0,
    totalInscricoes: 0,
    receitaTotal: 0,
    totalPago: 0
  });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);

      try {
        const eventList = await eventsApi.list();

        if (!active) return;
        setEvents(eventList);

        // Carregar dados de cada evento em paralelo
        const results = await Promise.all(
          eventList.map(async (event) => {
            try {
              const [judges, regs] = await Promise.all([
                judgesApi.list(event._id),
                registrationsApi.list(event._id)
              ]);
              return { judges, regs };
            } catch {
              return { judges: [], regs: [] };
            }
          })
        );

        if (!active) return;

        let judgesCount = 0;
        let totalBailarinos = 0;
        const escolasSet = new Set();
        let totalCoreografias = 0;
        let totalInscricoes = 0;
        let receitaTotal = 0;
        let totalPago = 0;

        for (const { judges, regs } of results) {
          judgesCount += judges.length;
          totalInscricoes += regs.length;

          for (const reg of regs) {
            escolasSet.add(reg.nome_escola);
            receitaTotal += reg.valor_total || 0;
            totalPago += reg.valor_pago || 0;

            for (const c of reg.coreografias || []) {
              totalBailarinos += c.quantidade_bailarinos || 0;
              totalCoreografias++;
            }
          }
        }

        setMetrics({
          judgesCount,
          totalBailarinos,
          totalEscolas: escolasSet.size,
          totalCoreografias,
          totalInscricoes,
          receitaTotal,
          totalPago
        });
      } catch {
        if (!active) return;
        setEvents([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => { active = false; };
  }, []);

  const activeEvents = events.filter((event) => event.status === "ativo").length;

  if (loading) {
    return <LoadingState label="Carregando indicadores do painel..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Visao geral da operacao"
        description="Acompanhe rapidamente eventos, inscricoes, bailarinos e financeiro."
      />

      {/* ── Main metrics ── */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <MetricCard icon={CalendarClock} label="Total de eventos" value={events.length} />
        <MetricCard icon={CheckCircle2} label="Eventos ativos" value={activeEvents} />
        <MetricCard icon={Users2} label="Jurados cadastrados" value={metrics.judgesCount} />
        <MetricCard icon={GalleryVerticalEnd} label="Coreografias inscritas" value={metrics.totalCoreografias} />
      </div>

      {/* ── Extended metrics ── */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <MetricCard icon={Users} label="Total de bailarinos" value={metrics.totalBailarinos} />
        <MetricCard icon={School} label="Escolas / Grupos" value={metrics.totalEscolas} />
        <MetricCard
          icon={DollarSign}
          label="Receita total"
          value={`R$ ${metrics.receitaTotal.toFixed(2)}`}
          isText
        />
        <MetricCard
          icon={DollarSign}
          label="Total recebido"
          value={`R$ ${metrics.totalPago.toFixed(2)}`}
          isText
        />
      </div>

      {/* ── Recent events ── */}
      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Eventos recentes</h3>
            <p className="text-sm text-slate-500">Acesso rapido aos eventos em andamento.</p>
          </div>
          <Link to="/events" className="btn-secondary">
            Ver todos
          </Link>
        </div>

        {events.length ? (
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div
                key={event._id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-base font-bold text-slate-900">{event.nome}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {event.local} - {formatDate(event.data, { withTime: true })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill label={eventStatusLabel(event.status)} tone={event.status} />
                  <Link to={`/events/${event._id}/registrations`} className="btn-primary">
                    Abrir evento
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum evento cadastrado"
            description="Crie seu primeiro evento para comecar a organizar coreografias, jurados e avaliacoes."
            action={
              <Link to="/events" className="btn-primary">
                Ir para eventos
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, isText }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className={`mt-3 font-extrabold tracking-tight text-slate-950 ${isText ? "text-2xl" : "text-4xl"}`}>
            {value}
          </p>
        </div>
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
