"use client";

import { useRef, useState } from "react";
import { Upload, Download, CheckCircle, AlertCircle, X } from "lucide-react";

interface Showroom { id: string; name: string }

interface Props {
  showrooms: Showroom[];
  isHQ: boolean;
}

const TEMPLATE_ROWS = [
  ["artikelnummer", "locatie_type", "locatie_nummer", "positie", "display_afmeting", "notities"],
  ["SE-001", "WAND", "1", "1", "100x60", ""],
  ["SE-002", "BOK", "1", "1", "120x60", ""],
  ["ML-001", "BOK", "2", "1", "120x60", "topproduct"],
  ["LA-001", "STROK", "1", "1", "STROK", ""],
];

function downloadTemplate() {
  const csv = TEMPLATE_ROWS.map((r) => r.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "schappenplan_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type Result = { imported: number; errors: string[] } | null;

export default function PlanogramImport({ showrooms, isHQ }: Props) {
  const [open, setOpen] = useState(false);
  const [showroomId, setShowroomId] = useState(showrooms[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("showroomId", showroomId);

    const res = await fetch("/api/planogram/import", { method: "POST", body: fd });
    const data = await res.json();
    setResult(data);
    setLoading(false);

    if (res.ok) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleExport() {
    window.location.href = `/api/planogram/export?showroomId=${showroomId}`;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        <Upload className="w-4 h-4" />
        Importeer schappenplan
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Schappenplan importeren</h2>
        <button onClick={() => { setOpen(false); reset(); }} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Upload een Excel (.xlsx) of CSV-bestand. Het huidige schappenplan van de geselecteerde showroom wordt volledig vervangen.
      </p>

      {isHQ && showrooms.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {showrooms.map((s) => (
            <button
              key={s.id}
              onClick={() => setShowroomId(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                showroomId === s.id ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="flex-1 flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition">
          <Upload className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">{file ? file.name : "Kies bestand (.xlsx of .csv)"}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
          />
        </label>
        <button
          onClick={handleExport}
          title="Download huidig schappenplan als CSV"
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition"
        >
          <Download className="w-4 h-4" />
          Exporteer
        </button>
        <button
          onClick={downloadTemplate}
          title="Download leeg voorbeeldbestand"
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
        >
          <Download className="w-4 h-4" />
          Template
        </button>
      </div>

      {result && result.errors.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-1">
          <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
            <AlertCircle className="w-4 h-4" />
            Import mislukt — los de fouten op en probeer opnieuw
          </div>
          <ul className="mt-2 space-y-0.5">
            {result.errors.map((e, i) => (
              <li key={i} className="text-xs text-red-600">{e}</li>
            ))}
          </ul>
        </div>
      )}

      {result && result.errors.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-3 text-green-700 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          {result.imported} artikel{result.imported !== 1 ? "en" : ""} geïmporteerd
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {loading ? "Importeren..." : "Importeer"}
        </button>
        <button onClick={() => { setOpen(false); reset(); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
          Annuleren
        </button>
      </div>
    </div>
  );
}
