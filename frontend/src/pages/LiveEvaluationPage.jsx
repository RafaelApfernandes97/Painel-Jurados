import { Ban, Radio, RefreshCcw, RotateCcw, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { blocksApi, choreographiesApi, eventsApi, judgesApi, scoresApi } from "../api/client";
import EventTabs from "../components/EventTabs";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import StatusPill from "../components/ui/StatusPill";
import { formatDate } from "../lib/utils";

export default function LiveEvaluationPage() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState("");
  const [eventItem, setEventItem] = useState(null);
  const [choreographies, setChoreographies] = useState([]);
  const [judges, setJudges] = useState([]);
  const [currentChoreography, setCurrentChoreography] = useState(null);
  const [scoreStatus, setScoreStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [detailsScores, setDetailsScores] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  useEffect(() => {
    let intervalId;

    async function poll() {
      await refreshCurrentChoreography();
    }

    poll();
    intervalId = setInterval(poll, 5000);

    return () => clearInterval(intervalId);
  }, [eventId]);

  async function loadData() {
    setLoading(true);

    try {
      const [events, choreographyList, judgesList, blockList] = await Promise.all([
        eventsApi.list(),
        choreographiesApi.list(eventId),
        judgesApi.list(eventId),
        blocksApi.list(eventId)
      ]);

      setEventItem(events.find((event) => event._id === eventId) || null);
      setChoreographies(
        choreographyList.sort((left, right) => left.ordem_apresentacao - right.ordem_apresentacao)
      );
      setJudges(judgesList);
      setBlocks(blockList);
      await refreshCurrentChoreography();
    } finally {
      setLoading(false);
    }
  }

  async function refreshChoreographies() {
    const choreographyList = await choreographiesApi.list(eventId);
    setChoreographies(
      choreographyList.sort((left, right) => left.ordem_apresentacao - right.ordem_apresentacao)
    );
  }

  async function refreshCurrentChoreography() {
    setRefreshing(true);
    try {
      const response = await eventsApi.getCurrentChoreography(eventId);
      setCurrentChoreography(response.currentChoreography);

      if (response.currentChoreography?.id) {
        const status = await scoresApi.listStatus(eventId, response.currentChoreography.id);
        setScoreStatus(status);
      } else {
        setScoreStatus(null);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function openDetails(item) {
    setDetailsOpen(true);
    setDetailsItem(item);
    setDetailsLoading(true);

    try {
      const response = await scoresApi.listStatus(eventId, item._id);
      setDetailsScores(response);
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    setDetailsOpen(false);
    setDetailsItem(null);
    setDetailsScores(null);
  }

  async function handleCall(item) {
    setCallingId(item._id);

    try {
      const response = await eventsApi.callChoreography(eventId, item._id);
      setCurrentChoreography(response.currentChoreography);
      await refreshCurrentChoreography();
      await refreshChoreographies();
    } finally {
      setCallingId("");
    }
  }

  async function handleReturnToQueue(item) {
    setCallingId(item._id);

    try {
      await eventsApi.returnToQueue(eventId, item._id);
      await refreshCurrentChoreography();
      await refreshChoreographies();
    } finally {
      setCallingId("");
    }
  }

  async function handleWithdraw(item) {
    setCallingId(item._id);

    try {
      await eventsApi.withdrawChoreography(eventId, item._id);
      await refreshChoreographies();
    } finally {
      setCallingId("");
    }
  }

  async function handleRestore(item) {
    setCallingId(item._id);

    try {
      await eventsApi.restoreChoreography(eventId, item._id);
      await refreshChoreographies();
    } finally {
      setCallingId("");
    }
  }

  const statusSummary = useMemo(() => {
    if (!scoreStatus) {
      return { sent: 0, pending: judges.length };
    }

    return {
      sent: scoreStatus.totalSubmitted,
      pending: Math.max(scoreStatus.totalJudges - scoreStatus.totalSubmitted, 0)
    };
  }, [judges.length, scoreStatus]);

  const blockMap = useMemo(() => {
    const map = new Map();
    blocks.forEach((b) => map.set(b._id, b.nome));
    return map;
  }, [blocks]);

  const { queueItems, presentedItems, withdrawnItems } = useMemo(() => {
    const matchesBlock = (item) => !selectedBlockId || item.blockId === selectedBlockId;
    const withdrawn = choreographies.filter((item) => item.desistencia && matchesBlock(item));
    const presented = choreographies.filter((item) => item.presentedAt && !item.desistencia && matchesBlock(item));
    const queue = choreographies.filter((item) => !item.presentedAt && !item.desistencia && matchesBlock(item));
    return { queueItems: queue, presentedItems: presented, withdrawnItems: withdrawn };
  }, [choreographies, selectedBlockId]);

  if (loading) {
    return <LoadingState label="Conectando ao painel ao vivo..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Evento"
          title={eventItem ? `${eventItem.nome} - Avaliacao ao vivo` : "Avaliacao ao vivo"}
          description="Chame a coreografia atual e acompanhe em tempo real quem ja enviou nota."
          actions={
            <div className="flex items-center gap-3">
              <StatusPill
                label={refreshing ? "Atualizando" : "Sincronizado"}
                tone={refreshing ? "pendente" : "ativo"}
              />
              <button type="button" className="btn-secondary" onClick={loadData}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Atualizar
              </button>
            </div>
          }
        />

        <EventTabs eventId={eventId} />

        {blocks.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">Filtrar bloco:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  !selectedBlockId ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setSelectedBlockId("")}
              >
                Todos
              </button>
              {blocks.map((block) => (
                <button
                  key={block._id}
                  type="button"
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    selectedBlockId === block._id ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                  onClick={() => setSelectedBlockId(block._id)}
                >
                  {block.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Fila de chamada</h3>
                <p className="text-sm text-slate-500">Dispare a ficha tecnica para todos os jurados do evento.</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                {choreographies.length} coreografias
              </div>
            </div>

            {queueItems.length ? (
              <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                {queueItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => openDetails(item)}
                    >
                      <p className="font-bold text-slate-900">
                        {item.ordem_apresentacao}. {item.nome_coreografia}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        #{item.n_inscricao} - {item.modalidade} - {item.escola}
                        {item.blockId && blockMap.has(item.blockId) && (
                          <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {blockMap.get(item.blockId)}
                          </span>
                        )}
                      </p>
                    </button>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleCall(item)}
                        disabled={callingId === item._id}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {callingId === item._id ? "Chamando..." : "Chamar coreografia"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary text-red-600 hover:bg-red-50"
                        onClick={() => handleWithdraw(item)}
                        disabled={callingId === item._id}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Desistencia
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sem coreografias para chamar"
                description="Cadastre as coreografias deste evento antes de iniciar a avaliacao ao vivo."
              />
            )}
          </Card>

          <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Coreografias apresentadas</h3>
              <p className="text-sm text-slate-500">Historico ja chamado neste evento.</p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {presentedItems.length} apresentadas
            </div>
          </div>

          {presentedItems.length ? (
            <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
              {presentedItems.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => openDetails(item)}
                  >
                    <p className="font-bold text-slate-900">
                      {item.ordem_apresentacao}. {item.nome_coreografia}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      #{item.n_inscricao} - {item.modalidade} - {item.escola}
                    </p>
                  </button>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleCall(item)}
                      disabled={callingId === item._id}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {callingId === item._id ? "Chamando..." : "Reapresentar"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleReturnToQueue(item)}
                      disabled={callingId === item._id}
                    >
                      Voltar para fila
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma coreografia apresentada"
              description="Assim que uma coreografia for chamada, ela aparecera aqui."
            />
          )}
          </Card>
        </div>

        {/* Withdrawn section */}
        {withdrawnItems.length > 0 && (
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-red-700">Desistencias</h3>
                <p className="text-sm text-slate-500">Inscricoes que desistiram e nao serao avaliadas.</p>
              </div>
              <div className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                {withdrawnItems.length} desistencias
              </div>
            </div>
            <div className="space-y-3">
              {withdrawnItems.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => openDetails(item)}
                  >
                    <p className="font-bold text-red-700 line-through">
                      {item.ordem_apresentacao}. {item.nome_coreografia}
                    </p>
                    <p className="mt-1 text-sm text-red-400">
                      #{item.n_inscricao} - {item.modalidade} - {item.escola}
                    </p>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleRestore(item)}
                    disabled={callingId === item._id}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Coreografia atual</p>
                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  {currentChoreography?.nome_coreografia || "Nenhuma chamada"}
                </h3>
              </div>
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
                <Radio className="h-5 w-5" />
              </div>
            </div>

            {currentChoreography ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <FichaItem label="Inscricao" value={currentChoreography.n_inscricao} />
                <FichaItem label="Escola" value={currentChoreography.escola} />
                <FichaItem label="Categoria" value={currentChoreography.categoria} />
                <FichaItem label="Subcategoria" value={currentChoreography.subcategoria} />
                <FichaItem label="Modalidade" value={currentChoreography.modalidade} />
                <FichaItem label="Ordem" value={currentChoreography.ordem_apresentacao} />
                <FichaItem label="Release" value={currentChoreography.release || "-"} />
                <FichaItem label="Elenco" value={currentChoreography.elenco || "-"} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Escolha uma coreografia na fila para iniciar a chamada.</p>
            )}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Status dos jurados</h3>
                <p className="text-xs text-slate-500">
                  Enviado: {statusSummary.sent} - Pendente: {statusSummary.pending}
                </p>
              </div>
              {eventItem ? (
                <div className="text-xs font-semibold text-slate-500">
                  {formatDate(eventItem.data, { withTime: true })}
                </div>
              ) : null}
            </div>

            {judges.length ? (
              <div className="space-y-3">
                {(scoreStatus?.judges || judges.map((judge) => ({ ...judge, enviado: false }))).map((judge) => (
                  <div
                    key={judge.judgeId || judge._id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{judge.nome}</p>
                      <p className="text-xs text-slate-500">
                        {judge.nota !== null && judge.nota !== undefined
                          ? `Nota enviada: ${Number(judge.nota).toFixed(2)}`
                          : "Aguardando envio"}
                      </p>
                    </div>
                    <StatusPill
                      label={judge.enviado ? "Enviado" : "Pendente"}
                      tone={judge.enviado ? "enviado" : "pendente"}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sem jurados no evento"
                description="Cadastre jurados antes de iniciar a avaliacao ao vivo."
              />
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={detailsOpen}
        title="Detalhes da coreografia"
        description={detailsItem ? `${detailsItem.nome_coreografia} (#${detailsItem.n_inscricao})` : ""}
        onClose={closeDetails}
      >
        {detailsLoading ? (
          <LoadingState label="Carregando notas..." />
        ) : detailsItem ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
              <p>
                <strong>Modalidade:</strong> {detailsItem.modalidade} | <strong>Categoria:</strong>{" "}
                {detailsItem.categoria} | <strong>Subcategoria:</strong> {detailsItem.subcategoria}
              </p>
              <p className="mt-2">
                <strong>Escola:</strong> {detailsItem.escola} | <strong>Elenco:</strong>{" "}
                {detailsItem.elenco || "-"}
              </p>
              <p className="mt-2">
                <strong>Release:</strong> {detailsItem.release || "-"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">Notas dos jurados</h4>
              <div className="mt-3 space-y-2">
                {(detailsScores?.judges || []).map((judge) => (
                  <div
                    key={judge.judgeId}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-slate-800">{judge.nome}</span>
                    <span className="font-semibold text-slate-700">
                      {judge.nota !== null && judge.nota !== undefined ? Number(judge.nota).toFixed(2) : "Pendente"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">Historico de alteracoes</h4>
              {detailsScores?.logs?.length ? (
                <div className="mt-3 space-y-2">
                  {detailsScores.logs.map((log) => (
                    <div
                      key={log._id}
                      className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700"
                    >
                      <p className="font-semibold text-slate-800">{log.judge_nome}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(log.createdAt, { withTime: true })}
                      </p>
                      <p className="mt-1">
                        <strong>De:</strong> {Number(log.previousNota).toFixed(2)}{" "}
                        <strong>Para:</strong> {Number(log.newNota).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500">
                  Nenhuma alteracao registrada.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function FichaItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
