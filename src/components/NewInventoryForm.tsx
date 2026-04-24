"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ChevronDown, ChevronRight } from "lucide-react";
import { getAfmetingOptions, defaultAfmeting, LOCATIE_OPTIONS, decodeLocatie, encodeLocatie, statusBadgeClass } from "@/lib/displayOptions";

interface Article {
  id: string;
  articleNumber: string;
  articleName: string;
  status?: string;
  sellingPrice?: number;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
}

interface DisplayConfig {
  categoryId: string;
  numWandborden: number;
  numBokken: number;
  category: { name: string };
}

interface Showroom { id: string; name: string }

interface InventoryLine {
  id: number;
  categoryId: string;
  locatieType: "WAND" | "BOK" | "STROK";
  locatieNummer: string;
  bordNummer: string;
  displayAfmeting: string;
  articleId: string;
  stock: string;
  notes: string;
  isDisplayMaterial: boolean;
}

let lineCounter = 1;

function getLeafCategories(categories: Category[]) {
  return categories.filter((c) => !categories.some((cc) => cc.parentId === c.id));
}

function getCategoryNummer(cat: Category, allCats: Category[]): number {
  const tops = allCats.filter((c) => c.parentId === null).sort((a, b) => a.order - b.order);
  const idx = tops.findIndex((c) => c.id === cat.id);
  if (idx !== -1) return idx + 1;
  // for leaf, find parent top index + sub index
  let cur: Category | undefined = cat;
  while (cur?.parentId) cur = allCats.find((c) => c.id === cur!.parentId);
  const topIdx = tops.findIndex((c) => c.id === cur?.id);
  const siblings = allCats.filter((c) => c.parentId === cur?.id).sort((a, b) => a.order - b.order);
  const subIdx = siblings.findIndex((c) => c.id === cat.id);
  return (topIdx + 1) * 100 + (subIdx + 1);
}

export default function NewInventoryForm({
  articles,
  showrooms,
  categories,
  displayConfigs,
  defaultShowroomId,
  userId,
}: {
  articles: Article[];
  showrooms: Showroom[];
  categories: Category[];
  displayConfigs: DisplayConfig[];
  defaultShowroomId: string;
  userId: string;
}) {
  const router = useRouter();
  const leafCats = getLeafCategories(categories);
  const firstCatId = leafCats[0]?.id ?? "";
  const firstArticle = articles[0]?.id ?? "";

  const [showroomId, setShowroomId] = useState(defaultShowroomId);
  const firstCat = leafCats[0];
  const initWandAfm = firstCat ? defaultAfmeting(firstCat, categories, "WAND") : "strook";
  const initBokAfm = firstCat ? defaultAfmeting(firstCat, categories, "BOK") : "120x60";
  const [lines, setLines] = useState<InventoryLine[]>([
    { id: lineCounter++, categoryId: firstCatId, locatieType: "WAND", locatieNummer: "1", bordNummer: "", displayAfmeting: initWandAfm, articleId: firstArticle, stock: "0", notes: "", isDisplayMaterial: false },
    { id: lineCounter++, categoryId: firstCatId, locatieType: "BOK",  locatieNummer: "1", bordNummer: "1", displayAfmeting: initBokAfm, articleId: firstArticle, stock: "0", notes: "", isDisplayMaterial: false },
    { id: lineCounter++, categoryId: firstCatId, locatieType: "BOK",  locatieNummer: "1", bordNummer: "2", displayAfmeting: initBokAfm, articleId: firstArticle, stock: "0", notes: "", isDisplayMaterial: false },
    { id: lineCounter++, categoryId: firstCatId, locatieType: "BOK",  locatieNummer: "1", bordNummer: "3", displayAfmeting: initBokAfm, articleId: firstArticle, stock: "0", notes: "", isDisplayMaterial: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Group lines by categoryId for display
  const grouped = leafCats
    .map((cat, catIdx) => ({
      cat,
      catNr: catIdx + 1,
      lines: lines.filter((l) => l.categoryId === cat.id),
    }))
    .filter((g) => g.lines.length > 0);

  function addLine(categoryId?: string) {
    const catId = categoryId ?? firstCatId;
    const cat = leafCats.find((c) => c.id === catId);
    setLines([...lines, {
      id: lineCounter++,
      categoryId: catId,
      locatieType: "WAND",
      locatieNummer: "1",
      bordNummer: "",
      displayAfmeting: cat ? defaultAfmeting(cat, categories, "WAND") : "strook",
      articleId: firstArticle,
      stock: "0",
      notes: "",
      isDisplayMaterial: false,
    }]);
  }

  function removeLine(id: number) {
    setLines(lines.filter((l) => l.id !== id));
  }

  function updateLine(id: number, field: keyof InventoryLine | "locatie", value: string | boolean) {
    setLines(lines.map((l) => {
      if (l.id !== id) return l;
      const updated = { ...l } as InventoryLine;
      if (field === "locatie") {
        const decoded = decodeLocatie(String(value));
        if (decoded) {
          updated.locatieType = decoded.type;
          updated.locatieNummer = String(decoded.nummer);
          if (decoded.type !== "BOK") updated.bordNummer = "";
          const cat = leafCats.find((c) => c.id === updated.categoryId);
          if (cat) {
            updated.displayAfmeting = defaultAfmeting(cat, categories, decoded.type === "BOK" ? "BOK" : "WAND");
          }
        }
      } else {
        (updated as any)[field] = value;
        if (field === "categoryId") {
          const cat = leafCats.find((c) => c.id === value);
          if (cat) {
            updated.displayAfmeting = defaultAfmeting(cat, categories, updated.locatieType === "BOK" ? "BOK" : "WAND");
          }
        }
      }
      return updated;
    }));
  }

  const articlesByCat = articles.reduce((acc, a) => {
    if (!acc[a.category.id]) acc[a.category.id] = [];
    acc[a.category.id].push(a);
    return acc;
  }, {} as Record<string, Article[]>);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showroomId,
          userId,
          items: lines.map((l) => ({
            articleId: l.articleId,
            categoryId: l.categoryId || null,
            locatieType: l.locatieType,
            locatieNummer: l.locatieNummer || null,
            bordNummer: l.locatieType === "BOK" ? l.bordNummer || null : null,
            displayAfmeting: l.displayAfmeting || null,
            stock: parseInt(l.stock) || 0,
            notes: l.notes,
            isDisplayMaterial: l.isDisplayMaterial,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/dashboard/inventory");
    } catch (e: any) {
      setError(e.message || "Er is een fout opgetreden");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Showroom selector */}
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

      {/* Per-category grouped sections */}
      <div className="space-y-4">
        {leafCats.map((cat, catIdx) => {
          const catLines = lines.filter((l) => l.categoryId === cat.id);
          const config = displayConfigs.find((d) => d.categoryId === cat.id);
          const catNr = catIdx + 1;
          return (
            <AfdelingSection
              key={cat.id}
              cat={cat}
              allCats={categories}
              catNr={catNr}
              lines={catLines}
              config={config}
              articles={articlesByCat[cat.id] ?? articles}
              allArticles={articles}
              onAddLine={() => addLine(cat.id)}
              onRemoveLine={removeLine}
              onUpdateLine={updateLine}
            />
          );
        })}
      </div>

      {/* Add line to a new afdeling */}
      <div className="flex justify-between items-center">
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex justify-end gap-3">
        <button onClick={() => router.push("/dashboard/inventory")} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          Annuleren
        </button>
        <button onClick={handleSave} disabled={saving || lines.length === 0} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
          <Save className="w-4 h-4" />
          {saving ? "Opslaan..." : `Opslaan (${lines.length} regels)`}
        </button>
      </div>
    </div>
  );
}

function AfdelingSection({
  cat, allCats, catNr, lines, config, articles, allArticles, onAddLine, onRemoveLine, onUpdateLine,
}: {
  cat: Category;
  allCats: Category[];
  catNr: number;
  lines: InventoryLine[];
  config?: DisplayConfig;
  articles: Article[];
  allArticles: Article[];
  onAddLine: () => void;
  onRemoveLine: (id: number) => void;
  onUpdateLine: (id: number, field: keyof InventoryLine | "locatie", value: string | boolean) => void;
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
          {config && (
            <span className="text-xs text-blue-500">
              {config.numWandborden} wanden · {config.numBokken} bokken
            </span>
          )}
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
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs w-16">Bord</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Display</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Artikel</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs w-32">Status</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 text-xs w-24">Verkoopprijs</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs w-20">Voorraad</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs w-20" title="Displaymateriaal — niet op schappenplan">Displaymat.</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs">Notitie</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50">
                <td className="px-3 py-1.5">
                  <select
                    value={encodeLocatie(line.locatieType, parseInt(line.locatieNummer) || 0)}
                    onChange={(e) => onUpdateLine(line.id, "locatie", e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {LOCATIE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  {line.locatieType === "BOK" ? (
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={line.bordNummer}
                      onChange={(e) => onUpdateLine(line.id, "bordNummer", e.target.value)}
                      placeholder="1-10"
                      className="w-14 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-300 text-xs px-2">—</span>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {(() => {
                    const opts = getAfmetingOptions(cat, allCats, line.locatieType === "BOK" ? "BOK" : "WAND");
                    return (
                      <select
                        value={line.displayAfmeting}
                        onChange={(e) => onUpdateLine(line.id, "displayAfmeting", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {opts.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    );
                  })()}
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
                {(() => {
                  const selected = allArticles.find((a) => a.id === line.articleId);
                  const status = selected?.status ?? "Collectie";
                  return (
                    <>
                      <td className="px-3 py-1.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusBadgeClass(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs text-gray-700">
                        {typeof selected?.sellingPrice === "number" ? `€ ${selected.sellingPrice.toFixed(2)}` : "—"}
                      </td>
                    </>
                  );
                })()}
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min="0"
                    value={line.stock}
                    onChange={(e) => onUpdateLine(line.id, "stock", e.target.value)}
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={line.isDisplayMaterial}
                    onChange={(e) => onUpdateLine(line.id, "isDisplayMaterial", e.target.checked)}
                    title="Alleen displaymateriaal — niet op schappenplan"
                    className="w-4 h-4 accent-blue-700"
                  />
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
