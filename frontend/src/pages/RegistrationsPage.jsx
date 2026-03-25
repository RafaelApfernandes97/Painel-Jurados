import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  DollarSign,
  Eye,
  Filter,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { eventsApi, registrationsApi } from "../api/client";

import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";

const STATUS_PAGAMENTO_LABELS = {
  pendente: "Pendente",
  parcial: "Parcial",
  pago: "Pago",
  isento: "Isento"
};

const STATUS_INSCRICAO_LABELS = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  reprovada: "Reprovada"
};

const STATUS_COLORS = {
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  parcial: "bg-orange-50 text-orange-700 border-orange-200",
  pago: "bg-emerald-50 text-emerald-700 border-emerald-200",
  isento: "bg-slate-50 text-slate-600 border-slate-200",
  aprovada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reprovada: "bg-red-50 text-red-700 border-red-200"
};

const PAYMENT_METHODS = [
  { value: "pix", label: "PIX" },
  { value: "transferencia", label: "Transferencia" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartao" },
  { value: "outro", label: "Outro" }
];

export default function RegistrationsPage() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [eventItem, setEventItem] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ valor: "", metodo: "pix", observacao: "" });
  const [updating, setUpdating] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);
    try {
      const [events, regs] = await Promise.all([
        eventsApi.list(),
        registrationsApi.list(eventId)
      ]);
      setEventItem(events.find((e) => e._id === eventId) || null);
      setRegistrations(regs);
    } finally {
      setLoading(false);
    }
  }

  const filteredRegistrations = useMemo(() => {
    let items = registrations;

    if (statusFilter) {
      items = items.filter(
        (r) =>
          r.status_inscricao === statusFilter ||
          r.status_pagamento === statusFilter
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((r) => {
        const coreoMatch = (r.coreografias || []).some(
          (c) =>
            (c.nome_coreografia || "").toLowerCase().includes(q) ||
            (c.modalidade || "").toLowerCase().includes(q) ||
            (c.categoria || "").toLowerCase().includes(q)
        );
        return (
          (r.nome_escola || "").toLowerCase().includes(q) ||
          (r.nome_responsavel || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          coreoMatch
        );
      });
    }

    return items;
  }, [registrations, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const totalCoreos = registrations.reduce((sum, r) => sum + (r.coreografias || []).length, 0);
    const aprovadas = registrations.filter((r) => r.status_inscricao === "aprovada").length;
    const receitaTotal = registrations.reduce((sum, r) => sum + (r.valor_total || 0), 0);
    const totalPago = registrations.reduce((sum, r) => sum + (r.valor_pago || 0), 0);
    return { total, totalCoreos, aprovadas, receitaTotal, totalPago };
  }, [registrations]);

  async function handleUpdateStatus(id, field, value) {
    setUpdating(id);
    try {
      const updated = await registrationsApi.update(id, { [field]: value });
      setRegistrations((prev) => prev.map((r) => (r._id === id ? updated : r)));
      if (detailsItem?._id === id) setDetailsItem(updated);
    } finally {
      setUpdating("");
    }
  }

  async function handleApproveAndConvert(id) {
    if (!window.confirm("Aprovar esta inscricao e converter todas as coreografias?")) return;
    setUpdating(id);
    try {
      const { registration } = await registrationsApi.approve(id);
      setRegistrations((prev) => prev.map((r) => (r._id === id ? registration : r)));
      if (detailsItem?._id === id) setDetailsItem(registration);
    } finally {
      setUpdating("");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Excluir esta inscricao?")) return;
    await registrationsApi.remove(id);
    setRegistrations((prev) => prev.filter((r) => r._id !== id));
    if (detailsItem?._id === id) {
      setDetailsOpen(false);
      setDetailsItem(null);
    }
  }

  function openPaymentModal(reg) {
    setPaymentTarget(reg);
    setPaymentForm({ valor: "", metodo: "pix", observacao: "" });
    setPaymentModal(true);
  }

  async function handleSubmitPayment(e) {
    e.preventDefault();
    if (!paymentTarget) return;
    setUpdating(paymentTarget._id);
    try {
      const { registration } = await registrationsApi.registerPayment(paymentTarget._id, {
        valor: Number(paymentForm.valor),
        metodo: paymentForm.metodo,
        observacao: paymentForm.observacao
      });
      setRegistrations((prev) => prev.map((r) => (r._id === registration._id ? registration : r)));
      if (detailsItem?._id === registration._id) setDetailsItem(registration);
      setPaymentModal(false);
    } finally {
      setUpdating("");
    }
  }

  function copyPublicLink() {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/inscricao/${eventId}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function fmtDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function fmtMoney(val) {
    return `R$ ${(val || 0).toFixed(2)}`;
  }

  function hasConvertedCoreos(reg) {
    return (reg.coreografias || []).some((c) => c.choreographyId);
  }

  if (loading) {
    return <LoadingState label="Carregando inscricoes..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evento"
        title={eventItem ? `${eventItem.nome} - Inscricoes` : "Inscricoes"}
        description="Gerencie inscricoes, financeiro e converta em coreografias."
        actions={
          <button type="button" className="btn-primary" onClick={copyPublicLink}>
            <ClipboardCopy className="mr-2 h-4 w-4" />
            {linkCopied ? "Link copiado!" : "Copiar link de inscricao"}
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard value={stats.total} label="Inscricoes" />
        <StatCard value={stats.totalCoreos} label="Coreografias" />
        <StatCard value={stats.aprovadas} label="Aprovadas" color="emerald" />
        <StatCard value={fmtMoney(stats.receitaTotal)} label="Receita total" color="sky" isText />
        <StatCard value={fmtMoney(stats.totalPago)} label="Total pago" color="emerald" isText />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Buscar por escola, responsavel, email, coreografia..."
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
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          {[
            { key: "", label: "Todas" },
            { key: "pendente", label: "Pendentes" },
            { key: "aprovada", label: "Aprovadas" },
            { key: "pago", label: "Pagas" }
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                statusFilter === f.key
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredRegistrations.length > 0 ? (
        <div className="space-y-2">
          {filteredRegistrations.map((reg) => {
            const isExpanded = expandedId === reg._id;
            const coreos = reg.coreografias || [];
            const valorPendente = Math.max(0, (reg.valor_total || 0) - (reg.valor_pago || 0));

            return (
              <div key={reg._id} className="rounded-2xl border border-slate-200 bg-white transition hover:shadow-sm">
                {/* Main row */}
                <div className="flex items-stretch">
                  <div
                    className={`flex w-2 shrink-0 rounded-l-2xl ${
                      reg.status_inscricao === "aprovada" ? "bg-emerald-500"
                      : reg.status_inscricao === "reprovada" ? "bg-red-500"
                      : "bg-amber-400"
                    }`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{reg.nome_escola}</span>
                        <span className="text-xs text-slate-500">({coreos.length} coreo{coreos.length !== 1 ? "s" : ""})</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[reg.status_inscricao]}`}>
                          {STATUS_INSCRICAO_LABELS[reg.status_inscricao]}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[reg.status_pagamento]}`}>
                          {STATUS_PAGAMENTO_LABELS[reg.status_pagamento]}
                        </span>
                        {hasConvertedCoreos(reg) && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">Convertida</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span>{reg.nome_responsavel}</span>
                        <span className="text-slate-300">|</span>
                        <span>{reg.email}</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold text-slate-700">{fmtMoney(reg.valor_total)}</span>
                        {valorPendente > 0 && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="font-semibold text-amber-600">Pendente: {fmtMoney(valorPendente)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
                        onClick={() => setExpandedId(isExpanded ? null : reg._id)}
                        title={isExpanded ? "Recolher" : "Expandir coreografias"}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-600"
                        onClick={() => { setDetailsItem(reg); setDetailsOpen(true); }}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {reg.status_pagamento !== "pago" && reg.status_pagamento !== "isento" && (
                        <button
                          type="button"
                          className="rounded-xl border border-emerald-200 bg-white p-2 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => openPaymentModal(reg)}
                          title="Registrar pagamento"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                      )}
                      {!hasConvertedCoreos(reg) && reg.status_inscricao !== "aprovada" && (
                        <button
                          type="button"
                          className="rounded-xl border border-emerald-200 bg-white p-2 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleApproveAndConvert(reg._id)}
                          disabled={updating === reg._id}
                          title="Aprovar e converter"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(reg._id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded choreographies */}
                {isExpanded && coreos.length > 0 && (
                  <div className="border-t border-slate-100 px-6 py-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Coreografias</p>
                    <div className="space-y-1.5">
                      {coreos.map((c, i) => (
                        <div key={c._id || i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <div>
                            <span className="font-semibold text-slate-900">{c.nome_coreografia}</span>
                            <span className="ml-2 text-xs text-slate-500">
                              {c.modalidade} - {c.categoria} - {c.subcategoria}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{c.quantidade_bailarinos} bailarino{c.quantidade_bailarinos !== 1 ? "s" : ""}</span>
                            {c.valor_calculado > 0 && (
                              <span className="font-semibold text-slate-700">{fmtMoney(c.valor_calculado)}</span>
                            )}
                            {c.choreographyId && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">Convertida</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : registrations.length > 0 ? (
        <EmptyState title="Nenhuma inscricao encontrada" description="Tente ajustar a busca ou o filtro." />
      ) : (
        <EmptyState
          title="Nenhuma inscricao recebida"
          description="Compartilhe o link de inscricao para comecar a receber inscricoes."
          action={
            <button type="button" className="btn-primary" onClick={copyPublicLink}>
              Copiar link de inscricao
            </button>
          }
        />
      )}

      {/* ── Details modal ── */}
      <Modal
        open={detailsOpen}
        title="Detalhes da inscricao"
        description={detailsItem ? detailsItem.nome_escola : ""}
        onClose={() => { setDetailsOpen(false); setDetailsItem(null); }}
      >
        {detailsItem && (
          <div className="space-y-5">
            {/* Contact */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Contato</p>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <InfoRow label="Responsavel" value={detailsItem.nome_responsavel} />
                <InfoRow label="Email" value={detailsItem.email} />
                <InfoRow label="WhatsApp" value={detailsItem.whatsapp} />
                <InfoRow label="Escola" value={detailsItem.nome_escola} />
              </div>
            </div>

            {/* Choreographies */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Coreografias ({(detailsItem.coreografias || []).length})
              </p>
              <div className="space-y-2">
                {(detailsItem.coreografias || []).map((c, i) => (
                  <div key={c._id || i} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{c.nome_coreografia}</span>
                      <span className="text-xs text-slate-500">{c.quantidade_bailarinos} bailarino(s)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {c.modalidade} - {c.categoria} - {c.subcategoria}
                      {c.musica && <span className="ml-2">| Musica: {c.musica}</span>}
                      {c.coreografo && <span className="ml-2">| Coreografo: {c.coreografo}</span>}
                    </div>
                    {c.valor_calculado > 0 && (
                      <span className="mt-1 inline-block text-xs font-semibold text-slate-700">{fmtMoney(c.valor_calculado)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial */}
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-400">Financeiro</p>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <InfoRow label="Subtotal" value={fmtMoney(detailsItem.valor_subtotal)} />
                <InfoRow label="Taxas" value={fmtMoney(detailsItem.valor_taxas)} />
                <InfoRow label="Desconto" value={fmtMoney(detailsItem.valor_desconto)} />
                <InfoRow label="Total" value={fmtMoney(detailsItem.valor_total)} bold />
                <InfoRow label="Pago" value={fmtMoney(detailsItem.valor_pago)} />
                <InfoRow
                  label="Pendente"
                  value={fmtMoney(Math.max(0, (detailsItem.valor_total || 0) - (detailsItem.valor_pago || 0)))}
                  bold
                />
              </div>
              {(detailsItem.pagamentos || []).length > 0 && (
                <div className="mt-3 border-t border-sky-200 pt-2">
                  <p className="mb-1 text-xs font-semibold text-sky-600">Historico de pagamentos</p>
                  {detailsItem.pagamentos.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-600">
                      <span>{fmtDate(p.data)} - {p.metodo.toUpperCase()}</span>
                      <span className="font-semibold">{fmtMoney(p.valor)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status management */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Gerenciamento</p>
              <div className="space-y-3">
                <StatusRow
                  label="Pagamento"
                  current={detailsItem.status_pagamento}
                  options={["pendente", "parcial", "pago", "isento"]}
                  labels={STATUS_PAGAMENTO_LABELS}
                  onChange={(val) => handleUpdateStatus(detailsItem._id, "status_pagamento", val)}
                  disabled={updating === detailsItem._id}
                />
                <StatusRow
                  label="Inscricao"
                  current={detailsItem.status_inscricao}
                  options={["pendente", "aprovada", "reprovada"]}
                  labels={STATUS_INSCRICAO_LABELS}
                  onChange={(val) => handleUpdateStatus(detailsItem._id, "status_inscricao", val)}
                  disabled={updating === detailsItem._id}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3">
              <button type="button" className="btn-danger" onClick={() => handleDelete(detailsItem._id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </button>
              <div className="flex gap-2">
                {detailsItem.status_pagamento !== "pago" && detailsItem.status_pagamento !== "isento" && (
                  <button type="button" className="btn-secondary" onClick={() => openPaymentModal(detailsItem)}>
                    <DollarSign className="mr-2 h-4 w-4" /> Registrar pagamento
                  </button>
                )}
                {!hasConvertedCoreos(detailsItem) && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleApproveAndConvert(detailsItem._id)}
                    disabled={updating === detailsItem._id}
                  >
                    <Check className="mr-2 h-4 w-4" /> Aprovar e converter
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Payment modal ── */}
      <Modal
        open={paymentModal}
        title="Registrar pagamento"
        description={paymentTarget ? `${paymentTarget.nome_escola} - Pendente: ${fmtMoney(Math.max(0, (paymentTarget.valor_total || 0) - (paymentTarget.valor_pago || 0)))}` : ""}
        onClose={() => setPaymentModal(false)}
      >
        <form className="space-y-4" onSubmit={handleSubmitPayment}>
          <label className="block">
            <span className="label">Valor (R$)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input"
              value={paymentForm.valor}
              onChange={(e) => setPaymentForm((c) => ({ ...c, valor: e.target.value }))}
              required
            />
          </label>
          <label className="block">
            <span className="label">Metodo</span>
            <select
              className="input"
              value={paymentForm.metodo}
              onChange={(e) => setPaymentForm((c) => ({ ...c, metodo: e.target.value }))}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Observacao</span>
            <input
              className="input"
              value={paymentForm.observacao}
              onChange={(e) => setPaymentForm((c) => ({ ...c, observacao: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setPaymentModal(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={updating === paymentTarget?._id}>
              {updating ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ value, label, color, isText }) {
  const colors = {
    emerald: "border-emerald-200 bg-emerald-50",
    sky: "border-sky-200 bg-sky-50",
    amber: "border-amber-200 bg-amber-50"
  };
  const textColors = {
    emerald: "text-emerald-700",
    sky: "text-sky-700",
    amber: "text-amber-700"
  };
  const cls = color ? colors[color] : "border-slate-200 bg-white";
  const txtCls = color ? textColors[color] : "text-slate-900";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${cls}`}>
      <p className={`${isText ? "text-lg" : "text-2xl"} font-extrabold ${txtCls}`}>{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function InfoRow({ label, value, bold }) {
  return (
    <div>
      <span className="font-semibold text-slate-500">{label}:</span>{" "}
      <span className={bold ? "font-bold text-slate-900" : "text-slate-900"}>{value}</span>
    </div>
  );
}

function StatusRow({ label, current, options, labels, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex gap-1.5">
        {options.map((s) => (
          <button
            key={s}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              current === s
                ? STATUS_COLORS[s] + " border"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
            onClick={() => onChange(s)}
            disabled={disabled}
          >
            {labels[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
