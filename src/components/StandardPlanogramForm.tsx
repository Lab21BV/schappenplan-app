"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ChevronDown, ChevronRight } from "lucide-react";

interface Article {
  id: string;
  articleNumber: string;
  articleName: string;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
}

interface Showroom { id: string; name: string }

interface PlanogramLine {
  id: number;
  categoryId: string;
  locatieType: "WAND" | "BOK" | "STROK";
  locatieNummer: string;
  positie: string;
  displayAfmeting: string;
  articleId: string;
  notes: string;
}

let lineCounter = 1;

function getLeafCategories(categories: Category[]) {
  return categories
    .filter((c) => !categories.some((cc) => cc.parentId === c.id))
    .sort((a, b) => a.order - b.order);
}

function defaultAfmeting(type: "WAND" | "BOK" | "STROK"): string {
  if (type === "BOK") return "120x60";
  if (type === "STROK") return "STROK";
  return "100x60";
}

export default function StandardPlanogramForm({
  articles,
  showrooms,
  categories,
  defaultShowroomId,
}: {
  articles: Article[];
  showrooms: Showroom[];
  categories: Category[];
  defaultShowroomId: string;
}) {
  const router = useRouter();
  const leafCats = getLeafCategories(categories);
  const firstCatId = leafCats[0]?.id ?? "";
  const firstArticle = articles[0]?.id ?? "";

  const [showroomId, setShowroomId] = useState(defaultShowroomId);
  const [lines, setLines] = useState<PlanogramLine[]>([
    { id: lineCounter++, categoryId: firstCatId, locatieType: "WAND", locatieNummer: "1", positie: "1", displayAfmeting: "100x60", articleId: firstArticle, notes: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const articlesByCat = articles.reduce((acc, a) => {
    if (!acc[a.category.id]) acc[a.category.id] = [];
    acc[a.category.id].push(a);
    return acc;
  }, {} as Record<string, Article[]>);

  function addLine(categoryId: string) {
    setLines([...lines, {
      id: lineCounter++,
      categoryId,
      locatieType: "WAND",
      locatieNummer: "1",
      positie: String(lines.filter((l) => l.categoryId === categoryId).length + 1),
      displayAfmeting: "100x60",
      articleId: firstArticle,
      notes: "",
    }]);
  }

  function removeLine(id: number) {
    setLines(lines.filter((l) => l.id !== id));
  }

  function updateLine(id: number, field: keyof PlanogramLine, value: string) {
    setLines(lines.map((l) => {
      if (l.id !== id) return l;
      const updated = { ...l, [field]: value };
      if (field === "locatieType") {
        updated.displayAfmeting = defaultAfmeting(value as any);
      }
      return updated;
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/planogram/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showroomId,
          items: lines.map((l) => ({
            articleId: l.articleId,
            categoryId: l.categoryId,
            locatieType: l.locatieType,
            locatieNummer: l.locatieNummer,
            positie: l.positie,
            displayAfmeting: l.displayAfmeting,
            notes: l.notes,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/dashboard/planogram");
    } catch (e: any) {
      setError(e.message || "Er is een fout opgetreden");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {showrooms.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Showroom</label>
          <select
            value={showroomId}
            onChange={(e) => setShowroomId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showrooms.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-4">
        {leafCats.map((cat, catIdx) => {
          const catLines = lines.filter((l) => l.categoryId === cat.id);
          return (
            <AfdelingSection
              key={cat.id}
              cat={cat}
              catNr={catIdx + 1}
              lines={catLines}
              articles={articlesByCat[cat.id] ?? articles}
              allArticles={articles}
              onAddLine={() => addLine(cat.id)}
              onRemoveLine={removeLine}
              onUpdateLine={updateLine}
            />
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        {leafCats.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => addLine(cat.id)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-3 h-3" /> Afd. {i + 1} {cat.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.push("/dashboard/planogram")}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </button>
        <button
          onClick={handleSave}
          disabled={saving || lines.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Opslaan..." : `Opslaan (${lines.length} regel${lines.length !== 1 ? "s" : ""})`}
        </button>
      </div>
    </div>
  );
}

function AfdelingSection({
  cat, catNr, lines, articles, allArticles, onAddLine, onRemoveLine, onUpdateLine,
}: {
  cat: Category;
  catNr: number;
  lines: PlanogramLine[];
  articles: Article[];
  allArticles: Article[];
  onAddLine: () => void;
  onRemoveLine: (id: number) => void;
  onUpdateLine: (id: number, field: keyof PlanogramLine, value: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const articleOptions = articles.length > 0 ? articles : allArticles;

  if (lines.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-blue-50 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
            {catNr}
          </span>
          <span className="font-semibold text-blue-900 text-sm">{cat.name}</span>
          <span className="text-xs text-blue-400">{lines.length} regel{lines.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAddLine(); }}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100"
          >
            <Plus className="w-3 h-3" /> Regel
          </button>
          {open ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-blue-500" />}
        </div>
      </div>

      {open && (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Locatie</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs w-16">Nr.</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs w-16">Pos.</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Afmeting</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Artikel</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Notitie</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50">
                <td className="px-3 py-1.5">
                  <select
                    value={line.locatieType}
                    onChange={(e) => onUpdateLine(line.id, "locatieType", e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="WAND">Wand</option>
                    <option value="BOK">Bok</option>
                    <option value="STROK">Strok</option>
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number" min="1"
                    value={line.locatieNummer}
                    onChange={(e) => onUpdateLine(line.id, "locatieNummer", e.target.value)}
                    className="w-14 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number" min="1"
                    value={line.positie}
                    onChange={(e) => onUpdateLine(line.id, "positie", e.target.value)}
                    className="w-14 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={line.displayAfmeting}
                    onChange={(e) => onUpdateLine(line.id, "displayAfmeting", e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="100x60">Bord 100×60</option>
                    <option value="120x60">Bord 120×60</option>
                    <option value="STROK">Strook</option>
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={line.articleId}
                    onChange={(e) => onUpdateLine(line.id, "articleId", e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {articleOptions.map((a) => (
                      <option key={a.id} value={a.id}>{a.articleNumber} — {a.articleName}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={line.notes}
                    onChange={(e) => onUpdateLine(line.id, "notes", e.target.value)}
                    placeholder="Notitie..."
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => onRemoveLine(line.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
