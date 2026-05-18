"use client";

import { useMemo, useState, useRef } from "react";
import {
  Plus,
  Search,
  Trash2,
  Upload,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Save,
  Edit2,
} from "lucide-react";
import {
  RESERVE_SAMPLE_STATUSES,
  reserveSampleStatusBadgeClass,
} from "@/lib/reserveSampleStatuses";

interface ReserveSample {
  id: string;
  articleNumber: string;
  articleName: string;
  status: string;
  bordStrook: string | null;
  afmeting: string | null;
  aantal: number;
  notities: string | null;
  leverancier: string | null;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

const EMPTY_FORM = {
  articleNumber: "",
  articleName: "",
  status: "Op voorraad",
  bordStrook: "",
  afmeting: "",
  aantal: "1",
  notities: "",
  leverancier: "",
};

export default function ReserveSamplesManager({
  initial,
}: {
  initial: ReserveSample[];
}) {
  const [samples, setSamples] = useState<ReserveSample[]>(initial);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ReserveSample>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return samples;
    return samples.filter(
      (s) =>
        s.articleNumber.toLowerCase().includes(q) ||
        s.articleName.toLowerCase().includes(q) ||
        (s.leverancier ?? "").toLowerCase().includes(q) ||
        (s.notities ?? "").toLowerCase().includes(q)
    );
  }, [samples, search]);

  async function handleAdd() {
    if (!form.articleNumber.trim() || !form.articleName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/reserve-samples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        aantal: parseInt(form.aantal, 10) || 0,
      }),
    });
    setSaving(false);
    if (!res.ok) return;
    const data: ReserveSample = await res.json();
    setSamples((prev) => [data, ...prev]);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  }

  async function handleStatusChange(id: string, status: string) {
    const previous = samples;
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    const res = await fetch(`/api/reserve-samples/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setSamples(previous);
  }

  async function handleAantalChange(id: string, aantal: number) {
    const previous = samples;
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, aantal } : s)));
    const res = await fetch(`/api/reserve-samples/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aantal }),
    });
    if (!res.ok) setSamples(previous);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deze reserve staal verwijderen?")) return;
    const previous = samples;
    setSamples((prev) => prev.filter((s) => s.id !== id));
    const res = await fetch(`/api/reserve-samples/${id}`, { method: "DELETE" });
    if (!res.ok) setSamples(previous);
  }

  function startEdit(sample: ReserveSample) {
    setEditingId(sample.id);
    setEditDraft({
      articleNumber: sample.articleNumber,
      articleName: sample.articleName,
      bordStrook: sample.bordStrook ?? "",
      afmeting: sample.afmeting ?? "",
      notities: sample.notities ?? "",
      leverancier: sample.leverancier ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({});
  }

  async function saveEdit() {
    if (!editingId) return;
    const previous = samples;
    const updated = samples.map((s) =>
      s.id === editingId
        ? {
            ...s,
            articleNumber: (editDraft.articleNumber ?? s.articleNumber) as string,
            articleName: (editDraft.articleName ?? s.articleName) as string,
            bordStrook: (editDraft.bordStrook as string) || null,
            afmeting: (editDraft.afmeting as string) || null,
            notities: (editDraft.notities as string) || null,
            leverancier: (editDraft.leverancier as string) || null,
          }
        : s
    );
    setSamples(updated);
    const res = await fetch(`/api/reserve-samples/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    if (!res.ok) {
      setSamples(previous);
      return;
    }
    cancelEdit();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoeken op nr, naam, leverancier of notitie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            setShowImport((v) => !v);
            setShowForm(false);
          }}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 max-lg:flex-1 max-lg:justify-center"
        >
          <Upload className="w-4 h-4" /> Importeren
        </button>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setShowImport(false);
            if (!showForm) setForm({ ...EMPTY_FORM });
          }}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 max-lg:flex-1 max-lg:justify-center"
        >
          <Plus className="w-4 h-4" /> Nieuwe regel
        </button>
      </div>

      {showImport && (
        <ReserveImport
          onDone={(result) => {
            if (result.imported > 0) {
              fetch("/api/reserve-samples")
                .then((r) => r.json())
                .then((data: ReserveSample[]) => setSamples(data))
                .catch(() => {});
            }
          }}
        />
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Nieuwe reserve staal</h3>
          <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
            <Field label="Artikelnr.">
              <input
                type="text"
                value={form.articleNumber}
                onChange={(e) => setForm({ ...form, articleNumber: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Artikelnaam">
              <input
                type="text"
                value={form.articleName}
                onChange={(e) => setForm({ ...form, articleName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RESERVE_SAMPLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bord / Strook">
              <select
                value={form.bordStrook}
                onChange={(e) => setForm({ ...form, bordStrook: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">—</option>
                <option value="Bord">Bord</option>
                <option value="Strook">Strook</option>
              </select>
            </Field>
            <Field label="Afmeting">
              <input
                type="text"
                placeholder="bv. 100x60"
                value={form.afmeting}
                onChange={(e) => setForm({ ...form, afmeting: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Aantal">
              <input
                type="number"
                min="0"
                value={form.aantal}
                onChange={(e) => setForm({ ...form, aantal: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Leverancier">
              <input
                type="text"
                value={form.leverancier}
                onChange={(e) => setForm({ ...form, leverancier: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Notities">
              <input
                type="text"
                value={form.notities}
                onChange={(e) => setForm({ ...form, notities: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !form.articleNumber.trim() || !form.articleName.trim()}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar scroll-edge-fade">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnr.</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnaam</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Bord / Strook</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Afmeting</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs">Aantal</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Notities</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Leverancier</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {samples.length === 0
                      ? "Nog geen reserve stalen geregistreerd"
                      : "Geen resultaten voor de zoekterm"}
                  </td>
                </tr>
              )}
              {filtered.map((s) => {
                const isEditing = editingId === s.id;
                return (
                  <tr key={s.id} className={isEditing ? "bg-blue-50/40" : "hover:bg-gray-50"}>
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editDraft.articleNumber as string) ?? ""}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, articleNumber: e.target.value })
                          }
                          className="w-28 border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                        />
                      ) : (
                        s.articleNumber
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editDraft.articleName as string) ?? ""}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, articleName: e.target.value })
                          }
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                        />
                      ) : (
                        s.articleName
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={s.status}
                        onChange={(e) => handleStatusChange(s.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${reserveSampleStatusBadgeClass(
                          s.status
                        )}`}
                      >
                        {RESERVE_SAMPLE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-xs">
                      {isEditing ? (
                        <select
                          value={(editDraft.bordStrook as string) ?? ""}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, bordStrook: e.target.value })
                          }
                          className="border border-gray-200 rounded px-2 py-1 text-xs"
                        >
                          <option value="">—</option>
                          <option value="Bord">Bord</option>
                          <option value="Strook">Strook</option>
                        </select>
                      ) : (
                        s.bordStrook ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editDraft.afmeting as string) ?? ""}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, afmeting: e.target.value })
                          }
                          className="w-24 border border-gray-200 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        s.afmeting ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={s.aantal}
                        onChange={(e) =>
                          handleAantalChange(s.id, Math.max(0, parseInt(e.target.value, 10) || 0))
                        }
                        className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-right"
                      />
                    </td>
                    <td className="px-4 py-2 text-gray-600 text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editDraft.notities as string) ?? ""}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, notities: e.target.value })
                          }
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        s.notities ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600 text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={(editDraft.leverancier as string) ?? ""}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, leverancier: e.target.value })
                          }
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        s.leverancier ?? "—"
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1 justify-end">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Opslaan"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-400 hover:text-gray-600 transition"
                              title="Annuleren"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(s)}
                              className="text-gray-400 hover:text-blue-600 transition"
                              title="Bewerken"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="text-gray-400 hover:text-red-500 transition"
                              title="Verwijderen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ReserveImport({ onDone }: { onDone: (result: ImportResult) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const header =
      "artikelnr,artikelnaam,status,bord / strook,afmeting,aantal,notities,leverancier\n";
    const example =
      "ART001,Voorbeeld staal,Op voorraad,Bord,100x60,2,,Leverancier BV\n" +
      "ART002,Strookstaal,Op voorraad,Strook,,5,Reserve set,Leverancier BV\n";
    const blob = new Blob([header + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reserve-stalen-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/reserve-samples/import", {
      method: "POST",
      body: fd,
    });
    const data: ImportResult = await res.json();
    setLoading(false);
    setResult(data);
    onDone(data);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Reserve stalen importeren</h3>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
        >
          <Download className="w-3.5 h-3.5" />
          Template downloaden
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Kolommen:{" "}
        <span className="font-mono">
          artikelnr, artikelnaam, status, bord / strook, afmeting, aantal, notities, leverancier
        </span>
        <br />
        Status: <span className="font-mono">{RESERVE_SAMPLE_STATUSES.join(" · ")}</span> (leeg = Op voorraad)
      </p>

      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        {file ? (
          <p className="text-sm text-gray-700 font-medium">{file.name}</p>
        ) : (
          <p className="text-sm text-gray-500">
            Klik om een .xlsx of .csv bestand te selecteren
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
        />
      </div>

      {file && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setFile(null);
              setResult(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
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
            {result.imported} regel{result.imported !== 1 ? "s" : ""} geïmporteerd
            {result.skipped > 0 && `, ${result.skipped} overgeslagen`}
          </div>
          {result.errors.length > 0 && (
            <div className="bg-orange-50 rounded-lg px-3 py-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-orange-700 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {result.errors.length} waarschuwing
                {result.errors.length !== 1 ? "en" : ""}
              </div>
              <ul className="text-xs text-orange-600 space-y-0.5 pl-6 list-disc">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 10 && (
                  <li>… en {result.errors.length - 10} meer</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
