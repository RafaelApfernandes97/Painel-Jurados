import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { eventsApi } from "../api/client";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import StatusPill from "../components/ui/StatusPill";
import { eventStatusLabel, formatDate, toDateTimeLocalValue, toIsoDateTime } from "../lib/utils";

const initialForm = {
  nome: "",
  local: "",
  data: "",
  status: "ativo",
  inscricoes_online: false,
  inscricoes_video_seletiva: false,
  inscricoes_abertas: false,
  pricing: {
    valor_por_coreografia: 0,
    valor_por_bailarino: 0,
    taxa_inscricao_base: 0,
    taxas_adicionais: []
  },
  ecad: {
    habilitado: false,
    tabela: [],
    valor_padrao: 0
  },
  palcos: [],
  modalidades: [],
  categorias: [],
  subcategorias: []
};

export default function EventsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const sortedEvents = useMemo(
    () => [...events].sort((left, right) => new Date(left.data) - new Date(right.data)),
    [events]
  );

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);

    try {
      setEvents(await eventsApi.list());
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingEvent(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(eventItem) {
    setEditingEvent(eventItem);
    setForm({
      nome: eventItem.nome,
      local: eventItem.local,
      data: toDateTimeLocalValue(eventItem.data),
      status: eventItem.status || "ativo",
      inscricoes_online: eventItem.inscricoes_online || false,
      inscricoes_video_seletiva: eventItem.inscricoes_video_seletiva || false,
      inscricoes_abertas: eventItem.inscricoes_abertas || false,
      pricing: eventItem.pricing || initialForm.pricing,
      ecad: eventItem.ecad || initialForm.ecad,
      palcos: eventItem.palcos || [],
      modalidades: eventItem.modalidades || [],
      categorias: eventItem.categorias || [],
      subcategorias: eventItem.subcategorias || []
    });
    setError("");
    setModalOpen(true);
  }

  // ── Helpers para listas dinâmicas ──
  function addTaxaAdicional() {
    setForm((c) => ({
      ...c,
      pricing: {
        ...c.pricing,
        taxas_adicionais: [...(c.pricing.taxas_adicionais || []), { nome: "", tipo: "fixo", valor: 0 }]
      }
    }));
  }

  function removeTaxaAdicional(index) {
    setForm((c) => ({
      ...c,
      pricing: {
        ...c.pricing,
        taxas_adicionais: c.pricing.taxas_adicionais.filter((_, i) => i !== index)
      }
    }));
  }

  function addPalco() {
    setForm((c) => ({
      ...c,
      palcos: [...(c.palcos || []), { nome: "", descricao: "" }]
    }));
  }

  function removePalco(index) {
    setForm((c) => ({
      ...c,
      palcos: c.palcos.filter((_, i) => i !== index)
    }));
  }

  function addEcadItem() {
    setForm((c) => ({
      ...c,
      ecad: {
        ...c.ecad,
        tabela: [...(c.ecad.tabela || []), { descricao: "", tipo_musica: "", tipo_local: "", valor: 0 }]
      }
    }));
  }

  function removeEcadItem(index) {
    setForm((c) => ({
      ...c,
      ecad: {
        ...c.ecad,
        tabela: c.ecad.tabela.filter((_, i) => i !== index)
      }
    }));
  }

  // ── Helper para tags (modalidades, categorias, subcategorias) ──
  function handleTagKeyDown(field, e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && !form[field].includes(value)) {
        setForm((c) => ({ ...c, [field]: [...c[field], value] }));
      }
      e.target.value = "";
    }
  }

  function removeTag(field, index) {
    setForm((c) => ({ ...c, [field]: c[field].filter((_, i) => i !== index) }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        data: toIsoDateTime(form.data)
      };

      if (editingEvent) {
        await eventsApi.update(editingEvent._id, payload);
      } else {
        await eventsApi.create(payload);
      }

      setModalOpen(false);
      await loadEvents();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Nao foi possivel salvar o evento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(eventId) {
    if (!window.confirm("Excluir este evento?")) {
      return;
    }

    await eventsApi.remove(eventId);
    await loadEvents();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Eventos"
        title="Cadastro e operacao dos eventos"
        description="Mantenha o calendario organizado e entre rapidamente em cada modulo do evento."
        actions={
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Novo evento
          </button>
        }
      />

      {loading ? (
        <LoadingState label="Buscando eventos..." />
      ) : events.length ? (
        <div className="space-y-3">
          {sortedEvents.map((eventItem) => (
            <div
              key={eventItem._id}
              className="group flex items-stretch rounded-2xl border border-slate-200 bg-white transition hover:shadow-sm"
            >
              {/* Status bar */}
              <div
                className={`flex w-2 shrink-0 rounded-l-2xl ${
                  eventItem.status === "ativo"
                    ? "bg-emerald-500"
                    : eventItem.status === "encerrado"
                      ? "bg-slate-400"
                      : "bg-amber-400"
                }`}
              />

              <div className="flex min-w-0 flex-1 flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to={`/events/${eventItem._id}/coreographies`}
                  className="min-w-0 flex-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{eventItem.nome}</span>
                    <StatusPill label={eventStatusLabel(eventItem.status)} tone={eventItem.status} />
                    {eventItem.inscricoes_online && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        Inscricoes online
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                    <span>{eventItem.local}</span>
                    <span className="text-slate-300">|</span>
                    <span>{formatDate(eventItem.data, { withTime: true })}</span>
                  </div>
                </Link>

                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/events/${eventItem._id}/coreographies`}
                    className="btn-primary text-sm"
                  >
                    Entrar
                  </Link>
                  <button type="button" className="btn-secondary text-sm" onClick={() => openEditModal(eventItem)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button type="button" className="btn-danger text-sm" onClick={() => handleDelete(eventItem._id)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum evento criado"
          description="Comece pelo cadastro do evento para liberar coreografias, jurados, ordem e avaliacao."
          action={
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              Criar primeiro evento
            </button>
          }
        />
      )}

      <Modal
        open={modalOpen}
        title={editingEvent ? "Editar evento" : "Novo evento"}
        description="Preencha os dados basicos do evento."
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome">
              <input
                className="input"
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                required
              />
            </Field>
            <Field label="Local">
              <input
                className="input"
                value={form.local}
                onChange={(event) => setForm((current) => ({ ...current, local: event.target.value }))}
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Data e hora">
              <input
                type="datetime-local"
                className="input"
                value={form.data}
                onChange={(event) => setForm((current) => ({ ...current, data: event.target.value }))}
                required
              />
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="ativo">Ativo</option>
                <option value="rascunho">Rascunho</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </Field>
          </div>
          {/* Inscription toggles */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">Inscricoes online</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={form.inscricoes_online}
                  onChange={(e) => setForm((c) => ({ ...c, inscricoes_online: e.target.checked }))}
                />
                <span className="text-sm text-slate-700">Habilitar inscricoes online para este evento</span>
              </label>
              {form.inscricoes_online && (
                <>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={form.inscricoes_abertas}
                      onChange={(e) => setForm((c) => ({ ...c, inscricoes_abertas: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-700">Inscricoes abertas (aceitando novas inscricoes)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={form.inscricoes_video_seletiva}
                      onChange={(e) => setForm((c) => ({ ...c, inscricoes_video_seletiva: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-700">Exigir video de seletiva na inscricao</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* ── Palcos ── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-700">Palcos</p>
              <button type="button" className="text-xs text-sky-600 hover:text-sky-700 font-semibold" onClick={addPalco}>
                + Adicionar palco
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">Cada palco funciona como um sub-evento independente.</p>
            {(form.palcos || []).map((palco, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  className="input flex-1"
                  placeholder="Nome do palco"
                  value={palco.nome}
                  onChange={(e) => {
                    const updated = [...form.palcos];
                    updated[i] = { ...updated[i], nome: e.target.value };
                    setForm((c) => ({ ...c, palcos: updated }));
                  }}
                />
                <input
                  className="input flex-1"
                  placeholder="Descricao (opcional)"
                  value={palco.descricao}
                  onChange={(e) => {
                    const updated = [...form.palcos];
                    updated[i] = { ...updated[i], descricao: e.target.value };
                    setForm((c) => ({ ...c, palcos: updated }));
                  }}
                />
                <button type="button" onClick={() => removePalco(i)} className="text-red-400 hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* ── Configuração de Preços ── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">Configuracao de precos</p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Valor por coreografia (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.pricing.valor_por_coreografia}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      pricing: { ...c.pricing, valor_por_coreografia: Number(e.target.value) }
                    }))
                  }
                />
              </Field>
              <Field label="Valor por bailarino (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.pricing.valor_por_bailarino}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      pricing: { ...c.pricing, valor_por_bailarino: Number(e.target.value) }
                    }))
                  }
                />
              </Field>
              <Field label="Taxa base inscricao (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.pricing.taxa_inscricao_base}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      pricing: { ...c.pricing, taxa_inscricao_base: Number(e.target.value) }
                    }))
                  }
                />
              </Field>
            </div>

            {/* Taxas adicionais */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600">Taxas adicionais</p>
                <button type="button" className="text-xs text-sky-600 hover:text-sky-700 font-semibold" onClick={addTaxaAdicional}>
                  + Adicionar taxa
                </button>
              </div>
              {(form.pricing.taxas_adicionais || []).map((taxa, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    className="input flex-1"
                    placeholder="Nome da taxa"
                    value={taxa.nome}
                    onChange={(e) => {
                      const updated = [...form.pricing.taxas_adicionais];
                      updated[i] = { ...updated[i], nome: e.target.value };
                      setForm((c) => ({ ...c, pricing: { ...c.pricing, taxas_adicionais: updated } }));
                    }}
                  />
                  <select
                    className="input w-32"
                    value={taxa.tipo}
                    onChange={(e) => {
                      const updated = [...form.pricing.taxas_adicionais];
                      updated[i] = { ...updated[i], tipo: e.target.value };
                      setForm((c) => ({ ...c, pricing: { ...c.pricing, taxas_adicionais: updated } }));
                    }}
                  >
                    <option value="fixo">Fixo (R$)</option>
                    <option value="percentual">Percentual (%)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input w-24"
                    value={taxa.valor}
                    onChange={(e) => {
                      const updated = [...form.pricing.taxas_adicionais];
                      updated[i] = { ...updated[i], valor: Number(e.target.value) };
                      setForm((c) => ({ ...c, pricing: { ...c.pricing, taxas_adicionais: updated } }));
                    }}
                  />
                  <button type="button" onClick={() => removeTaxaAdicional(i)} className="text-red-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── ECAD ── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-700">ECAD</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={form.ecad.habilitado}
                  onChange={(e) => setForm((c) => ({ ...c, ecad: { ...c.ecad, habilitado: e.target.checked } }))}
                />
                <span className="text-sm text-slate-600">Habilitar ECAD</span>
              </label>
            </div>
            {form.ecad.habilitado && (
              <div className="space-y-3">
                <Field label="Valor padrao por coreografia (R$)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={form.ecad.valor_padrao}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, ecad: { ...c.ecad, valor_padrao: Number(e.target.value) } }))
                    }
                  />
                </Field>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600">Tabela ECAD</p>
                  <button type="button" className="text-xs text-sky-600 hover:text-sky-700 font-semibold" onClick={addEcadItem}>
                    + Adicionar faixa
                  </button>
                </div>
                {(form.ecad.tabela || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="input flex-1"
                      placeholder="Descricao"
                      value={item.descricao}
                      onChange={(e) => {
                        const updated = [...form.ecad.tabela];
                        updated[i] = { ...updated[i], descricao: e.target.value };
                        setForm((c) => ({ ...c, ecad: { ...c.ecad, tabela: updated } }));
                      }}
                    />
                    <input
                      className="input w-32"
                      placeholder="Tipo musica"
                      value={item.tipo_musica}
                      onChange={(e) => {
                        const updated = [...form.ecad.tabela];
                        updated[i] = { ...updated[i], tipo_musica: e.target.value };
                        setForm((c) => ({ ...c, ecad: { ...c.ecad, tabela: updated } }));
                      }}
                    />
                    <input
                      className="input w-28"
                      placeholder="Tipo local"
                      value={item.tipo_local}
                      onChange={(e) => {
                        const updated = [...form.ecad.tabela];
                        updated[i] = { ...updated[i], tipo_local: e.target.value };
                        setForm((c) => ({ ...c, ecad: { ...c.ecad, tabela: updated } }));
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input w-24"
                      placeholder="Valor"
                      value={item.valor}
                      onChange={(e) => {
                        const updated = [...form.ecad.tabela];
                        updated[i] = { ...updated[i], valor: Number(e.target.value) };
                        setForm((c) => ({ ...c, ecad: { ...c.ecad, tabela: updated } }));
                      }}
                    />
                    <button type="button" onClick={() => removeEcadItem(i)} className="text-red-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Opções de inscrição (modalidades, categorias, subcategorias) ── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">Opcoes do formulario de inscricao</p>
            <p className="mb-3 text-xs text-slate-500">Digite e pressione Enter para adicionar. Estas opcoes aparecerao como dropdown no formulario publico.</p>
            <div className="space-y-3">
              <TagField label="Modalidades" tags={form.modalidades} field="modalidades" onKeyDown={handleTagKeyDown} onRemove={removeTag} />
              <TagField label="Categorias" tags={form.categorias} field="categorias" onKeyDown={handleTagKeyDown} onRemove={removeTag} />
              <TagField label="Subcategorias" tags={form.subcategorias} field="subcategorias" onKeyDown={handleTagKeyDown} onRemove={removeTag} />
            </div>
          </div>

          {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar evento"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function TagField({ label, tags, field, onKeyDown, onRemove }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
            {tag}
            <button type="button" onClick={() => onRemove(field, i)} className="text-slate-400 hover:text-slate-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        className="input"
        placeholder={`Adicionar ${label.toLowerCase()}...`}
        onKeyDown={(e) => onKeyDown(field, e)}
      />
    </div>
  );
}
