"use client";

import { useState } from "react";
import { Plus, Edit2, Search, TrendingUp, Upload } from "lucide-react";
import ArticleImport from "./ArticleImport";
import { ARTICLE_STATUSES, statusBadgeClass } from "@/lib/displayOptions";

const DISPLAY_OPTIONS = [
  { value: "strook", label: "Strook" },
  { value: "bord 100x60", label: "Bord 100×60" },
  { value: "bord 120x60", label: "Bord 120×60" },
  { value: "showvloer", label: "Showvloer" },
];

interface Article {
  id: string;
  articleNumber: string;
  articleName: string;
  supplierNameAnonymized: string;
  supplierNameReal: string;
  costPrice: number;
  sellingPrice: number;
  grossMargin: number;
  priorityScore: number;
  isActive: boolean;
  status?: string;
  categoryId: string;
  displayTypes: string;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
}

const EMPTY_FORM = {
  articleNumber: "",
  articleName: "",
  supplierNameAnonymized: "",
  supplierNameReal: "",
  costPrice: "",
  sellingPrice: "",
  grossMargin: "",
  priorityScore: "",
  categoryId: "",
  isActive: true,
  status: "Collectie",
  displayTypes: [] as string[],
  customDisplay: "",
};

function parseDisplayTypes(raw: string): string[] {
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

function DisplayBadges({ raw }: { raw: string }) {
  const types = parseDisplayTypes(raw);
  if (types.length === 0) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((t) => (
        <span key={t} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
          {t}
        </span>
      ))}
    </div>
  );
}

export default function ArticlesManager({
  articles: initial,
  categories,
}: {
  articles: Article[];
  categories: Category[];
}) {
  const [articles, setArticles] = useState(initial);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const leafCategories = categories.filter((c) =>
    !categories.some((cc) => cc.parentId === c.id)
  );

  const filtered = articles.filter(
    (a) =>
      a.articleName.toLowerCase().includes(search.toLowerCase()) ||
      a.articleNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.supplierNameReal.toLowerCase().includes(search.toLowerCase())
  );

  function getLeafIds(catId: string): string[] {
    const children = categories.filter((c) => c.parentId === catId);
    if (children.length === 0) return [catId];
    return children.flatMap((c) => getLeafIds(c.id));
  }

  const roots = categories
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.order - b.order);

  interface LeafGroup { cat: Category; items: Article[] }
  interface RootGroup { root: Category; leaves: LeafGroup[] }

  const groups: RootGroup[] = roots.map((root) => {
    const leafIds = getLeafIds(root.id);
    const leaves: LeafGroup[] = leafIds
      .map((lid) => ({
        cat: categories.find((c) => c.id === lid)!,
        items: filtered.filter((a) => a.categoryId === lid),
      }))
      .filter((g) => g.cat && g.items.length > 0);
    return { root, leaves };
  }).filter((g) => g.leaves.length > 0);

  function openNew() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, categoryId: leafCategories[0]?.id ?? "" });
    setShowForm(true);
    setShowImport(false);
  }

  function openEdit(a: Article) {
    setEditId(a.id);
    setForm({
      articleNumber: a.articleNumber,
      articleName: a.articleName,
      supplierNameAnonymized: a.supplierNameAnonymized,
      supplierNameReal: a.supplierNameReal,
      costPrice: String(a.costPrice),
      sellingPrice: String(a.sellingPrice),
      grossMargin: String(a.grossMargin),
      priorityScore: String(a.priorityScore),
      categoryId: a.categoryId,
      isActive: a.isActive as any,
      status: a.status ?? "Collectie",
      displayTypes: parseDisplayTypes(a.displayTypes),
      customDisplay: "",
    });
    setShowForm(true);
    setShowImport(false);
  }

  function toggleDisplay(val: string) {
    setForm((f) => ({
      ...f,
      displayTypes: f.displayTypes.includes(val)
        ? f.displayTypes.filter((x) => x !== val)
        : [...f.displayTypes, val],
    }));
  }

  async function handleSave() {
    setSaving(true);
    const displayTypes = [...form.displayTypes];
    if (form.customDisplay.trim()) displayTypes.push(form.customDisplay.trim());
    const method = editId ? "PUT" : "POST";
    const res = await fetch("/api/articles", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId
        ? { ...form, id: editId, displayTypes: JSON.stringify(displayTypes) }
        : { ...form, displayTypes: JSON.stringify(displayTypes) }
      ),
    });
    const data = await res.json();
    setSaving(false);

    if (editId) {
      setArticles(articles.map((a) => (a.id === editId ? { ...a, ...data, category: categories.find(c => c.id === data.categoryId) ?? a.category } : a)));
    } else {
      setArticles([{ ...data, category: categories.find(c => c.id === data.categoryId)! }, ...articles]);
    }
    setShowForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoeken op naam, nummer of leverancier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => { setShowImport(!showImport); setShowForm(false); }}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          <Upload className="w-4 h-4" /> Importeren
        </button>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
        >
          <Plus className="w-4 h-4" /> Nieuw artikel
        </button>
      </div>

      {showImport && (
        <ArticleImport onDone={() => { setShowImport(false); window.location.reload(); }} />
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editId ? "Artikel bewerken" : "Nieuw artikel"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "articleNumber", label: "Artikelnummer", disabled: !!editId },
              { key: "articleName", label: "Artikelnaam" },
              { key: "supplierNameAnonymized", label: "Leverancier (geanonimiseerd)" },
              { key: "supplierNameReal", label: "Leverancier (echte naam)" },
              { key: "costPrice", label: "Kostprijs (€)", type: "number" },
              { key: "sellingPrice", label: "Verkoopprijs (€)", type: "number" },
              { key: "grossMargin", label: "Brutomarge (%)", type: "number" },
              // priorityScore handled separately below
            ].map(({ key, label, type, disabled }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={type ?? "text"}
                  disabled={disabled}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categorie</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {leafCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prioriteit (1–5)</label>
              <select
                value={form.priorityScore}
                onChange={(e) => setForm({ ...form, priorityScore: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive as any}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked as any })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Actief</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Artikelstatus</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ARTICLE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-2">Display</label>
              <div className="flex flex-wrap gap-2">
                {DISPLAY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleDisplay(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                      form.displayTypes.includes(opt.value)
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Afwijkend display (optioneel)"
                  value={form.customDisplay}
                  onChange={(e) => setForm({ ...form, customDisplay: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Annuleren
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {groups.map(({ root, leaves }) => (
          <div key={root.id}>
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl mb-2">
              <span className="font-bold text-white text-sm">{root.name}</span>
              <span className="text-xs text-gray-400">{leaves.reduce((s, l) => s + l.items.length, 0)} artikelen</span>
            </div>
            <div className="pl-3 border-l-2 border-gray-200 space-y-2">
              {leaves.map(({ cat, items }) => (
                <div key={cat.id}>
                  <div className="px-3 py-1.5 bg-gray-100 rounded-lg mb-1">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{cat.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{items.length}</span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Nr.</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Naam</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Leverancier</th>
                          <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Display</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Kostprijs</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Verkoopprijs</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Marge</th>
                          <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Prio</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {items.map((art) => (
                          <tr key={art.id} className={`hover:bg-gray-50 ${!art.isActive ? "opacity-50" : ""}`}>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{art.articleNumber}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-900">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span>{art.articleName}</span>
                                {art.status && art.status !== "Collectie" && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusBadgeClass(art.status)}`}>
                                    {art.status}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-gray-600 text-xs">{art.supplierNameReal}</td>
                            <td className="px-4 py-2.5"><DisplayBadges raw={art.displayTypes ?? "[]"} /></td>
                            <td className="px-4 py-2.5 text-right text-gray-700 text-xs">€ {art.costPrice.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-900 text-xs">€ {art.sellingPrice.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                art.grossMargin >= 50 ? "bg-green-100 text-green-700" :
                                art.grossMargin >= 40 ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {art.grossMargin.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <TrendingUp className={`w-3 h-3 ${art.priorityScore >= 4 ? "text-red-500" : art.priorityScore >= 3 ? "text-orange-400" : "text-gray-400"}`} />
                                <span className="text-xs">{art.priorityScore.toFixed(0)}</span>
                              </div>
                            </td>
                            <td className="px-2 py-2.5">
                              <button onClick={() => openEdit(art)} className="text-gray-400 hover:text-blue-600">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
