import { Filter, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { blocksApi, choreographiesApi, eventsApi } from "../api/client";

import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";

const initialBlockForm = { nome: "", ordem: "" };

export default function BlocksPage() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventItem, setEventItem] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [choreographies, setChoreographies] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [form, setForm] = useState(initialBlockForm);
  const [error, setError] = useState("");
  const [assigningBlockId, setAssigningBlockId] = useState(null);

  // Assign modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetBlock, setAssignTargetBlock] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);
    try {
      const [events, blockList, choreographyList] = await Promise.all([
        eventsApi.list(),
        blocksApi.list(eventId),
        choreographiesApi.list(eventId)
      ]);
      setEventItem(events.find((e) => e._id === eventId) || null);
      setBlocks(blockList);
      setChoreographies(choreographyList.sort((a, b) => a.ordem_apresentacao - b.ordem_apresentacao));
    } finally {
      setLoading(false);
    }
  }

  // Block CRUD
  function openCreateModal() {
    setEditingBlock(null);
    setForm({ nome: "", ordem: String(blocks.length + 1) });
    setError("");
    setModalOpen(true);
  }

  function openEditModal(block) {
    setEditingBlock(block);
    setForm({ nome: block.nome, ordem: String(block.ordem) });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmitBlock(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { nome: form.nome, ordem: Number(form.ordem) };
      if (editingBlock) {
        await blocksApi.update(editingBlock._id, payload);
      } else {
        await blocksApi.create(eventId, payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao salvar bloco.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBlock(blockId) {
    if (!window.confirm("Excluir este bloco? As coreografias serao desvinculadas.")) return;
    await blocksApi.remove(blockId);
    await loadData();
  }

  // Assignment helpers
  function getBlockChoreographies(blockId) {
    return choreographies.filter((c) => c.blockId === blockId);
  }

  const unassigned = useMemo(
    () => choreographies.filter((c) => !c.blockId),
    [choreographies]
  );

  const unassignedCategories = useMemo(() => {
    const cats = new Set(unassigned.map((c) => c.categoria).filter(Boolean));
    return [...cats].sort();
  }, [unassigned]);

  const filteredUnassigned = useMemo(
    () => (categoryFilter ? unassigned.filter((c) => c.categoria === categoryFilter) : unassigned),
    [unassigned, categoryFilter]
  );

  async function removeFromBlock(choreographyId, blockId) {
    const current = getBlockChoreographies(blockId);
    const newIds = current.filter((c) => c._id !== choreographyId).map((c) => c._id);
    setAssigningBlockId(blockId);
    try {
      const response = await blocksApi.assignChoreographies(eventId, blockId, newIds);
      setChoreographies(response.choreographies.sort((a, b) => a.ordem_apresentacao - b.ordem_apresentacao));
    } finally {
      setAssigningBlockId(null);
    }
  }

  // Assign modal
  function openAssignModal(block) {
    setAssignTargetBlock(block);
    setSelectedIds(new Set());
    setRangeFrom("");
    setRangeTo("");
    setCategoryFilter("");
    setAssignModalOpen(true);
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredUnassigned.map((c) => c._id)));
  }

  function selectNone() {
    setSelectedIds(new Set());
  }

  function selectRange() {
    const from = Number(rangeFrom);
    const to = Number(rangeTo);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return;

    const inRange = filteredUnassigned.filter((c) => {
      const num = Number(c.n_inscricao);
      return Number.isFinite(num) && num >= from && num <= to;
    });

    setSelectedIds((prev) => {
      const next = new Set(prev);
      inRange.forEach((c) => next.add(c._id));
      return next;
    });
  }

  async function confirmAssign() {
    if (!assignTargetBlock || selectedIds.size === 0) return;

    const current = getBlockChoreographies(assignTargetBlock._id);
    const currentIds = current.map((c) => c._id);
    const allIds = [...currentIds, ...selectedIds];

    setAssigningBlockId(assignTargetBlock._id);
    try {
      const response = await blocksApi.assignChoreographies(eventId, assignTargetBlock._id, allIds);
      setChoreographies(response.choreographies.sort((a, b) => a.ordem_apresentacao - b.ordem_apresentacao));
      setAssignModalOpen(false);
    } finally {
      setAssigningBlockId(null);
    }
  }

  if (loading) {
    return <LoadingState label="Carregando blocos..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evento"
        title={eventItem ? `${eventItem.nome} - Blocos` : "Blocos"}
        description="Organize as coreografias em blocos de apresentacao."
        actions={
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Novo bloco
          </button>
        }
      />


      {/* Unassigned summary */}
      {unassigned.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Sem bloco ({unassigned.length})</h3>
              <p className="text-sm text-slate-500">
                Inscricoes de #{String(unassigned[0]?.n_inscricao).padStart(2, "0")} a #{String(unassigned[unassigned.length - 1]?.n_inscricao).padStart(2, "0")} sem bloco atribuido.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unassigned.map((c) => (
              <span
                key={c._id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600"
              >
                #{String(c.n_inscricao).padStart(2, "0")}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Blocks */}
      {blocks.length ? (
        <div className="space-y-4">
          {blocks.map((block) => {
            const blockChoreographies = getBlockChoreographies(block._id);
            const sorted = blockChoreographies.slice().sort((a, b) => a.ordem_apresentacao - b.ordem_apresentacao);
            const first = sorted[0];
            const last = sorted[sorted.length - 1];

            return (
              <Card key={block._id}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{block.nome}</h3>
                    <p className="text-sm text-slate-500">
                      {blockChoreographies.length > 0
                        ? `${blockChoreographies.length} coreografias (inscricoes #${String(first.n_inscricao).padStart(2, "0")} a #${String(last.n_inscricao).padStart(2, "0")})`
                        : "Nenhuma coreografia"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary text-sm"
                      onClick={() => openAssignModal(block)}
                      disabled={unassigned.length === 0}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Adicionar coreografias
                    </button>
                    <button type="button" className="btn-secondary text-sm" onClick={() => openEditModal(block)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Editar
                    </button>
                    <button type="button" className="btn-danger text-sm" onClick={() => handleDeleteBlock(block._id)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </div>

                {sorted.length > 0 ? (
                  <div className="space-y-1.5">
                    {sorted.map((c) => (
                      <div
                        key={c._id}
                        className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900">
                            #{String(c.n_inscricao).padStart(2, "0")}
                          </span>
                          <span className="ml-2 font-semibold text-slate-700">{c.nome_coreografia}</span>
                          <span className="ml-2 text-slate-500">{c.escola}</span>
                        </div>
                        <button
                          type="button"
                          className="ml-2 shrink-0 rounded-lg border border-slate-200 bg-white p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeFromBlock(c._id, block._id)}
                          disabled={assigningBlockId === block._id}
                          title="Remover do bloco"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Clique em "Adicionar coreografias" para atribuir inscricoes a este bloco.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Nenhum bloco criado"
          description="Crie blocos para organizar as coreografias em grupos de apresentacao."
          action={
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              Criar bloco
            </button>
          }
        />
      )}

      {/* Block create/edit modal */}
      <Modal
        open={modalOpen}
        title={editingBlock ? "Editar bloco" : "Novo bloco"}
        description="Defina o nome e a ordem do bloco de apresentacao."
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmitBlock}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">Nome do bloco</span>
              <input
                className="input"
                placeholder="Ex: Bloco 1"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                required
              />
            </label>
            <label className="block">
              <span className="label">Ordem</span>
              <input
                type="number"
                min="1"
                className="input"
                value={form.ordem}
                onChange={(e) => setForm((f) => ({ ...f, ordem: e.target.value }))}
                required
              />
            </label>
          </div>

          {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar bloco"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign choreographies modal */}
      <Modal
        open={assignModalOpen}
        title={`Adicionar coreografias - ${assignTargetBlock?.nome || ""}`}
        description="Selecione individualmente ou use o intervalo de inscricoes."
        onClose={() => setAssignModalOpen(false)}
      >
        <div className="space-y-5">
          {/* Range selector */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">Selecionar por intervalo de inscricao</p>
            <div className="flex items-end gap-3">
              <label className="block flex-1">
                <span className="text-xs font-semibold text-slate-500">De (inscricao)</span>
                <input
                  type="number"
                  min="1"
                  className="input mt-1"
                  placeholder="1"
                  value={rangeFrom}
                  onChange={(e) => setRangeFrom(e.target.value)}
                />
              </label>
              <label className="block flex-1">
                <span className="text-xs font-semibold text-slate-500">Ate (inscricao)</span>
                <input
                  type="number"
                  min="1"
                  className="input mt-1"
                  placeholder="20"
                  value={rangeTo}
                  onChange={(e) => setRangeTo(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn-secondary shrink-0"
                onClick={selectRange}
                disabled={!rangeFrom || !rangeTo}
              >
                Selecionar intervalo
              </button>
            </div>
          </div>

          {/* Category filter */}
          {unassignedCategories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Categoria:</span>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  categoryFilter === "" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                onClick={() => setCategoryFilter("")}
              >
                Todas
              </button>
              {unassignedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    categoryFilter === cat ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Bulk actions */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {selectedIds.size} de {filteredUnassigned.length} selecionadas
              {categoryFilter && <span className="ml-1 text-slate-400">({categoryFilter})</span>}
            </p>
            <div className="flex gap-2">
              <button type="button" className="text-sm font-semibold text-sky-600 hover:underline" onClick={selectAll}>
                Selecionar todas
              </button>
              <span className="text-slate-300">|</span>
              <button type="button" className="text-sm font-semibold text-slate-500 hover:underline" onClick={selectNone}>
                Limpar selecao
              </button>
            </div>
          </div>

          {/* Choreography checkboxes */}
          <div className="max-h-[40vh] space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {filteredUnassigned.length > 0 ? (
              filteredUnassigned.map((c) => {
                const checked = selectedIds.has(c._id);
                return (
                  <label
                    key={c._id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      checked ? "bg-sky-50 text-slate-900" : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={checked}
                      onChange={() => toggleSelected(c._id)}
                    />
                    <span className="font-bold">#{String(c.n_inscricao).padStart(2, "0")}</span>
                    <span className="flex-1 truncate font-medium">{c.nome_coreografia}</span>
                    <span className="shrink-0 text-xs text-slate-400">{c.categoria}</span>
                    <span className="shrink-0 text-xs text-slate-400">{c.escola}</span>
                  </label>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">
                {categoryFilter
                  ? `Nenhuma coreografia sem bloco na categoria "${categoryFilter}".`
                  : "Todas as coreografias ja estao em blocos."}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setAssignModalOpen(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={confirmAssign}
              disabled={selectedIds.size === 0 || assigningBlockId}
            >
              {assigningBlockId ? "Salvando..." : `Adicionar ${selectedIds.size} ao ${assignTargetBlock?.nome || "bloco"}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
