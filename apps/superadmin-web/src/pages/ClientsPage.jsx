import { Eye, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { clientsApi } from "../api/client";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { getErrorMessage } from "../lib/httpError";
import { APP_ROUTES } from "../lib/routes";
import { clientStatusLabel, formatDate, toDateInputValue } from "../lib/utils";

const initialForm = {
  nome_empresa: "",
  nome_responsavel: "",
  email_login: "",
  senha_login: "",
  plano: "basico",
  limite_eventos: 0,
  data_expiracao: "",
  status: "ativo"
};

const pageSize = 8;

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    setError("");

    try {
      const response = await clientsApi.list();
      setClients(response);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Nao foi possivel carregar os clientes."));
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingClient(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(client) {
    setEditingClient(client);
    setForm({
      nome_empresa: client.nome_empresa,
      nome_responsavel: client.nome_responsavel,
      email_login: client.email_login,
      senha_login: "",
      plano: client.plano,
      limite_eventos: client.limite_eventos,
      data_expiracao: toDateInputValue(client.data_expiracao),
      status: client.status
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
        limite_eventos: Number(form.limite_eventos),
        data_expiracao: form.data_expiracao || null
      };

      if (!editingClient && !payload.senha_login) {
        throw new Error("senha_login is required");
      }

      if (editingClient) {
        await clientsApi.update(editingClient._id, payload);
      } else {
        await clientsApi.create(payload);
      }

      setModalOpen(false);
      await loadClients();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Nao foi possivel salvar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(client) {
    await clientsApi.toggleStatus(client._id);
    await loadClients();
  }

  async function handleDelete(client) {
    if (!window.confirm(`Excluir ${client.nome_empresa}?`)) {
      return;
    }

    await clientsApi.remove(client._id);
    await loadClients();
  }

  const totalPages = Math.max(Math.ceil(clients.length / pageSize), 1);
  const paginatedClients = useMemo(
    () => clients.slice((page - 1) * pageSize, page * pageSize),
    [clients, page]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clientes"
        title="Gestao de tenants"
        description="Cadastre, edite e controle acesso dos clientes da plataforma."
        actions={
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </button>
        }
      />

      {loading ? (
        <LoadingState label="Carregando clientes..." />
      ) : clients.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/80 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Empresa</th>
                  <th className="px-6 py-4 font-semibold">Responsavel</th>
                  <th className="px-6 py-4 font-semibold">Plano</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Criado em</th>
                  <th className="px-6 py-4 text-right font-semibold">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedClients.map((client) => (
                  <tr key={client._id} className="bg-white">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{client.nome_empresa}</p>
                      <p className="mt-1 text-slate-500">{client.email_login}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{client.nome_responsavel}</td>
                    <td className="px-6 py-4 text-slate-700">{client.plano}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          client.status === "ativo"
                            ? "bg-emerald-50 text-emerald-700"
                            : client.status === "bloqueado"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {clientStatusLabel(client.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{formatDate(client.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link to={APP_ROUTES.clientDetail(client._id)} className="btn-secondary">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Link>
                        <button type="button" className="btn-secondary" onClick={() => openEditModal(client)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => handleToggleStatus(client)}>
                          <Power className="mr-2 h-4 w-4" />
                          {client.status === "bloqueado" ? "Desbloquear" : "Bloquear"}
                        </button>
                        <button type="button" className="btn-danger" onClick={() => handleDelete(client)}>
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

          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <p className="text-sm text-slate-500">
              Pagina {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => setPage((current) => current - 1)} disabled={page === 1}>
                Anterior
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPage((current) => current + 1)}
                disabled={page === totalPages}
              >
                Proxima
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description={
            error || "Crie o primeiro tenant para iniciar a operacao da plataforma."
          }
          action={
            <button type="button" className="btn-primary" onClick={openCreateModal}>
              Criar cliente
            </button>
          }
        />
      )}

      {!loading && error && clients.length ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <Modal
        open={modalOpen}
        title={editingClient ? "Editar cliente" : "Novo cliente"}
        description="Cadastre os dados da empresa e do login administrador."
        onClose={() => setModalOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome empresa">
              <input
                className="input"
                value={form.nome_empresa}
                onChange={(event) => setForm((current) => ({ ...current, nome_empresa: event.target.value }))}
                required
              />
            </Field>
            <Field label="Nome responsavel">
              <input
                className="input"
                value={form.nome_responsavel}
                onChange={(event) => setForm((current) => ({ ...current, nome_responsavel: event.target.value }))}
                required
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="E-mail login">
              <input
                type="email"
                className="input"
                value={form.email_login}
                onChange={(event) => setForm((current) => ({ ...current, email_login: event.target.value }))}
                required
              />
            </Field>
            <Field label={editingClient ? "Nova senha login" : "Senha login"}>
              <input
                type="password"
                className="input"
                value={form.senha_login}
                onChange={(event) => setForm((current) => ({ ...current, senha_login: event.target.value }))}
                required={!editingClient}
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Plano">
              <input
                className="input"
                value={form.plano}
                onChange={(event) => setForm((current) => ({ ...current, plano: event.target.value }))}
              />
            </Field>
            <Field label="Limite eventos">
              <input
                type="number"
                min="0"
                className="input"
                value={form.limite_eventos}
                onChange={(event) => setForm((current) => ({ ...current, limite_eventos: event.target.value }))}
              />
            </Field>
            <Field label="Expiracao">
              <input
                type="date"
                className="input"
                value={form.data_expiracao}
                onChange={(event) => setForm((current) => ({ ...current, data_expiracao: event.target.value }))}
              />
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="ativo">Ativo</option>
                <option value="bloqueado">Bloqueado</option>
                <option value="expirado">Expirado</option>
              </select>
            </Field>
          </div>
          {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar cliente"}
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
