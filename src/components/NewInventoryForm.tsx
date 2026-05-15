"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ChevronDown, ChevronRight, Camera, X } from "lucide-react";
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
  locatieType: "WAND" | "BOK" | "STROK" | "STALENKAST";
  locatieNummer: string;
  bordNummer: string;
  displayAfmeting: string;
  articleId: string;
  stock: string;
  notes: string;
  isDisplayMaterial: boolean;
  images: string[];
  pendingFiles: { file: File; preview: string }[];
}

let lineCounter = 1;

function getLeafCategories(categories: Category[]) {
  const leaves = categories.filter((c) => !categories.some((cc) => cc.parentId === c.id));
  return leaves.length > 0 ? leaves : categories;
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
  const derivedLeafCats: Category[] = Array.from(
    new Map(
      articles.map((a, idx) => [
        a.category.id,
        { id: a.category.id, name: a.category.name, slug: a.category.id, parentId: null, order: idx } as Category,
      ])
    ).values()
  );
  const leafCats = getLeafCategories(categories).length > 0 ? getLeafCategories(categories) : derivedLeafCats;
  const firstCatId = leafCats[0]?.id ?? "";
  const firstArticle = articles[0]?.id ?? "";

  const [showroomId, setShowroomId] = useState(defaultShowroomId);
  const firstCat = leafCats[0];
  const initWandAfm = firstCat ? defaultAfmeting(firstCat, categories, "WAND") : "strook";
  const initBokAfm = firstCat ? defaultAfmeting(firstCat, categories, "BOK") : "120x60";
  const [lines, setLines] = useState<InventoryLine[]>([
    { id: lineCounter++, categoryId: firstCatId, locatieType: "WAND", locatieNummer: "1", bordNummer: "", displayAfmeting: initWandAfm, articleId: firstArticle, stock: "0", notes: "", isDisplayMaterial: false, images: [], pendingFiles: [] },
    { id: lineCounter++, categoryId: firstCatId, locatieType: "BOK",  locatieNummer: "1", bordNummer: "1", displayAfmeting: initBokAfm, articleId: firstArticle, stock: "0", notes: "", isDisplayMaterial: false, images: [], pendingFiles: [] },
    { id: lineCounter++, categoryId: firstCatId, locatieType: "BOK",  locatieNummer: "1", bordNummer: "2", displayAfmeting: initBokAfm, articleId: firstArticle, stock: "0", notes: "", isDisplayMaterial: false, images: [], pendingFiles: [] },
    { id: lineCounter++, categoryId: firstCatId, locatieType: "BOK",  locatieNummer: "1", bordNummer: "3", displayAfmeting: initBokAfm, articleId: firstArticle, stock: "0", notes: "", isDisplayMaterial: false, images: [], pendingFiles: [] },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cameraLineId, setCameraLineId] = useState<number | null>(null);
  const [draftCategoryId, setDraftCategoryId] = useState(firstCatId);
  const [draftLocatieType, setDraftLocatieType] = useState<InventoryLine["locatieType"]>("WAND");

  function addLine(categoryId?: string, locatieType: InventoryLine["locatieType"] = "WAND") {
    const catId = categoryId ?? firstCatId;
    const cat = leafCats.find((c) => c.id === catId);
    const afmType = locatieType === "BOK" || locatieType === "STALENKAST" ? locatieType : "WAND";
    setLines([...lines, {
      id: lineCounter++,
      categoryId: catId,
      locatieType,
      locatieNummer: "1",
      bordNummer: locatieType === "BOK" ? "1" : "",
      displayAfmeting: cat ? defaultAfmeting(cat, categories, afmType) : "strook",
      articleId: firstArticle,
      stock: "0",
      notes: "",
      isDisplayMaterial: false,
      images: [],
      pendingFiles: [],
    }]);
  }

  function removeLine(id: number) {
    setLines(lines.filter((l) => {
      if (l.id === id) {
        l.pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
      }
      return l.id !== id;
    }));
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
            const afmType = decoded.type === "BOK" || decoded.type === "STALENKAST" ? decoded.type : "WAND";
            updated.displayAfmeting = defaultAfmeting(cat, categories, afmType);
          }
        }
      } else {
        Object.assign(updated, { [field]: value });
        if (field === "categoryId") {
          const cat = leafCats.find((c) => c.id === value);
          if (cat) {
            const afmType = updated.locatieType === "BOK" || updated.locatieType === "STALENKAST" ? updated.locatieType : "WAND";
            updated.displayAfmeting = defaultAfmeting(cat, categories, afmType);
          }
        }
      }
      return updated;
    }));
  }

  function addPendingFiles(lineId: number, files: FileList | File[]) {
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    const newPending = fileArray.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setLines(lines.map((l) =>
      l.id === lineId ? { ...l, pendingFiles: [...l.pendingFiles, ...newPending] } : l
    ));
  }

  function removePendingFile(lineId: number, preview: string) {
    URL.revokeObjectURL(preview);
    setLines(lines.map((l) =>
      l.id === lineId ? { ...l, pendingFiles: l.pendingFiles.filter((f) => f.preview !== preview) } : l
    ));
  }

  function removeUploadedUrl(lineId: number, url: string) {
    setLines(lines.map((l) =>
      l.id === lineId ? { ...l, images: l.images.filter((u) => u !== url) } : l
    ));
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
      const linesWithImages = await Promise.all(
        lines.map(async (l) => {
          let imageUrls = [...l.images];
          if (l.pendingFiles.length > 0) {
            const formData = new FormData();
            l.pendingFiles.forEach((pf) => formData.append("files", pf.file));
            const uploadRes = await fetch("/api/inventory/upload", {
              method: "POST",
              body: formData,
            });
            if (!uploadRes.ok) throw new Error("Upload mislukt");
            const { keys } = await uploadRes.json();
            imageUrls = [...imageUrls, ...keys];
            l.pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
          }
          return { ...l, images: imageUrls };
        })
      );

      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showroomId,
          userId,
          items: linesWithImages.map((l) => ({
            articleId: l.articleId,
            categoryId: l.categoryId || null,
            locatieType: l.locatieType,
            locatieNummer: l.locatieNummer || null,
            bordNummer: l.locatieType === "BOK" ? l.bordNummer || null : null,
            displayAfmeting: l.displayAfmeting || null,
            stock: parseInt(l.stock) || 0,
            notes: l.notes,
            isDisplayMaterial: l.isDisplayMaterial,
            images: l.images,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/dashboard/inventory");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er is een fout opgetreden");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-lg:space-y-4">
      {showrooms.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 max-lg:p-3 flex items-center gap-4 max-lg:flex-col max-lg:items-start max-lg:gap-2 mobile-fade-in">
          <label className="text-sm font-medium text-gray-700">Showroom</label>
          <select
            value={showroomId}
            onChange={(e) => setShowroomId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-lg:w-full max-lg:py-2.5"
          >
            {showrooms.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      <div className="space-y-4">
        <div className="lg:hidden bg-white rounded-xl border border-gray-200 p-4 space-y-3 mobile-fade-in">
          <p className="text-xs text-gray-500">Kies afdeling en locatietype, voeg daarna een regel toe.</p>
          <div className="grid grid-cols-1 gap-2">
            <select
              value={draftCategoryId}
              onChange={(e) => setDraftCategoryId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {leafCats.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <select
              value={draftLocatieType}
              onChange={(e) => setDraftLocatieType(e.target.value as InventoryLine["locatieType"])}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="WAND">Wand</option>
              <option value="BOK">Bok</option>
              <option value="STROK">Strook</option>
              <option value="STALENKAST">Stalenkast</option>
            </select>
            <button
              type="button"
              onClick={() => addLine(draftCategoryId, draftLocatieType)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 mobile-animate-fast"
            >
              <Plus className="w-3.5 h-3.5" />
              Regel toevoegen
            </button>
          </div>
        </div>
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
              onAddPendingFiles={addPendingFiles}
              onRemovePendingFile={removePendingFile}
              onRemoveUploadedUrl={removeUploadedUrl}
              onCameraCaptureStart={(id) => setCameraLineId(id)}
            />
          );
        })}
      </div>

      <div className="flex justify-between items-center max-lg:hidden">
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

      <CameraModal
        lineId={cameraLineId}
        onCapture={(id, files) => {
          setCameraLineId(null);
          addPendingFiles(id, files);
        }}
        onClose={() => setCameraLineId(null)}
      />

      <div className="flex justify-end gap-3 max-lg:flex-col">
        <button onClick={() => router.push("/dashboard/inventory")} className="px-4 py-2 max-lg:py-3 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 mobile-animate-fast">
          Annuleren
        </button>
        <button onClick={handleSave} disabled={saving || lines.length === 0} className="flex items-center justify-center gap-2 px-4 py-2 max-lg:py-3 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60 mobile-animate-fast">
          <Save className="w-4 h-4" />
          {saving ? "Opslaan..." : `Opslaan (${lines.length} regels)`}
        </button>
      </div>
    </div>
  );
}

function AfdelingSection({
  cat, allCats, catNr, lines, config, articles, allArticles, onAddLine, onRemoveLine, onUpdateLine,
  onAddPendingFiles, onRemovePendingFile, onRemoveUploadedUrl, onCameraCaptureStart,
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
  onAddPendingFiles: (lineId: number, files: FileList | File[]) => void;
  onRemovePendingFile: (lineId: number, preview: string) => void;
  onRemoveUploadedUrl: (lineId: number, url: string) => void;
  onCameraCaptureStart: (lineId: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const articleOptions = articles.length > 0 ? articles : allArticles;

  if (lines.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mobile-fade-in">
      <div
        className="flex items-center justify-between px-4 py-3 max-lg:px-3.5 max-lg:py-2.5 bg-blue-50 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
            {catNr}
          </span>
          <span className="font-semibold text-blue-900 text-sm truncate">{cat.name}</span>
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
            className="hidden lg:flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100 mobile-animate-fast"
          >
            <Plus className="w-3 h-3" /> Regel
          </button>
          {open ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-blue-500" />}
        </div>
      </div>

      {open && (
        <div className="overflow-x-auto no-scrollbar scroll-edge-fade max-lg:px-1">
        <table className="w-full text-sm max-lg:text-xs max-lg:min-w-[760px]">
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
              <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs w-[140px]">Foto{"'"}s</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50 mobile-animate-fast">
                <td className="px-3 py-1.5">
                  <select
                    value={encodeLocatie(line.locatieType, parseInt(line.locatieNummer) || 0)}
                    onChange={(e) => onUpdateLine(line.id, "locatie", e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1 text-xs max-lg:h-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                      className="w-14 border border-gray-200 rounded px-2 py-1 text-xs text-center max-lg:h-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-300 text-xs px-2">—</span>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {(() => {
                    const afmType = line.locatieType === "BOK" || line.locatieType === "STALENKAST" ? line.locatieType : "WAND";
                    const opts = getAfmetingOptions(cat, allCats, afmType);
                    return (
                      <select
                        value={line.displayAfmeting}
                        onChange={(e) => onUpdateLine(line.id, "displayAfmeting", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs max-lg:h-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs max-lg:h-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-right max-lg:h-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs max-lg:h-8 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1">
                      {line.images.map((key) => (
                        <div key={key} className="relative group w-10 h-10 rounded overflow-hidden border border-gray-200">
                          <img src={`/api/inventory/images?path=${encodeURIComponent(key)}`} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => onRemoveUploadedUrl(line.id, key)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                      {line.pendingFiles.map((pf) => (
                        <div key={pf.preview} className="relative group w-10 h-10 rounded overflow-hidden border border-gray-200">
                          <img src={pf.preview} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-blue-200/40" />
                          <button
                            onClick={() => onRemovePendingFile(line.id, pf.preview)}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <X className="w-3 h-3 text-gray-700" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onCameraCaptureStart(line.id)}
                      className="inline-flex items-center gap-1 text-xs text-white bg-blue-700 hover:bg-blue-800 px-2.5 py-1.5 rounded-lg font-medium mobile-animate-fast"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Foto</span>
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => onRemoveLine(line.id)} className="text-gray-300 hover:text-red-500 mobile-animate-fast">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

function CameraModal({ lineId, onCapture, onClose }: { lineId: number | null; onCapture: (id: number, files: File[]) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"camera" | "gallery">("camera");
  const [staged, setStaged] = useState<{ file: File; preview: string }[]>([]);

  useEffect(() => {
    if (!lineId) { setMode("camera"); setError(null); setStaged([]); return; }
    const video = videoRef.current;
    if (!video || mode !== "camera") return;

    let mounted = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        if (mounted && videoRef.current) {
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => setError("Camera niet beschikbaar"));

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [lineId, mode]);

  function handleSwitchMode(newMode: "camera" | "gallery") {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    setError(null);
    setMode(newMode);
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
        setStaged(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
      }
    }, "image/jpeg", 0.95);
  }

  function handleGalleryFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setStaged(prev => [...prev, ...newFiles]);
  }

  function removeStaged(idx: number) {
    setStaged(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function handleConfirm() {
    if (!lineId || staged.length === 0) { handleCancel(); return; }
    onCapture(lineId, staged.map(s => s.file));
  }

  function handleCancel() {
    staged.forEach(s => URL.revokeObjectURL(s.preview));
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    onClose();
  }

  if (!lineId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl overflow-hidden max-w-lg w-full p-4 flex flex-col items-center gap-3">
        <h3 className="font-semibold text-lg">Foto{"'"}s toevoegen</h3>

        <div className="flex gap-2 w-full justify-center">
          <button
            onClick={() => handleSwitchMode("camera")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${mode === "camera" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Camera
            </span>
          </button>
          <button
            onClick={() => handleSwitchMode("gallery")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${mode === "gallery" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <span className="flex items-center gap-1.5">
              Galerij
            </span>
          </button>
        </div>

        {mode === "camera" ? (
          <>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black aspect-video" />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <div
            className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center py-12 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Tik om foto{"'"}s te kiezen</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleGalleryFiles(e.target.files); e.target.value = ""; }} />

        {staged.length > 0 && (
          <div className="w-full">
            <p className="text-xs text-gray-500 mb-1.5 w-full text-center">{staged.length} foto{staged.length !== 1 ? "'s" : ""} geselecteerd</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {staged.map((s, idx) => (
                <div key={s.preview} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-gray-200">
                  <img src={s.preview} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeStaged(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full justify-center">
          <button onClick={handleCancel} className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50">Annuleren</button>
          {mode === "camera" && <button onClick={capture} className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800">Foto maken</button>}
          <button onClick={handleConfirm} disabled={staged.length === 0} className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
            Toevoegen ({staged.length})
          </button>
        </div>
      </div>
    </div>
  );
}
