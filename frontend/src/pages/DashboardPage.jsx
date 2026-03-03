import { CalendarClock, CheckCircle2, Users2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eventsApi, judgesApi } from "../api/client";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import StatusPill from "../components/ui/StatusPill";
import { eventStatusLabel, formatDate } from "../lib/utils";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [judgesCount, setJudgesCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);

      try {
        const eventList = await eventsApi.list();

        if (!active) {
          return;
        }

        setEvents(eventList);

        const judgeLists = await Promise.all(eventList.map((event) => judgesApi.list(event._id)));

        if (!active) {
          return;
        }

        setJudgesCount(judgeLists.reduce((total, list) => total + list.length, 0));
      } catch (error) {
        if (!active) {
          return;
        }

        setEvents([]);
        setJudgesCount(0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
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
        description="Acompanhe rapidamente a estrutura do cliente, o volume de eventos e o total de jurados em uso."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={CalendarClock} label="Total de eventos" value={events.length} />
        <MetricCard icon={CheckCircle2} label="Eventos ativos" value={activeEvents} />
        <MetricCard icon={Users2} label="Jurados cadastrados" value={judgesCount} />
      </div>

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
                  <Link to={`/events/${event._id}/live`} className="btn-primary">
                    Abrir evento
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum evento cadastrado"
            description="Crie seu primeiro evento para começar a organizar coreografias, jurados e avaliacoes."
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

function MetricCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
