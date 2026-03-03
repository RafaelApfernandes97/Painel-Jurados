import { Pencil, Plus, Trash2 } from "lucide-react";
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
  status: "ativo"
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
      status: eventItem.status || "ativo"
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
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Evento</th>
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Modulos</th>
                  <th className="px-6 py-4 text-right font-semibold">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedEvents.map((eventItem) => (
                  <tr key={eventItem._id} className="bg-white">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{eventItem.nome}</p>
                      <p className="mt-1 text-slate-500">{eventItem.local}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(eventItem.data, { withTime: true })}</td>
                    <td className="px-6 py-4">
                      <StatusPill label={eventStatusLabel(eventItem.status)} tone={eventItem.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/events/${eventItem._id}/coreographies`} className="btn-secondary">
                          Coreografias
                        </Link>
                        <Link to={`/events/${eventItem._id}/judges`} className="btn-secondary">
                          Jurados
                        </Link>
                        <Link to={`/events/${eventItem._id}/order`} className="btn-secondary">
                          Ordem
                        </Link>
                        <Link to={`/events/${eventItem._id}/live`} className="btn-secondary">
                          Ao vivo
                        </Link>
                        <Link to={`/events/${eventItem._id}/results`} className="btn-secondary">
                          Resultados
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="btn-secondary" onClick={() => openEditModal(eventItem)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </button>
                        <button type="button" className="btn-danger" onClick={() => handleDelete(eventItem._id)}>
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
