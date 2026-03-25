import { Award, Download, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { certificatesApi } from "../api/client";

import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";

export default function CertificatesPage() {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCert, setSelectedCert] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await certificatesApi.list(eventId);
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!data?.certificates) return [];
    if (!searchQuery.trim()) return data.certificates;
    const q = searchQuery.toLowerCase().trim();
    return data.certificates.filter(
      (c) =>
        c.nome_coreografia.toLowerCase().includes(q) ||
        c.escola.toLowerCase().includes(q) ||
        c.modalidade.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  function openPreview(cert) {
    setSelectedCert(cert);
    setPreviewOpen(true);
  }

  function printCertificate() {
    window.print();
  }

  function exportCSV() {
    if (!data?.certificates?.length) return;
    const headers = ["Colocacao", "Coreografia", "Escola", "Modalidade", "Categoria", "Subcategoria", "Bailarinos", "Media", "Palco"];
    const rows = data.certificates.map((c) => [
      c.colocacao,
      c.nome_coreografia,
      c.escola,
      c.modalidade,
      c.categoria,
      c.subcategoria,
      c.quantidade_bailarinos,
      c.media,
      c.palco || ""
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificados_${data.evento?.nome || "evento"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function fmtDate(dateStr) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  if (loading) {
    return <LoadingState label="Carregando certificados..." />;
  }

  if (!data || !data.certificates || data.certificates.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Evento" title="Certificados" />
        <EmptyState
          title="Nenhum certificado disponivel"
          description="Certificados sao gerados automaticamente apos as coreografias serem apresentadas."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evento"
        title={`${data.evento?.nome || "Evento"} - Certificados`}
        description={`${data.certificates.length} certificado(s) disponivel(is) para download.`}
        actions={
          <button type="button" className="btn-secondary" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </button>
        }
      />

      {/* Search */}
      <input
        type="text"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        placeholder="Buscar por coreografia, escola, modalidade..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Certificate list */}
      <div className="space-y-2">
        {filtered.map((cert) => (
          <div
            key={cert._id}
            className="flex items-stretch rounded-2xl border border-slate-200 bg-white hover:shadow-sm transition"
          >
            {/* Medal */}
            <div className={`flex w-16 shrink-0 items-center justify-center rounded-l-2xl text-lg font-extrabold ${
              cert.colocacao === 1 ? "bg-amber-100 text-amber-700"
              : cert.colocacao === 2 ? "bg-slate-200 text-slate-700"
              : cert.colocacao === 3 ? "bg-orange-100 text-orange-700"
              : "bg-slate-50 text-slate-500"
            }`}>
              {cert.colocacao <= 3 ? (
                <span className="flex flex-col items-center">
                  <Award className="h-5 w-5 mb-0.5" />
                  <span className="text-xs">{cert.colocacao}o</span>
                </span>
              ) : (
                <span>{cert.colocacao}o</span>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{cert.nome_coreografia}</span>
                  <span className="text-xs text-slate-500">#{cert.n_inscricao}</span>
                  {cert.palco && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                      {cert.palco}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                  <span>{cert.escola}</span>
                  <span className="text-slate-300">|</span>
                  <span>{cert.modalidade} - {cert.categoria} - {cert.subcategoria}</span>
                  <span className="text-slate-300">|</span>
                  <span>{cert.quantidade_bailarinos} bailarino(s)</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-semibold text-slate-700">Media: {cert.media}</span>
                </div>
              </div>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-600"
                onClick={() => openPreview(cert)}
                title="Visualizar certificado"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Certificate Preview Modal ── */}
      <Modal
        open={previewOpen}
        title="Pre-visualizacao do Certificado"
        onClose={() => { setPreviewOpen(false); setSelectedCert(null); }}
      >
        {selectedCert && (
          <div className="space-y-4">
            {/* Certificate card (printable) */}
            <div id="certificate-preview" className="rounded-2xl border-2 border-slate-300 bg-white p-8 text-center print:border-0">
              <div className="mb-4">
                <Award className="mx-auto h-12 w-12 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800">
                Certificado de Participacao
              </h2>
              <div className="my-4 h-px bg-slate-200" />
              <p className="text-sm text-slate-600">Certificamos que</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">{selectedCert.nome_coreografia}</p>
              <p className="mt-1 text-base font-semibold text-slate-700">{selectedCert.escola}</p>
              <div className="my-4 h-px bg-slate-200" />
              <p className="text-sm text-slate-600">
                participou do evento <strong>{data.evento?.nome}</strong>
              </p>
              <p className="text-sm text-slate-500">
                {data.evento?.local} - {fmtDate(data.evento?.data)}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-500">Modalidade</p>
                  <p className="text-sm font-bold text-slate-800">{selectedCert.modalidade}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Categoria</p>
                  <p className="text-sm font-bold text-slate-800">{selectedCert.categoria}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Colocacao</p>
                  <p className="text-sm font-bold text-slate-800">{selectedCert.colocacao}o lugar</p>
                </div>
              </div>
              {selectedCert.media > 0 && (
                <p className="mt-3 text-lg font-bold text-slate-900">Media: {selectedCert.media}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setPreviewOpen(false)}>
                Fechar
              </button>
              <button type="button" className="btn-primary" onClick={printCertificate}>
                <Download className="mr-2 h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
