import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { clientsApi } from "../api/client";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../lib/httpError";
import { APP_ROUTES } from "../lib/routes";
import { clientStatusLabel, formatDate } from "../lib/utils";

export default function ClientDetailPage() {
  const { clientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadClientEvents() {
      setLoading(true);

      try {
        const response = await clientsApi.getEvents(clientId);

        if (active) {
          setPayload(response);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError, "Nao foi possivel carregar os eventos do cliente."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadClientEvents();

    return () => {
      active = false;
    };
  }, [clientId]);

  if (loading) {
    return <LoadingState label="Carregando dados do cliente..." />;
  }

  const client = payload?.client;
  const events = payload?.events || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cliente"
        title={client ? client.nome_empresa : "Cliente"}
        description={
          client
            ? `${client.nome_responsavel || ""} - ${clientStatusLabel(client.status)} - Plano ${client.plano}`
            : "Eventos do tenant em modo somente leitura."
        }
        actions={
          <Link to={APP_ROUTES.clients} className="btn-secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        }
      />

      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {events.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Evento</th>
                  <th className="px-6 py-4 font-semibold">Local</th>
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => (
                  <tr key={event._id}>
                    <td className="px-6 py-4 font-semibold text-slate-900">{event.nome}</td>
                    <td className="px-6 py-4 text-slate-700">{event.local}</td>
                    <td className="px-6 py-4 text-slate-700">{formatDate(event.data, { withTime: true })}</td>
                    <td className="px-6 py-4 text-slate-700">{event.status}</td>
                    <td className="px-6 py-4 text-slate-700">{formatDate(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : error ? (
        <EmptyState
          title="Nao foi possivel carregar o cliente"
          description="Revise a sessao do SuperAdmin ou tente novamente com a API em execucao."
        />
      ) : (
        <EmptyState
          title="Sem eventos para este cliente"
          description="O tenant ainda nao cadastrou eventos ou todos foram removidos."
        />
      )}
    </div>
  );
}
