import { ChevronLeft, ChevronRight, Clock, Menu, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { juryApi } from "../api/client";
import { createSocket } from "../lib/socket";

export default function JuryPage() {
  const { token } = useParams();
  const socketRef = useRef(null);
  const currentChoreographyRef = useRef(null);
  const submittedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState("");
  const [judge, setJudge] = useState(null);
  const [eventItem, setEventItem] = useState(null);
  const [currentChoreography, setCurrentChoreography] = useState(null);
  const [presentedChoreographies, setPresentedChoreographies] = useState([]);
  const [selectedChoreographyId, setSelectedChoreographyId] = useState(null);
  const [selectedChoreography, setSelectedChoreography] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentScore, setCurrentScore] = useState(null);
  const [editingScore, setEditingScore] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [invalidToken, setInvalidToken] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [scoreLogs, setScoreLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    currentChoreographyRef.current = currentChoreography;
  }, [currentChoreography]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  useEffect(() => {
    loadAccess();
  }, [token]);

  useEffect(() => {
    if (!eventItem?.id || invalidToken) {
      return undefined;
    }

    const socket = createSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("JOIN_EVENT", { eventId: eventItem.id });
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("CURRENT_CHOREOGRAPHY", (payload) => {
      if (payload.eventId !== eventItem.id) {
        return;
      }

      setCurrentChoreography(payload);
      setPresentedChoreographies((prev) => {
        const exists = prev.some((item) => item.choreography.id === payload.id);
        if (exists) {
          return prev.map((item) =>
            item.choreography.id === payload.id
              ? { ...item, choreography: payload }
              : item
          );
        }
        return [...prev, { choreography: payload, presentedAt: new Date().toISOString(), score: null }];
      });

      const wasViewingCurrent =
        !selectedChoreographyId || selectedChoreographyId === currentChoreographyRef.current?.id;

      if (wasViewingCurrent) {
        selectChoreography(payload.id, payload, null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [eventItem?.id, invalidToken]);

  async function loadAccess() {
    setLoading(true);
    setInvalidToken(false);
    setError("");

    try {
      const response = await juryApi.access(token);
      setJudge(response.judge);
      setEventItem(response.event);
      setCurrentChoreography(response.currentChoreography);
      setPresentedChoreographies(response.presentedChoreographies || []);
      setBlocks(response.blocks || []);

      const initialChoreography =
        response.currentChoreography ||
        response.presentedChoreographies?.[response.presentedChoreographies.length - 1]?.choreography ||
        null;

      if (initialChoreography) {
        const selectedItem = response.presentedChoreographies?.find(
          (item) => item.choreography.id === initialChoreography.id
        );
        selectChoreography(initialChoreography.id, initialChoreography, selectedItem?.score || response.currentScore);
      } else {
        setSelectedChoreographyId(null);
        setSelectedChoreography(null);
        setCurrentChoreography(null);
        setSubmitted(false);
        setCurrentScore(null);
        setScore("");
        setEditingScore(false);
      }
    } catch (requestError) {
      setInvalidToken(true);
      setError(requestError.response?.data?.message || "Acesso invalido.");
    } finally {
      setLoading(false);
    }
  }

  function selectChoreography(choreographyId, choreography, scoreData) {
    setSelectedChoreographyId(choreographyId);
    setSelectedChoreography(choreography);
    setSubmitted(Boolean(scoreData));
    setCurrentScore(scoreData || null);
    setScore(scoreData?.nota !== undefined ? String(Number(scoreData.nota).toFixed(2)) : "");
    setEditingScore(false);
    setConfirmOpen(false);
    setError("");
    setScoreLogs([]);
    if (scoreData) {
      loadScoreLogs(choreographyId);
    }
  }

  async function loadScoreLogs(choreographyId) {
    setLoadingLogs(true);
    try {
      const response = await juryApi.scoreLogs(token, choreographyId);
      setScoreLogs(response.logs || []);
    } catch {
      setScoreLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }

  function handleScoreChange(event) {
    const nextValue = event.target.value.replace(",", ".");

    if (nextValue === "") {
      setScore("");
      return;
    }

    if (!/^\d{0,2}(\.\d{0,2})?$/.test(nextValue)) {
      return;
    }

    setScore(nextValue);
  }

  function openConfirmation() {
    const numericScore = Number(score);

    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 10) {
      setError("Digite uma nota valida entre 0.00 e 10.00.");
      return;
    }

    if (!selectedChoreography) {
      setError("Nenhuma coreografia selecionada no momento.");
      return;
    }

    setError("");
    setConfirmOpen(true);
  }

  async function submitScore() {
    if (!selectedChoreography) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await juryApi.submitScore({
        token,
        choreographyId: selectedChoreography.id,
        nota: Number(score).toFixed(2)
      });

      setSubmitted(true);
      setCurrentScore(response.score);
      setPresentedChoreographies((prev) =>
        prev.map((item) =>
          item.choreography.id === selectedChoreography.id
            ? {
                ...item,
                score: {
                  nota: response.score.nota,
                  createdAt: response.score.createdAt,
                  updatedAt: response.score.updatedAt
                }
              }
            : item
        )
      );
      setEditingScore(false);
      setConfirmOpen(false);
      loadScoreLogs(selectedChoreography.id);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Nao foi possivel enviar a nota.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const confirmScoreLabel = useMemo(() => {
    if (!score) {
      return "0.00";
    }

    const numericScore = Number(score);
    return Number.isFinite(numericScore) ? numericScore.toFixed(2) : score;
  }, [score]);

  const blockMap = useMemo(() => {
    const map = new Map();
    blocks.forEach((b) => map.set(b.id, b.nome));
    return map;
  }, [blocks]);

  const filteredChoreographies = useMemo(() => {
    let items = presentedChoreographies;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const c = item.choreography;
        return (
          String(c.n_inscricao).toLowerCase().includes(query) ||
          (c.nome_coreografia || "").toLowerCase().includes(query) ||
          (c.escola || "").toLowerCase().includes(query) ||
          (c.elenco || "").toLowerCase().includes(query)
        );
      });
    }

    return items;
  }, [presentedChoreographies, searchQuery]);

  const groupedChoreographies = useMemo(() => {
    if (!blocks.length) {
      return [{ block: null, items: filteredChoreographies }];
    }

    const groups = [];
    const blockOrder = blocks.slice().sort((a, b) => a.ordem - b.ordem);

    for (const block of blockOrder) {
      const items = filteredChoreographies.filter((item) => item.choreography.blockId === block.id);
      if (items.length > 0) {
        groups.push({ block, items });
      }
    }

    const noBlock = filteredChoreographies.filter(
      (item) => !item.choreography.blockId || !blockMap.has(item.choreography.blockId)
    );
    if (noBlock.length > 0) {
      groups.push({ block: null, items: noBlock });
    }

    return groups;
  }, [filteredChoreographies, blocks, blockMap]);

  const currentIndex = useMemo(() => {
    if (!selectedChoreographyId) return -1;
    return presentedChoreographies.findIndex((item) => item.choreography.id === selectedChoreographyId);
  }, [presentedChoreographies, selectedChoreographyId]);

  function navigatePrev() {
    if (currentIndex > 0) {
      const prev = presentedChoreographies[currentIndex - 1];
      selectChoreography(prev.choreography.id, prev.choreography, prev.score);
    }
  }

  function navigateNext() {
    if (currentIndex < presentedChoreographies.length - 1) {
      const next = presentedChoreographies[currentIndex + 1];
      selectChoreography(next.choreography.id, next.choreography, next.score);
    }
  }

  const isDesistencia = selectedChoreography?.desistencia === true;

  if (loading) {
    return <CenteredScreen label="Conectando painel do jurado..." tone="neutral" />;
  }

  if (invalidToken) {
    return (
      <CenteredScreen
        label="Link invalido ou expirado"
        description={error || "Verifique o link enviado pela producao."}
        tone="error"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Jurado</p>
              <h1 className="text-lg font-extrabold leading-tight">{judge?.nome}</h1>
              <p className="text-xs text-slate-500">{eventItem?.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Prev / Next navigation */}
            <div className="hidden items-center gap-1 sm:flex">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                onClick={navigatePrev}
                disabled={currentIndex <= 0}
                title="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-xs font-semibold text-slate-500">
                {currentIndex >= 0 ? `${currentIndex + 1}/${presentedChoreographies.length}` : "-"}
              </span>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                onClick={navigateNext}
                disabled={currentIndex >= presentedChoreographies.length - 1}
                title="Proxima"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                socketConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {socketConnected ? "Ao vivo" : "Reconectando"}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-200 md:sticky md:top-[73px] md:z-0 md:h-[calc(100vh-73px)] md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 md:border-b-0">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Coreografias ({presentedChoreographies.length})
            </span>
            <button
              type="button"
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-200"
                placeholder="Buscar por numero, nome, escola..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile prev/next */}
          <div className="flex items-center justify-center gap-2 border-b border-slate-100 px-3 pb-2 sm:hidden">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
              onClick={() => { navigatePrev(); setSidebarOpen(false); }}
              disabled={currentIndex <= 0}
            >
              <ChevronLeft className="mr-1 inline h-3 w-3" />
              Anterior
            </button>
            <span className="text-xs font-semibold text-slate-500">
              {currentIndex >= 0 ? `${currentIndex + 1}/${presentedChoreographies.length}` : "-"}
            </span>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
              onClick={() => { navigateNext(); setSidebarOpen(false); }}
              disabled={currentIndex >= presentedChoreographies.length - 1}
            >
              Proxima
              <ChevronRight className="ml-1 inline h-3 w-3" />
            </button>
          </div>

          {/* Choreography list */}
          <div className="flex flex-col gap-1 px-3 py-2">
            {filteredChoreographies.length ? (
              groupedChoreographies.map((group) => (
                <div key={group.block?.id || "no-block"}>
                  {group.block && (
                    <div className="sticky top-0 z-10 mb-1 mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {group.block.nome}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isSelected = item.choreography.id === selectedChoreographyId;
                    const isCurrent = item.choreography.id === currentChoreographyRef.current?.id;
                    const isWithdrawn = item.choreography.desistencia === true;
                    const hasScore = Boolean(item.score);

                    return (
                      <button
                        key={item.choreography.id}
                        type="button"
                        className={`mb-1 flex w-full flex-col rounded-xl border px-3 py-2 text-left text-sm transition ${
                          isWithdrawn
                            ? isSelected
                              ? "border-red-300 bg-red-50 text-red-700"
                              : "border-red-100 bg-red-50/50 text-red-400"
                            : isSelected
                              ? "border-sky-500 bg-sky-50 text-slate-900"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                        onClick={() => {
                          selectChoreography(item.choreography.id, item.choreography, item.score);
                          setSidebarOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-bold ${isWithdrawn ? "line-through" : ""}`}>
                            #{String(item.choreography.n_inscricao).padStart(2, "0")}
                          </span>
                          <div className="flex items-center gap-1">
                            {isWithdrawn && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                Desistencia
                              </span>
                            )}
                            {isCurrent && !isWithdrawn && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Ao vivo
                              </span>
                            )}
                            {hasScore && !isWithdrawn && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                                {Number(item.score.nota).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`mt-1 truncate text-xs font-semibold ${isWithdrawn ? "line-through text-red-400" : "text-slate-900"}`}>
                          {item.choreography.nome_coreografia}
                        </span>
                        <span className="truncate text-[11px] text-slate-400">
                          {item.choreography.escola}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            ) : searchQuery ? (
              <p className="py-4 text-center text-sm text-slate-500">Nenhum resultado para "{searchQuery}".</p>
            ) : (
              <p className="py-4 text-center text-sm text-slate-500">Nenhuma coreografia apresentada ainda.</p>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-4">
          {selectedChoreography ? (
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              {/* Desistencia banner */}
              {isDesistencia && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center">
                  <p className="text-sm font-bold text-red-700">Desistencia</p>
                  <p className="mt-1 text-xs text-red-600">
                    Esta coreografia desistiu. Nao e necessario avaliar.
                  </p>
                </div>
              )}

              {/* Ficha tecnica */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="space-y-3 text-slate-900">
                  <div className="grid gap-2 text-sm text-slate-700">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold">Numero:</span>
                      <span>{String(selectedChoreography.n_inscricao).padStart(2, "0")}</span>
                      <span className="ml-4 font-bold">Coreografia:</span>
                      <span className="font-semibold text-slate-900">{selectedChoreography.nome_coreografia}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold">Modalidade:</span>
                      <span>{selectedChoreography.modalidade}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold">Categoria:</span>
                      <span>{selectedChoreography.categoria}</span>
                      <span className="ml-4 font-bold">Subcategoria:</span>
                      <span>{selectedChoreography.subcategoria}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold">Escola:</span>
                      <span>{selectedChoreography.escola}</span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-bold">Elenco:</span>
                      <span>{selectedChoreography.elenco || "-"}</span>
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-200" />

                  <div className="text-sm leading-6 text-slate-600">
                    <span className="font-bold">Release:</span>
                    <div className="mt-1">{selectedChoreography.release || "-"}</div>
                  </div>
                </div>
              </section>

              {/* Score section */}
              {isDesistencia ? (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-soft">
                  <p className="text-center text-sm font-semibold text-slate-400">
                    Avaliacao indisponivel para desistencias.
                  </p>
                </section>
              ) : (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sua nota</p>
                    {submitted && currentScore ? (
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                        onClick={() => setEditingScore(true)}
                      >
                        Alterar nota
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-5 text-center text-4xl font-extrabold tracking-tight text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      placeholder="0.00"
                      value={score}
                      onChange={handleScoreChange}
                      disabled={submitting || (submitted && !editingScore)}
                    />
                  </div>

                  {currentScore && submitted ? (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500">
                        Nota atual: <span className="font-bold text-slate-700">{Number(currentScore.nota).toFixed(2)}</span>
                      </p>

                      {/* Score change history */}
                      {scoreLogs.length > 0 && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <Clock className="h-3.5 w-3.5" />
                            Historico de alteracoes
                          </div>
                          <div className="mt-2 space-y-1.5">
                            {scoreLogs.map((log) => (
                              <div
                                key={log._id}
                                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs border border-slate-100"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-red-500 line-through">
                                    {Number(log.previousNota).toFixed(2)}
                                  </span>
                                  <span className="text-slate-400">&rarr;</span>
                                  <span className="font-bold text-emerald-600">
                                    {Number(log.newNota).toFixed(2)}
                                  </span>
                                </div>
                                <span className="text-slate-400">
                                  {new Date(log.createdAt).toLocaleString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit"
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {loadingLogs && (
                        <p className="mt-2 text-xs text-slate-400">Carregando historico...</p>
                      )}
                    </div>
                  ) : null}

                  {error ? <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

                  <button
                    type="button"
                    className="mt-4 w-full rounded-2xl bg-sky-600 px-5 py-4 text-base font-extrabold tracking-wide text-white transition hover:bg-sky-500 disabled:opacity-60"
                    onClick={openConfirmation}
                    disabled={submitting || (submitted && !editingScore)}
                  >
                    {submitted ? "ATUALIZAR NOTA" : "ENVIAR NOTA"}
                  </button>
                </section>
              )}
            </div>
          ) : (
            <CenteredPanel
              title="Aguardando proxima apresentacao..."
              description="A ficha tecnica aparecera automaticamente assim que a producao chamar a proxima coreografia."
            />
          )}
        </main>
      </div>

      {/* Confirmation modal */}
      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">Confirmacao</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
              Confirmar nota {confirmScoreLabel}?
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Voce pode alterar a nota depois, mas toda alteracao fica registrada.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base font-bold text-slate-800"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                Revisar nota
              </button>
              <button
                type="button"
                className="rounded-2xl bg-emerald-500 px-5 py-4 text-base font-extrabold text-white"
                onClick={submitScore}
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Confirmar envio"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CenteredScreen({ label, description, tone }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
      <div
        className={`w-full max-w-md rounded-2xl border px-6 py-10 text-center shadow-soft ${
          tone === "error" ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
        }`}
      >
        <h1 className="text-2xl font-extrabold tracking-tight">{label}</h1>
        {description ? <p className="mt-3 text-sm text-slate-600">{description}</p> : null}
      </div>
    </div>
  );
}

function CenteredPanel({ title, description }) {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-soft">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
