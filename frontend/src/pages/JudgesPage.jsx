import { Copy, Link2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { eventsApi, judgesApi } from "../api/client";
import EventTabs from "../components/EventTabs";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import StatusPill from "../components/ui/StatusPill";

const initialForm = {
  nome: "",
  telefone: "",
  ativo: true
};

export default function JudgesPage() {
  const { eventId } = useParams();
  const juryBaseUrl = (import.meta.env.VITE_JURY_URL || "http://localhost:5174/jury").replace(/\/+$/, "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventItem, setEventItem] = useState(null);
  const [judges, setJudges] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);

    try {
      const [events, judgesList] = await Promise.all([eventsApi.list(), judgesApi.list(eventId)]);
      setEventItem(events.find((event) => event._id === eventId) || null);
      setJudges(judgesList);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await judgesApi.create(eventId, form);
      setGeneratedLink(response.accessLink);
      setForm(initialForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Nao foi possivel cadastrar o jurado.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(value) {
    await navigator.clipboard.writeText(value);
  }

  if (loading) {
    return <LoadingState label="Carregando jurados..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evento"
        title={eventItem ? `${eventItem.nome} - Jurados` : "Jurados"}
        description="Cadastre jurados sem senha. Cada um recebe um link magico unico para acesso."
      />

      <EventTabs eventId={eventId} />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <h3 className="text-lg font-bold text-slate-950">Cadastrar jurado</h3>
          <p className="mt-1 text-sm text-slate-500">O acesso e feito apenas pelo link magico.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Field label="Nome">
              <input
                className="input"
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                required
              />
            </Field>
            <Field label="Telefone">
              <input
                className="input"
                value={form.telefone}
                onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))}
                required
              />
            </Field>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))}
              />
              Jurado ativo
            </label>
            {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              <Plus className="mr-2 h-4 w-4" />
              {saving ? "Cadastrando..." : "Cadastrar jurado"}
            </button>
          </form>

          {generatedLink ? (
            <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 p-4">
              <p className="text-sm font-semibold text-brand-700">Link magico gerado</p>
              <p className="mt-2 break-all text-sm text-slate-700">{generatedLink}</p>
              <button type="button" className="btn-secondary mt-4" onClick={() => copyLink(generatedLink)}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar link
              </button>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Jurados cadastrados</h3>
              <p className="text-sm text-slate-500">Acompanhe o status de acesso e copie links novamente.</p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {judges.length} jurados
            </div>
          </div>

          {judges.length ? (
            <div className="space-y-3">
              {judges.map((judge) => {
                const accessLink = `${juryBaseUrl}/${judge.token_acesso}`;

                return (
                  <div key={judge._id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{judge.nome}</p>
                        <p className="mt-1 text-sm text-slate-500">{judge.telefone}</p>
                      </div>
                      <StatusPill label={judge.ativo ? "Ativo" : "Inativo"} tone={judge.ativo ? "ativo" : "bloqueado"} />
                    </div>
                    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Link magico</p>
                        <p className="mt-1 truncate text-sm text-slate-700">{accessLink}</p>
                      </div>
                      <button type="button" className="btn-secondary" onClick={() => copyLink(accessLink)}>
                        <Link2 className="mr-2 h-4 w-4" />
                        Copiar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nenhum jurado cadastrado"
              description="Cadastre jurados neste evento para liberar acesso imediato a avaliacao."
            />
          )}
        </Card>
      </div>
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
