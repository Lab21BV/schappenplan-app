"use client";

import { useState, useRef } from "react";
import { Upload, Download, X, CheckCircle, AlertCircle } from "lucide-react";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function ArticleImport({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const header = "artikelnummer,artikelnaam,leverancier,categorie,display,kostprijs,verkoopprijs_incl_btw,prio\n";
    const example =
      "ART001,Voorbeeld Artikel,Leverancier BV,Tegels PVC Klik,strook;bord 100x60,12.50,39.95,3\n" +
      "ART002,Ander Artikel,Leverancier BV,Tegels PVC Lijm,bord 120x60,8.00,24.95,5\n";
    const blob = new Blob([header + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "artikel-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/articles/import", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    setResult(data);
    if (data.imported > 0) onDone();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Artikelen importeren</h3>
        <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800">
          <Download className="w-3.5 h-3.5" />
          Template downloaden
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Kolommen: <span className="font-mono">artikelnummer, artikelnaam, leverancier, categorie, display, kostprijs, verkoopprijs_incl_btw, prio</span>
        <br />
        Display (scheiden met <span className="font-mono">;</span>): <span className="font-mono">strook · bord 100x60 · bord 120x60 · showvloer · [eigen tekst]</span>
        <br />
        Prio: 1–5 · Marge wordt automatisch berekend uit kostprijs en verkoopprijs excl. btw (21%)
      </p>

      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        {file ? (
          <p className="text-sm text-gray-700 font-medium">{file.name}</p>
        ) : (
          <p className="text-sm text-gray-500">Klik om een .xlsx of .csv bestand te selecteren</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
        />
      </div>

      {file && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => { setFile(null); setResult(null); if (inputRef.current) inputRef.current.value = ""; }}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <X className="w-4 h-4" /> Annuleren
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {loading ? "Importeren..." : "Importeren"}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {result.imported} artikel{result.imported !== 1 ? "en" : ""} geïmporteerd
            {result.skipped > 0 && `, ${result.skipped} overgeslagen`}
          </div>
          {result.errors.length > 0 && (
            <div className="bg-orange-50 rounded-lg px-3 py-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-orange-700 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {result.errors.length} waarschuwing{result.errors.length !== 1 ? "en" : ""}
              </div>
              <ul className="text-xs text-orange-600 space-y-0.5 pl-6 list-disc">
                {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                {result.errors.length > 10 && <li>… en {result.errors.length - 10} meer</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
