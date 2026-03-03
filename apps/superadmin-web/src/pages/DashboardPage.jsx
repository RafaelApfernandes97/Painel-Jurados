import { Activity, Ban, Building2, CalendarCheck2 } from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardApi } from "../api/client";
import Card from "../components/ui/Card";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../lib/httpError";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    activeClients: 0,
    blockedClients: 0,
    activeEventsToday: 0
  });

  useEffect(() => {
    let active = true;

    async function loadMetrics() {
      setLoading(true);

      try {
        const response = await dashboardApi.getMetrics();

        if (active) {
          setMetrics(response);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError, "Nao foi possivel carregar o dashboard."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMetrics();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState label="Carregando metricas globais..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Visao global da plataforma"
        description="Indicadores centrais de tenants e eventos ativos no dia."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Building2} label="Total clientes" value={metrics.totalClients} />
        <MetricCard icon={Activity} label="Clientes ativos" value={metrics.activeClients} />
        <MetricCard icon={Ban} label="Clientes bloqueados" value={metrics.blockedClients} />
        <MetricCard icon={CalendarCheck2} label="Eventos ativos hoje" value={metrics.activeEventsToday} />
      </div>

      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
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
