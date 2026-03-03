import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { choreographiesApi, eventsApi } from "../api/client";
import EventTabs from "../components/EventTabs";
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
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nova coreografia
          </button>
        }
      />

      <EventTabs eventId={eventId} />

      {items.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Inscricao</th>
                  <th className="px-6 py-4 font-semibold">Coreografia</th>
                  <th className="px-6 py-4 font-semibold">Categoria</th>
                  <th className="px-6 py-4 font-semibold">Ordem</th>
                  <th className="px-6 py-4 text-right font-semibold">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items
                  .slice()
                  .sort((left, right) => left.ordem_apresentacao - right.ordem_apresentacao)
                  .map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.n_inscricao}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{item.nome_coreografia}</p>
                        <p className="mt-1 text-slate-500">{item.escola}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {item.modalidade} - {item.categoria} - {item.subcategoria}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.ordem_apresentacao}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" className="btn-secondary" onClick={() => openEditModal(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </button>
                          <button type="button" className="btn-danger" onClick={() => handleDelete(item._id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
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
