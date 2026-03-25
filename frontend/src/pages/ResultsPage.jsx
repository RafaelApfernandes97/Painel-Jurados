import { Medal } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { eventsApi } from "../api/client";

import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";

export default function ResultsPage() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [eventItem, setEventItem] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [events, rankingList] = await Promise.all([eventsApi.list(), eventsApi.getRanking(eventId)]);
      setEventItem(events.find((event) => event._id === eventId) || null);
      setRanking(rankingList);
    } catch (requestError) {
      setRanking([]);
      setError(requestError.response?.data?.message || "Nao foi possivel carregar o ranking.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState label="Carregando ranking..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evento"
        title={eventItem ? `${eventItem.nome} - Resultados` : "Resultados"}
        description="Ranking consolidado por media das notas enviadas pelos jurados."
      />



      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {ranking.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Colocacao</th>
                  <th className="px-6 py-4 font-semibold">Coreografia</th>
                  <th className="px-6 py-4 font-semibold">Categoria</th>
                  <th className="px-6 py-4 font-semibold">Media</th>
                  <th className="px-6 py-4 font-semibold">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranking.map((item) => (
                  <tr key={item.choreographyId}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 font-bold text-slate-950">
                        <div className="rounded-2xl bg-brand-50 p-2 text-brand-600">
                          <Medal className="h-4 w-4" />
                        </div>
                        {item.colocacao}o
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{item.nome_coreografia}</p>
                      <p className="mt-1 text-slate-500">{item.escola}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.modalidade} - {item.categoria} - {item.subcategoria}
                    </td>
                    <td className="px-6 py-4 text-lg font-extrabold text-slate-950">{item.media.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">{item.totalNotas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="Ranking indisponivel"
          description="As notas ainda nao foram consolidadas para este evento ou ainda nao ha avaliacoes."
        />
      )}
    </div>
  );
}
