"use client";

import { useState } from "react";
import { Plus, Trash2, LayoutTemplate } from "lucide-react";

const STATUS_OPTIONS = [
  "aanwezig, niet beschadigd",
  "aanwezig, beschadigd",
  "niet aanwezig",
];

interface ShowFloorItem {
  id: string;
  nummer: string | null;
  lengte: number | null;
  breedte: number | null;
  status: string | null;
  notes: string | null;
  article: {
    id: string;
    articleNumber: string;
    articleName: string;
    category: { id: string; name: string };
  };
}

interface Article {
  id: string;
  articleNumber: string;
  articleName: string;
  category: { id: string; name: string };
}

interface RootInfo { id: string; name: string; order: number }

const EMPTY_FORM = {
  articleId: "",
  nummer: "",
  lengte: "",
  breedte: "",
  status: STATUS_OPTIONS[0],
  notes: "",
};

function statusColor(status: string | null) {
  if (status === "aanwezig, niet beschadigd") return "bg-green-100 text-green-700";
  if (status === "aanwezig, beschadigd")      return "bg-orange-100 text-orange-700";
  if (status === "niet aanwezig")             return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-500";
}

function NotesCell({ itemId, initial }: { itemId: string; initial: string | null }) {
  const [val, setVal] = useState(initial ?? "");

  async function save(newVal: string) {
    const item = { id: itemId };
    await fetch("/api/showfloor", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, notes: newVal || null }),
    });
  }

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={(e) => save(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      placeholder="Niet op HQ-lijst? Noteer hier…"
      className="w-full min-w-40 text-xs border border-transparent rounded px-1 py-0.5 text-gray-500 placeholder-gray-300 focus:outline-none focus:border-gray-200 focus:bg-white"
    />
  );
}

export default function ShowFloorManager({
  showFloors: initial,
  articles,
  showroomId,
  catRootMap,
  isHQ,
}: {
  showFloors: ShowFloorItem[];
  articles: Article[];
  showroomId: string;
  catRootMap: Record<string, RootInfo>;
  isHQ: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, articleId: articles[0]?.id ?? "" });
  const [saving, setSaving] = useState(false);

  const groupedArticles = articles.reduce((acc, a) => {
    const cat = a.category.name;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {} as Record<string, Article[]>);

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleAdd() {
    setSaving(true);
    const res = await fetch("/api/showfloor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showroomId, ...form }),
    });
    const data = await res.json();
    const article = articles.find((a) => a.id === form.articleId)!;
    setItems([{ ...data, article }, ...items]);
    setShowAdd(false);
    setForm({ ...EMPTY_FORM, articleId: articles[0]?.id ?? "" });
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/showfloor?id=${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const item = items.find((i) => i.id === id)!;
    await fetch("/api/showfloor", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, status: newStatus }),
    });
    setItems(items.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
  }

  const sortedItems = [...items].sort((a, b) => (a.nummer ?? "").localeCompare(b.nummer ?? ""));

  return (
    <div className="space-y-4">
      {isHQ && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
          >
            <Plus className="w-4 h-4" />
            Toevoegen aan showvloer
          </button>
        </div>
      )}

      {isHQ && showAdd && (
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Artikel toevoegen aan showvloer</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Artikel</label>
              <select
                value={form.articleId}
                onChange={(e) => setField("articleId", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(groupedArticles).map(([cat, arts]) => (
                  <optgroup key={cat} label={cat}>
                    {arts.map((a) => (
                      <option key={a.id} value={a.id}>{a.articleNumber} — {a.articleName}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nummer</label>
              <input type="text" value={form.nummer} onChange={(e) => setField("nummer", e.target.value)}
                placeholder="bijv. VL-01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setField("status", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lengte (m)</label>
              <input type="number" step="0.01" value={form.lengte} onChange={(e) => setField("lengte", e.target.value)}
                placeholder="bijv. 3.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Breedte (m)</label>
              <input type="number" step="0.01" value={form.breedte} onChange={(e) => setField("breedte", e.target.value)}
                placeholder="bijv. 2.00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notitie</label>
              <input type="text" value={form.notes} onChange={(e) => setField("notes", e.target.value)}
                placeholder="Optioneel…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Annuleren</button>
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
              {saving ? "Toevoegen..." : "Toevoegen"}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <LayoutTemplate className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nog geen artikelen op de showvloer</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Nummer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Artikelnummer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Artikelnaam</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-sm">Lengte (m)</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-sm">Breedte (m)</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-sm">Opp. (m²)</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 text-sm">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-sm">Notitie</th>
                {isHQ && <th className="w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.nummer ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{item.article.articleNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.article.articleName}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.lengte != null ? item.lengte.toFixed(2) : "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.breedte != null ? item.breedte.toFixed(2) : "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {item.lengte != null && item.breedte != null ? (item.lengte * item.breedte).toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={item.status ?? STATUS_OPTIONS[0]}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${statusColor(item.status)}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <NotesCell itemId={item.id} initial={item.notes} />
                  </td>
                  {isHQ && (
                    <td className="px-2 py-3">
                      <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
