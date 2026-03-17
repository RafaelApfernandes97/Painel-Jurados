import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

const CHOREOGRAPHY_FIELDS = [
  { key: "", label: "-- Ignorar coluna --" },
  { key: "n_inscricao", label: "Numero de inscricao (auto se vazio)" },
  { key: "nome_coreografia", label: "Nome da coreografia", required: true },
  { key: "modalidade", label: "Modalidade", required: true },
  { key: "categoria", label: "Categoria", required: true },
  { key: "subcategoria", label: "Subcategoria", required: true },
  { key: "escola", label: "Escola", required: true },
  { key: "ordem_apresentacao", label: "Ordem de apresentacao (auto se vazio)" },
  { key: "release", label: "Release" },
  { key: "elenco", label: "Elenco" }
];

const REQUIRED_KEYS = CHOREOGRAPHY_FIELDS.filter((f) => f.required).map((f) => f.key);

const STEP_UPLOAD = "upload";
const STEP_MAP = "map";
const STEP_PREVIEW = "preview";
const STEP_RESULT = "result";

export default function ImportChoreographiesModal({ open, onClose, onImport }) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(STEP_UPLOAD);
  const [fileName, setFileName] = useState("");
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbook, setWorkbook] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function reset() {
    setStep(STEP_UPLOAD);
    setFileName("");
    setSheetNames([]);
    setSelectedSheet("");
    setWorkbook(null);
    setHeaders([]);
    setRows([]);
    setColumnMap({});
    setImporting(false);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = XLSX.read(data, { type: "array" });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);

      if (wb.SheetNames.length === 1) {
        loadSheet(wb, wb.SheetNames[0]);
      } else {
        setSelectedSheet("");
        setStep(STEP_MAP);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function loadSheet(wb, name) {
    const ws = wb.Sheets[name];
    const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

    if (jsonData.length === 0) return;

    const headerRow = jsonData[0].map((h, i) => ({
      index: i,
      label: String(h || `Coluna ${i + 1}`).trim()
    }));

    const dataRows = jsonData.slice(1).filter((row) => row.some((cell) => cell !== ""));

    setHeaders(headerRow);
    setRows(dataRows);
    setSelectedSheet(name);

    // Auto-map by name similarity
    const autoMap = {};
    headerRow.forEach((h) => {
      const lower = h.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const match = autoMatch(lower);
      if (match && !Object.values(autoMap).includes(match)) {
        autoMap[h.index] = match;
      }
    });
    setColumnMap(autoMap);
    setStep(STEP_MAP);
  }

  function autoMatch(label) {
    const patterns = {
      n_inscricao: ["inscri", "numero", "num", "n ", "n.", "inscr", "registration"],
      nome_coreografia: ["coreografia", "nome_coreografia", "nome coreografia", "choreography"],
      modalidade: ["modalidade", "modality", "modal"],
      categoria: ["categoria", "category", "categ"],
      subcategoria: ["subcategoria", "subcategory", "sub"],
      escola: ["escola", "school", "academia", "studio"],
      ordem_apresentacao: ["ordem", "order", "apresent"],
      release: ["release", "musica", "sinopse", "descri"],
      elenco: ["elenco", "cast", "bailarin", "dancer"]
    };

    for (const [key, keywords] of Object.entries(patterns)) {
      if (keywords.some((kw) => label.includes(kw))) {
        return key;
      }
    }
    return null;
  }

  function handleSheetSelect(name) {
    if (!workbook) return;
    loadSheet(workbook, name);
  }

  function setMapping(columnIndex, fieldKey) {
    setColumnMap((prev) => {
      const next = { ...prev };

      // Remove old mapping for this field
      if (fieldKey) {
        Object.keys(next).forEach((key) => {
          if (next[key] === fieldKey) {
            delete next[key];
          }
        });
      }

      if (fieldKey) {
        next[columnIndex] = fieldKey;
      } else {
        delete next[columnIndex];
      }

      return next;
    });
  }

  const mappedFields = useMemo(() => new Set(Object.values(columnMap)), [columnMap]);

  const missingRequired = useMemo(
    () => REQUIRED_KEYS.filter((key) => !mappedFields.has(key)),
    [mappedFields]
  );

  const previewData = useMemo(() => {
    if (missingRequired.length > 0) return [];

    return rows.map((row) => {
      const item = {};
      Object.entries(columnMap).forEach(([colIndex, fieldKey]) => {
        item[fieldKey] = row[Number(colIndex)] ?? "";
      });
      return item;
    });
  }, [rows, columnMap, missingRequired]);

  function goToPreview() {
    setStep(STEP_PREVIEW);
  }

  async function handleImport() {
    setImporting(true);
    try {
      const response = await onImport(previewData);
      setResult(response);
      setStep(STEP_RESULT);
    } catch (err) {
      setResult({
        imported: 0,
        total: previewData.length,
        validationErrors: [],
        insertErrors: [{ n_inscricao: "-", message: err.response?.data?.message || "Erro ao importar" }]
      });
      setStep(STEP_RESULT);
    } finally {
      setImporting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="panel flex max-h-[90vh] w-full max-w-4xl flex-col p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">Importar coreografias</h3>
            <p className="mt-1 text-sm text-slate-500">
              {step === STEP_UPLOAD && "Envie uma planilha Excel (.xlsx) ou CSV com os dados das coreografias."}
              {step === STEP_MAP && "Associe cada coluna da planilha ao campo correspondente."}
              {step === STEP_PREVIEW && `${previewData.length} coreografias prontas para importar. Confira os dados.`}
              {step === STEP_RESULT && "Resultado da importacao."}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Fechar
          </button>
        </div>

        {/* Steps indicator */}
        <div className="mb-5 flex gap-1">
          {[
            { id: STEP_UPLOAD, label: "1. Arquivo" },
            { id: STEP_MAP, label: "2. Colunas" },
            { id: STEP_PREVIEW, label: "3. Revisar" },
            { id: STEP_RESULT, label: "4. Resultado" }
          ].map((s) => (
            <div
              key={s.id}
              className={`flex-1 rounded-lg py-1.5 text-center text-xs font-semibold ${
                step === s.id ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {/* STEP 1: Upload */}
          {step === STEP_UPLOAD && (
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-8 py-16 transition hover:border-sky-400 hover:bg-sky-50/50">
                <FileSpreadsheet className="h-12 w-12 text-slate-400" />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Clique para selecionar o arquivo</p>
                  <p className="mt-1 text-xs text-slate-500">Formatos aceitos: .xlsx, .xls, .csv</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
              {fileName && (
                <p className="text-center text-sm text-slate-600">
                  Arquivo selecionado: <strong>{fileName}</strong>
                </p>
              )}
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === STEP_MAP && (
            <div className="space-y-4">
              {/* Sheet selector (multi-sheet) */}
              {sheetNames.length > 1 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">Selecione a aba da planilha:</p>
                  <div className="flex flex-wrap gap-2">
                    {sheetNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          selectedSheet === name
                            ? "bg-slate-950 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                        onClick={() => handleSheetSelect(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mapping table */}
              {headers.length > 0 && (
                <>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-500">Coluna da planilha</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-500">Exemplo (linha 1)</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-500">Mapear para</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {headers.map((header) => {
                          const sampleValue = rows[0]?.[header.index] ?? "";
                          const currentMapping = columnMap[header.index] || "";
                          return (
                            <tr key={header.index}>
                              <td className="px-4 py-3 font-semibold text-slate-900">{header.label}</td>
                              <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{String(sampleValue)}</td>
                              <td className="px-4 py-3">
                                <select
                                  className="input py-1.5 text-sm"
                                  value={currentMapping}
                                  onChange={(e) => setMapping(header.index, e.target.value)}
                                >
                                  {CHOREOGRAPHY_FIELDS.map((field) => {
                                    const taken = field.key && mappedFields.has(field.key) && currentMapping !== field.key;
                                    return (
                                      <option key={field.key} value={field.key} disabled={taken}>
                                        {field.label}{field.required ? " *" : ""}{taken ? " (ja mapeado)" : ""}
                                      </option>
                                    );
                                  })}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {missingRequired.length > 0 && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Campos obrigatorios nao mapeados:</p>
                        <p className="mt-1">
                          {missingRequired.map((key) => CHOREOGRAPHY_FIELDS.find((f) => f.key === key)?.label).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === STEP_PREVIEW && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">#</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Inscricao</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Coreografia</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Modalidade</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Categoria</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Subcategoria</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Escola</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Ordem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.slice(0, 50).map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{item.n_inscricao}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{item.nome_coreografia}</td>
                        <td className="px-3 py-2 text-slate-600">{item.modalidade}</td>
                        <td className="px-3 py-2 text-slate-600">{item.categoria}</td>
                        <td className="px-3 py-2 text-slate-600">{item.subcategoria}</td>
                        <td className="px-3 py-2 text-slate-600">{item.escola}</td>
                        <td className="px-3 py-2 text-slate-600">{item.ordem_apresentacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 50 && (
                <p className="text-center text-xs text-slate-500">
                  Mostrando 50 de {previewData.length} linhas.
                </p>
              )}
            </div>
          )}

          {/* STEP 4: Result */}
          {step === STEP_RESULT && result && (
            <div className="space-y-4">
              <div className={`flex items-start gap-3 rounded-xl border px-5 py-4 ${
                result.imported === result.total
                  ? "border-emerald-200 bg-emerald-50"
                  : result.imported > 0
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50"
              }`}>
                <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${
                  result.imported === result.total ? "text-emerald-600" : result.imported > 0 ? "text-amber-600" : "text-red-600"
                }`} />
                <div>
                  <p className="font-bold text-slate-900">
                    {result.imported} de {result.total} coreografias importadas com sucesso.
                  </p>
                  {result.validationErrors?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-slate-700">Erros de validacao:</p>
                      <ul className="mt-1 space-y-1">
                        {result.validationErrors.map((err, i) => (
                          <li key={i} className="text-sm text-red-700">
                            Linha {err.row}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.insertErrors?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-slate-700">Erros ao inserir:</p>
                      <ul className="mt-1 space-y-1">
                        {result.insertErrors.map((err, i) => (
                          <li key={i} className="text-sm text-red-700">
                            #{err.n_inscricao}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            {step !== STEP_UPLOAD && step !== STEP_RESULT && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (step === STEP_MAP) { reset(); }
                  if (step === STEP_PREVIEW) { setStep(STEP_MAP); }
                }}
              >
                Voltar
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {step === STEP_MAP && (
              <button
                type="button"
                className="btn-primary"
                disabled={missingRequired.length > 0 || rows.length === 0}
                onClick={goToPreview}
              >
                Revisar {rows.length} linhas
              </button>
            )}
            {step === STEP_PREVIEW && (
              <button
                type="button"
                className="btn-primary"
                disabled={importing}
                onClick={handleImport}
              >
                {importing ? "Importando..." : `Importar ${previewData.length} coreografias`}
              </button>
            )}
            {step === STEP_RESULT && (
              <button type="button" className="btn-primary" onClick={handleClose}>
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
