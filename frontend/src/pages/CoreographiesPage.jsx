import { GripVertical, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { choreographiesApi, eventsApi } from "../api/client";
import ImportChoreographiesModal from "../components/ImportChoreographiesModal";

import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";

const initialForm = {
  n_inscricao: "",
  modalidade: "",
  categoria: "",
  subcategoria: "",
  escola: "",
  nome_coreografia: "",
  release: "",
  elenco: "",
  ordem_apresentacao: ""
};

export default function CoreographiesPage() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventItem, setEventItem] = useState(null);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);

    try {
      const [events, choreographies] = await Promise.all([eventsApi.list(), choreographiesApi.list(eventId)]);
      setEventItem(events.find((event) => event._id === eventId) || null);
      setItems(choreographies);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingItem(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setForm({
      n_inscricao: item.n_inscricao,
      modalidade: item.modalidade,
      categoria: item.categoria,
      subcategoria: item.subcategoria,
      escola: item.escola,
      nome_coreografia: item.nome_coreografia,
      release: item.release || "",
      elenco: item.elenco || "",
      ordem_apresentacao: String(item.ordem_apresentacao)
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        ordem_apresentacao: Number(form.ordem_apresentacao)
      };

      if (editingItem) {
        await choreographiesApi.update(editingItem._id, payload);
      } else {
        await choreographiesApi.create(eventId, payload);
      }

      setModalOpen(false);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Nao foi possivel salvar a coreografia.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId) {
    if (!window.confirm("Excluir esta coreografia?")) {
      return;
    }

    await choreographiesApi.remove(itemId);
    await loadData();
  }

  const sortedItems = useMemo(
    () => items.slice().sort((a, b) => a.ordem_apresentacao - b.ordem_apresentacao),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return sortedItems;
    const q = searchQuery.toLowerCase().trim();
    return sortedItems.filter((item) =>
      String(item.n_inscricao).toLowerCase().includes(q) ||
      (item.nome_coreografia || "").toLowerCase().includes(q) ||
      (item.escola || "").toLowerCase().includes(q) ||
      (item.modalidade || "").toLowerCase().includes(q) ||
      (item.categoria || "").toLowerCase().includes(q)
    );
  }, [sortedItems, searchQuery]);

  if (loading) {
    return <LoadingState label="Carregando coreografias..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evento"
        title={eventItem ? `${eventItem.nome} - Coreografias` : "Coreografias"}
        description="Gerencie a ficha tecnica de cada inscricao dentro do evento."
        actions={
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar planilha
            </button>
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Nova coreografia
            </button>
          </div>
        }
      />


      {items.length ? (
        <>
          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="Buscar por numero, nome, escola, modalidade, categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {filteredItems.length === items.length
                ? `${items.length} coreografias`
                : `${filteredItems.length} de ${items.length} coreografias`}
            </span>
            <span className="text-xs">Ordenadas por ordem de apresentacao</span>
          </div>

          {/* Card list */}
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`group flex items-stretch rounded-2xl border bg-white transition hover:shadow-sm ${
                  item.desistencia ? "border-red-200 bg-red-50/30" : "border-slate-200"
                }`}
              >
                {/* Order indicator */}
                <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-l-2xl border-r border-slate-100 bg-slate-50">
                  <GripVertical className="mb-0.5 h-3.5 w-3.5 text-slate-300" />
                  <span className="text-lg font-extrabold leading-none text-slate-900">
                    {item.ordem_apresentacao}
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold text-slate-400">ordem</span>
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">
                        #{String(item.n_inscricao).padStart(2, "0")}
                      </span>
                      <span className={`text-sm font-bold ${item.desistencia ? "text-red-600 line-through" : "text-slate-900"}`}>
                        {item.nome_coreografia}
                      </span>
                      {item.desistencia && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                          Desistencia
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span>{item.escola}</span>
                      <span className="text-slate-300">|</span>
                      <span>{item.modalidade}</span>
                      <span className="text-slate-300">|</span>
                      <span>{item.categoria} - {item.subcategoria}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-sky-600"
                      onClick={() => openEditModal(item)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(item._id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="Nenhuma coreografia cadastrada"
          description="Cadastre a primeira inscricao deste evento para estruturar ordem, chamada e notas."
          action={
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              Criar coreografia
            </button>
          }
        />
      )}

      <Modal
        open={modalOpen}
        title={editingItem ? "Editar coreografia" : "Nova coreografia"}
        description="Use os mesmos dados da ficha tecnica que serao mostrados aos jurados."
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Numero de inscricao">
              <input
                className="input"
                value={form.n_inscricao}
                onChange={(event) => setForm((current) => ({ ...current, n_inscricao: event.target.value }))}
                required
              />
            </Field>
            <Field label="Ordem de apresentacao">
              <input
                type="number"
                min="1"
                className="input"
                value={form.ordem_apresentacao}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ordem_apresentacao: event.target.value }))
                }
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Modalidade">
              <input
                className="input"
                value={form.modalidade}
                onChange={(event) => setForm((current) => ({ ...current, modalidade: event.target.value }))}
                required
              />
            </Field>
            <Field label="Categoria">
              <input
                className="input"
                value={form.categoria}
                onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Subcategoria">
              <input
                className="input"
                value={form.subcategoria}
                onChange={(event) => setForm((current) => ({ ...current, subcategoria: event.target.value }))}
                required
              />
            </Field>
            <Field label="Escola">
              <input
                className="input"
                value={form.escola}
                onChange={(event) => setForm((current) => ({ ...current, escola: event.target.value }))}
                required
              />
            </Field>
          </div>

          <Field label="Nome da coreografia">
            <input
              className="input"
              value={form.nome_coreografia}
              onChange={(event) => setForm((current) => ({ ...current, nome_coreografia: event.target.value }))}
              required
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Release">
              <textarea
                className="input min-h-28"
                value={form.release}
                onChange={(event) => setForm((current) => ({ ...current, release: event.target.value }))}
              />
            </Field>
            <Field label="Elenco">
              <textarea
                className="input min-h-28"
                value={form.elenco}
                onChange={(event) => setForm((current) => ({ ...current, elenco: event.target.value }))}
              />
            </Field>
          </div>

          {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar coreografia"}
            </button>
          </div>
        </form>
      </Modal>

      <ImportChoreographiesModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={async (items) => {
          const result = await choreographiesApi.import(eventId, items);
          await loadData();
          return result;
        }}
      />
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
