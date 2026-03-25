import { CheckCircle2, Plus, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { registrationsApi } from "../api/client";

const emptyCoreo = {
  nome_coreografia: "",
  modalidade: "",
  categoria: "",
  subcategoria: "",
  quantidade_bailarinos: 1,
  release: "",
  musica: "",
  tempo_apresentacao: "",
  coreografo: "",
  elenco: "",
  video_url: ""
};

export default function PublicRegistrationPage() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [eventInfo, setEventInfo] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Dados do responsável
  const [contact, setContact] = useState({
    nome_responsavel: "",
    email: "",
    whatsapp: "",
    nome_escola: ""
  });

  // Coreografias (array dinâmico)
  const [coreografias, setCoreografias] = useState([{ ...emptyCoreo }]);

  // Preview de cálculo
  const [pricePreview, setPricePreview] = useState(null);

  useEffect(() => {
    loadEventInfo();
  }, [eventId]);

  // Recalcular valor quando coreografias mudam
  const calcularPreview = useCallback(async () => {
    if (!eventId) return;
    try {
      const result = await registrationsApi.calculateValue(eventId, {
        coreografias: coreografias.map((c) => ({
          nome_coreografia: c.nome_coreografia,
          quantidade_bailarinos: Number(c.quantidade_bailarinos) || 1
        }))
      });
      setPricePreview(result);
    } catch {
      // Silently ignore price preview errors
    }
  }, [eventId, coreografias]);

  useEffect(() => {
    const timer = setTimeout(calcularPreview, 500);
    return () => clearTimeout(timer);
  }, [calcularPreview]);

  async function loadEventInfo() {
    setLoading(true);
    try {
      const info = await registrationsApi.getPublicEventInfo(eventId);
      setEventInfo(info);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function updateContact(field, value) {
    setContact((prev) => ({ ...prev, [field]: value }));
  }

  function updateCoreo(index, field, value) {
    setCoreografias((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addCoreo() {
    setCoreografias((prev) => [...prev, { ...emptyCoreo }]);
  }

  function removeCoreo(index) {
    if (coreografias.length <= 1) return;
    setCoreografias((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await registrationsApi.submitPublic(eventId, {
        ...contact,
        coreografias: coreografias.map((c) => ({
          ...c,
          quantidade_bailarinos: Number(c.quantidade_bailarinos) || 1
        }))
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao enviar inscricao. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewRegistration() {
    setContact({ nome_responsavel: "", email: "", whatsapp: "", nome_escola: "" });
    setCoreografias([{ ...emptyCoreo }]);
    setSuccess(false);
    setError("");
    setPricePreview(null);
  }

  // Helper para renderizar select ou input baseado em opções do evento
  function renderSelectOrInput(coreoIndex, field, placeholder, options) {
    if (options && options.length > 0) {
      return (
        <select
          className="pub-input"
          value={coreografias[coreoIndex][field]}
          onChange={(e) => updateCoreo(coreoIndex, field, e.target.value)}
          required
        >
          <option value="">Selecione...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        className="pub-input"
        placeholder={placeholder}
        value={coreografias[coreoIndex][field]}
        onChange={(e) => updateCoreo(coreoIndex, field, e.target.value)}
        required
      />
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Inscricoes indisponiveis</h1>
          <p className="mt-2 text-sm text-slate-500">
            Este evento nao esta aceitando inscricoes no momento ou o link esta incorreto.
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-slate-900">Inscricao enviada!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sua inscricao para <strong>{eventInfo?.nome}</strong> foi recebida com sucesso
            com {coreografias.length} coreografia(s).
          </p>
          {pricePreview && pricePreview.valor_total > 0 && (
            <p className="mt-3 text-lg font-bold text-slate-900">
              Valor total: R$ {pricePreview.valor_total.toFixed(2)}
            </p>
          )}
          <button
            type="button"
            className="mt-6 rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700"
            onClick={handleNewRegistration}
          >
            Fazer outra inscricao
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-slate-100 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">{eventInfo?.nome}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {eventInfo?.local} -{" "}
            {eventInfo?.data
              ? new Date(eventInfo.data).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })
              : ""}
          </p>
          <p className="mt-3 text-sm font-semibold text-sky-600">Formulario de inscricao</p>
        </div>

        <form
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          {/* ── Dados de contato ── */}
          <div>
            <p className="mb-3 text-sm font-bold text-slate-700">Dados de contato</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do responsavel *">
                <input
                  className="pub-input"
                  value={contact.nome_responsavel}
                  onChange={(e) => updateContact("nome_responsavel", e.target.value)}
                  required
                />
              </Field>
              <Field label="Email *">
                <input
                  type="email"
                  className="pub-input"
                  value={contact.email}
                  onChange={(e) => updateContact("email", e.target.value)}
                  required
                />
              </Field>
              <Field label="WhatsApp *">
                <input
                  className="pub-input"
                  placeholder="(00) 00000-0000"
                  value={contact.whatsapp}
                  onChange={(e) => updateContact("whatsapp", e.target.value)}
                  required
                />
              </Field>
              <Field label="Nome da escola / grupo *">
                <input
                  className="pub-input"
                  value={contact.nome_escola}
                  onChange={(e) => updateContact("nome_escola", e.target.value)}
                  required
                />
              </Field>
            </div>
          </div>

          {/* ── Coreografias ── */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">
                Coreografias ({coreografias.length})
              </p>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                onClick={addCoreo}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar coreografia
              </button>
            </div>

            <div className="space-y-4">
              {coreografias.map((coreo, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Coreografia {i + 1}
                    </p>
                    {coreografias.length > 1 && (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                        onClick={() => removeCoreo(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nome da coreografia *">
                      <input
                        className="pub-input"
                        value={coreo.nome_coreografia}
                        onChange={(e) => updateCoreo(i, "nome_coreografia", e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Quantidade de bailarinos *">
                      <input
                        type="number"
                        min="1"
                        className="pub-input"
                        value={coreo.quantidade_bailarinos}
                        onChange={(e) => updateCoreo(i, "quantidade_bailarinos", e.target.value)}
                        required
                      />
                    </Field>
                    {eventInfo?.palcos?.length > 0 && (
                      <Field label="Palco *">
                        <select
                          className="pub-input"
                          value={coreo.palco || ""}
                          onChange={(e) => updateCoreo(i, "palco", e.target.value)}
                          required
                        >
                          <option value="">Selecione o palco...</option>
                          {eventInfo.palcos.map((p) => (
                            <option key={p.nome} value={p.nome}>{p.nome}{p.descricao ? ` - ${p.descricao}` : ""}</option>
                          ))}
                        </select>
                      </Field>
                    )}
                    <Field label="Modalidade *">
                      {renderSelectOrInput(i, "modalidade", "Ex: Ballet Classico, Jazz", eventInfo?.modalidades)}
                    </Field>
                    <Field label="Categoria *">
                      {renderSelectOrInput(i, "categoria", "Ex: Junior, Juvenil, Adulto", eventInfo?.categorias)}
                    </Field>
                    <Field label="Subcategoria *">
                      {renderSelectOrInput(i, "subcategoria", "Ex: Solo, Duo, Grupo", eventInfo?.subcategorias)}
                    </Field>
                    <Field label="Coreografo(a)">
                      <input
                        className="pub-input"
                        value={coreo.coreografo}
                        onChange={(e) => updateCoreo(i, "coreografo", e.target.value)}
                      />
                    </Field>
                    <Field label="Musica">
                      <input
                        className="pub-input"
                        value={coreo.musica}
                        onChange={(e) => updateCoreo(i, "musica", e.target.value)}
                      />
                    </Field>
                    <Field label="Tempo (formato 00:00:00)">
                      <input
                        className="pub-input"
                        placeholder="00:03:15"
                        value={coreo.tempo_apresentacao}
                        onChange={(e) => updateCoreo(i, "tempo_apresentacao", e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="mt-3 grid gap-3">
                    <Field label="Release / Sinopse">
                      <textarea
                        className="pub-input min-h-16"
                        value={coreo.release}
                        onChange={(e) => updateCoreo(i, "release", e.target.value)}
                      />
                    </Field>
                    <Field label="Elenco (nome completo e idade de cada participante)">
                      <textarea
                        className="pub-input min-h-16"
                        placeholder="Ex: Maria Silva - 15 anos, Joao Santos - 16 anos"
                        value={coreo.elenco}
                        onChange={(e) => updateCoreo(i, "elenco", e.target.value)}
                      />
                    </Field>
                  </div>

                  {/* Video (se evento exige) */}
                  {eventInfo?.inscricoes_video_seletiva && (
                    <div className="mt-3">
                      <Field label="Link do video de seletiva">
                        <input
                          type="url"
                          className="pub-input"
                          placeholder="https://..."
                          value={coreo.video_url}
                          onChange={(e) => updateCoreo(i, "video_url", e.target.value)}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Resumo financeiro ── */}
          {pricePreview && pricePreview.valor_total > 0 && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="mb-2 text-sm font-bold text-slate-700">Resumo do valor</p>
              <div className="space-y-1 text-sm">
                {pricePreview.taxa_base > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxa base de inscricao</span>
                    <span>R$ {pricePreview.taxa_base.toFixed(2)}</span>
                  </div>
                )}
                {(pricePreview.itens || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-slate-600">
                    <span>{item.nome_coreografia || `Coreografia ${i + 1}`} ({item.quantidade_bailarinos} bailarino{item.quantidade_bailarinos !== 1 ? "s" : ""})</span>
                    <span>R$ {item.valor.toFixed(2)}</span>
                  </div>
                ))}
                {pricePreview.ecad > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ECAD</span>
                    <span>R$ {pricePreview.ecad.toFixed(2)}</span>
                  </div>
                )}
                {pricePreview.taxas_adicionais > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxas adicionais</span>
                    <span>R$ {pricePreview.taxas_adicionais.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-sky-200 pt-2 font-bold text-slate-900">
                  <span>Total</span>
                  <span>R$ {pricePreview.valor_total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer música */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
            <strong>Aviso sobre musicas:</strong> A producao nao se responsabiliza por falhas em arquivos de musica.
            Recomendamos trazer um pen drive como alternativa no dia do evento.
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting
              ? "Enviando inscricao..."
              : `Enviar inscricao (${coreografias.length} coreografia${coreografias.length !== 1 ? "s" : ""})`}
          </button>
        </form>
      </div>

      <style>{`
        .pub-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .pub-input:focus {
          outline: none;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.15);
        }
        .pub-input::placeholder {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
