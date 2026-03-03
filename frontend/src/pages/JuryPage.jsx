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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [currentScore, setCurrentScore] = useState(null);
  const [editingScore, setEditingScore] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [invalidToken, setInvalidToken] = useState(false);

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
          return prev;
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
    <div className="min-h-screen bg-slate-100 px-4 py-5 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-5xl flex-col gap-4">
        <header className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Jurado</p>
              <h1 className="mt-1 text-xl font-extrabold">{judge?.nome}</h1>
              <p className="mt-1 text-xs text-slate-500">{eventItem?.nome}</p>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                socketConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {socketConnected ? "Ao vivo" : "Reconectando"}
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 md:flex-row">
          <aside className="md:w-64">
            <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-soft">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => setSidebarOpen((prev) => !prev)}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Apresentadas</span>
                <span className="text-xs font-semibold text-slate-500">{sidebarOpen ? "Fechar" : "Abrir"}</span>
              </button>

              {sidebarOpen ? (
                presentedChoreographies.length ? (
                  <div className="mt-3 flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
                    {presentedChoreographies.map((item) => {
                      const isSelected = item.choreography.id === selectedChoreographyId;
                      const isCurrent = item.choreography.id === currentChoreographyRef.current?.id;
                      return (
                        <button
                          key={item.choreography.id}
                          type="button"
                          className={`flex flex-col rounded-2xl border px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? "border-sky-500 bg-sky-50 text-slate-900"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                          onClick={() => selectChoreography(item.choreography.id, item.choreography, item.score)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">
                              #{String(item.choreography.n_inscricao).padStart(2, "0")}
                            </span>
                            {isCurrent ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Ao vivo
                              </span>
                            ) : null}
                          </div>
                          <span className="mt-1 truncate text-xs font-semibold text-slate-900">
                            {item.choreography.nome_coreografia}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Nenhuma coreografia apresentada ainda.</p>
                )
              ) : (
                <p className="mt-3 text-sm text-slate-500">Menu recolhido.</p>
              )}
            </section>
          </aside>

          {selectedChoreography ? (
            <div className="flex flex-1 flex-col gap-4">
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
                <p className="mt-3 text-xs text-slate-500">
                  Nota atual: {Number(currentScore.nota).toFixed(2)}
                </p>
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
          </div>
        ) : (
          <CenteredPanel
            title="Aguardando proxima apresentacao..."
            description="A ficha tecnica aparecera automaticamente assim que a producao chamar a proxima coreografia."
          />
        )}
      </div>

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
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-soft">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function FichaItem({ label, value, prominent = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{label}</p>
      <p className={`mt-3 ${prominent ? "text-3xl font-extrabold" : "text-xl font-bold"} leading-tight text-slate-900`}>
        {value}
      </p>
    </div>
  );
}
