"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import type { CategoryTree } from "@/types";
import { getAfmetingOptions, labelForAfmeting, statusBadgeClass, type CategoryLite } from "@/lib/displayOptions";

interface PlanogramItem {
  id: string;
  categoryId: string;
  locatieType: string;
  locatieNummer: number;
  positie: number;
  displayAfmeting: string;
  notes: string | null;
  article: {
    id: string;
    articleNumber: string;
    articleName: string;
    supplierNameAnonymized: string;
    supplierNameReal: string;
    priorityScore: number;
    status?: string;
  };
}

interface DisplayConfig {
  categoryId: string;
  numStroken: number;
  numWandborden: number;
  numBokken: number;
  category: { name: string };
}

interface Props {
  showroomId: string;
  categoryTree: CategoryTree[];
  planogramItems: PlanogramItem[];
  displayConfigs: DisplayConfig[];
  isHQ: boolean;
}

interface LocatieTerms {
  wand: string;
  bok: string;
  wandShort: string;
  bokShort: string;
  afmetingLabel: string;
  afmetingEditable: boolean;
  // returns display string, or null to show nothing
  afmetingDisplay: (locatieType: string, value: string) => string | null;
}

const DEFAULT_TERMS: LocatieTerms = {
  wand: "Wand", bok: "Bok", wandShort: "w", bokShort: "b",
  afmetingLabel: "Afmeting", afmetingEditable: false,
  afmetingDisplay: (_type, value) => value === "STROK" ? "Strok" : value ? `${value} cm` : null,
};

const GORDIJNEN_TERMS: LocatieTerms = {
  wand: "Vak", bok: "Rek", wandShort: "vak", bokShort: "rek",
  afmetingLabel: "Specificatie", afmetingEditable: false,
  afmetingDisplay: (type, value) => type === "BOK" ? null : value || null,
};

const HARD_RAAM_TERMS: LocatieTerms = {
  wand: "Wand", bok: "Bok", wandShort: "w", bokShort: "b",
  afmetingLabel: "Afmeting", afmetingEditable: true,
  afmetingDisplay: (_type, value) => value || null,
};

const RENO_TRAP_TERMS: LocatieTerms = {
  ...DEFAULT_TERMS,
  wand: "Kast", wandShort: "kast",
};

const LIJM_TRAP_TERMS: LocatieTerms = {
  ...DEFAULT_TERMS,
  wand: "Showmodel", wandShort: "show",
};

const CAT_TERMS: Record<string, LocatieTerms> = {
  "cat-gordijnen": GORDIJNEN_TERMS,
  "cat-duette":    HARD_RAAM_TERMS,
  "cat-alu":       HARD_RAAM_TERMS,
  "cat-houtjal":   HARD_RAAM_TERMS,
  "cat-rolgor":    HARD_RAAM_TERMS,
  "cat-vouwgor":   HARD_RAAM_TERMS,
  "cat-trap-hpl":  RENO_TRAP_TERMS,
  "cat-trap-pvc":  RENO_TRAP_TERMS,
  "cat-trap-lijm": LIJM_TRAP_TERMS,
};

function getTerms(catId: string): LocatieTerms {
  return CAT_TERMS[catId] ?? DEFAULT_TERMS;
}

interface ConfigEditorProps {
  config: DisplayConfig;
  showroomId: string;
  categoryId: string;
  terms: LocatieTerms;
}

function ConfigEditor({ config, showroomId, categoryId, terms }: ConfigEditorProps) {
  const [wand, setWand] = useState(config.numWandborden);
  const [bok, setBok] = useState(config.numBokken);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = wand !== config.numWandborden || bok !== config.numBokken;

  async function save() {
    setSaving(true);
    await fetch("/api/display-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, showroomId, categoryId, numWandborden: wand, numBokken: bok }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <span className="text-xs text-blue-400">{terms.wandShort}:</span>
      <input
        type="number" min="0" max="50" value={wand}
        onChange={(e) => setWand(parseInt(e.target.value) || 0)}
        className="w-10 text-xs text-center bg-white border border-blue-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <span className="text-xs text-blue-400">{terms.bokShort}:</span>
      <input
        type="number" min="0" max="20" value={bok}
        onChange={(e) => setBok(parseInt(e.target.value) || 0)}
        className="w-10 text-xs text-center bg-white border border-blue-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      {(dirty || saved) && (
        <button
          onClick={save}
          disabled={saving}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition ${
            saved ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          } disabled:opacity-60`}
        >
          <Check className="w-3 h-3" />
          {saving ? "..." : saved ? "Ok" : "Opslaan"}
        </button>
      )}
      <span className="text-xs text-blue-400">· {config.numStroken}s</span>
    </div>
  );
}

function locatieLabel(type: string, nummer: number, terms: LocatieTerms) {
  if (type === "WAND") return `${terms.wand} ${nummer}`;
  if (type === "BOK") return `${terms.bok} ${nummer}`;
  if (type === "STROK") return `Strok ${nummer}`;
  return `${type} ${nummer}`;
}

function locatieColor(type: string) {
  if (type === "WAND") return "bg-purple-100 text-purple-700";
  if (type === "BOK") return "bg-blue-100 text-blue-700";
  if (type === "STROK") return "bg-gray-100 text-gray-600";
  return "bg-gray-100 text-gray-500";
}

function afmetingBadge(afmeting: string) {
  if (afmeting === "120x60") return "bg-blue-50 text-blue-600 border border-blue-200";
  if (afmeting === "100x60") return "bg-purple-50 text-purple-600 border border-purple-200";
  return "bg-gray-50 text-gray-500 border border-gray-200";
}

function getLeafCategories(tree: CategoryTree[]): CategoryTree[] {
  const leaves: CategoryTree[] = [];
  for (const cat of tree) {
    if (cat.children.length === 0) leaves.push(cat);
    else leaves.push(...getLeafCategories(cat.children));
  }
  return leaves;
}

function flattenTree(tree: CategoryTree[]): CategoryLite[] {
  const out: CategoryLite[] = [];
  const walk = (nodes: CategoryTree[]) => {
    for (const n of nodes) {
      out.push({ id: n.id, slug: n.slug, parentId: n.parentId });
      walk(n.children);
    }
  };
  walk(tree);
  return out;
}

function AfmetingCell({ itemId, value }: { itemId: string; value: string }) {
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);

  async function save(newVal: string) {
    if (newVal === value) return;
    setSaving(true);
    await fetch(`/api/planogram?id=${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayAfmeting: newVal }),
    });
    setSaving(false);
  }

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={(e) => save(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      placeholder="—"
      className={`w-28 text-xs border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
        saving ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    />
  );
}

function AfmetingSelectCell({
  itemId, value, options, includeCurrent,
}: {
  itemId: string;
  value: string;
  options: { value: string; label: string }[];
  includeCurrent?: boolean;
}) {
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);

  async function save(newVal: string) {
    if (newVal === value) return;
    setSaving(true);
    await fetch(`/api/planogram?id=${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayAfmeting: newVal }),
    });
    setSaving(false);
  }

  const hasCurrent = options.some((o) => o.value === val);
  return (
    <select
      value={val}
      onChange={(e) => { setVal(e.target.value); save(e.target.value); }}
      className={`text-xs border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
        saving ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"
      }`}
    >
      {includeCurrent && !hasCurrent && val && (
        <option value={val}>{labelForAfmeting(val)}</option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function SubafdelingSection({
  cat, allCats, catNr, items, config, isHQ, showroomId,
}: {
  cat: CategoryTree; allCats: CategoryLite[]; catNr: number; items: PlanogramItem[];
  config?: DisplayConfig; isHQ: boolean; showroomId: string;
}) {
  const [open, setOpen] = useState(true);
  const terms = getTerms(cat.id);
  if (items.length === 0) return null;

  const locatieGroups = items.reduce((acc, item) => {
    const key = `${item.locatieType}-${item.locatieNummer}`;
    if (!acc[key]) acc[key] = { type: item.locatieType, nummer: item.locatieNummer, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { type: string; nummer: number; items: PlanogramItem[] }>);

  const typeOrder: Record<string, number> = { WAND: 0, BOK: 1, STROK: 2 };
  const sortedLocaties = Object.values(locatieGroups).sort((a, b) => {
    const diff = (typeOrder[a.type] ?? 3) - (typeOrder[b.type] ?? 3);
    return diff !== 0 ? diff : a.nummer - b.nummer;
  });

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
          {config && isHQ && (
            <ConfigEditor config={config} showroomId={showroomId} categoryId={cat.id} terms={terms} />
          )}
          {config && !isHQ && (
            <span className="text-xs text-blue-400">
              {config.numWandborden}{terms.wandShort} · {config.numBokken}{terms.bokShort} · {config.numStroken}s
            </span>
          )}
          <span className="text-xs text-blue-400">{items.length} artikel{items.length !== 1 ? "en" : ""}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-blue-500" />}
      </div>

      {open && (
        <div className="divide-y divide-gray-100">
          {sortedLocaties.map((locatie) => (
            <div key={`${locatie.type}-${locatie.nummer}`} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${locatieColor(locatie.type)}`}>
                  {locatieLabel(locatie.type, locatie.nummer, terms)}
                </span>
                <span className="text-xs text-gray-400">{locatie.items.length} positie{locatie.items.length !== 1 ? "s" : ""}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-1.5 pr-4 font-medium w-14">Pos.</th>
                    <th className="text-left pb-1.5 pr-4 font-medium w-28">Artikelnr.</th>
                    <th className="text-left pb-1.5 pr-4 font-medium">Artikelnaam</th>
                    <th className="text-left pb-1.5 pr-4 font-medium">Bord / Strook</th>
                    <th className="text-left pb-1.5 pr-4 font-medium">{terms.afmetingLabel}</th>
                    {isHQ && <th className="text-left pb-1.5 font-medium">Leverancier</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...locatie.items]
                    .sort((a, b) => a.positie - b.positie)
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4">
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {item.positie}
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs text-gray-600">{item.article.articleNumber}</td>
                        <td className="py-2 pr-4 font-medium text-gray-900">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{item.article.articleName}</span>
                            {item.article.status && item.article.status !== "Collectie" && (
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusBadgeClass(item.article.status)}`}>
                                {item.article.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${afmetingBadge(item.displayAfmeting)}`}>
                            {labelForAfmeting(item.displayAfmeting)}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {(() => {
                            const opts = getAfmetingOptions(
                              { id: cat.id, slug: cat.slug, parentId: cat.parentId },
                              allCats,
                              locatie.type === "BOK" ? "BOK" : "WAND",
                            );
                            if (isHQ && (terms.afmetingEditable || opts.length > 1)) {
                              return <AfmetingSelectCell itemId={item.id} value={item.displayAfmeting} options={opts} includeCurrent />;
                            }
                            if (isHQ && terms.afmetingEditable) {
                              return <AfmetingCell itemId={item.id} value={item.displayAfmeting} />;
                            }
                            const spec = terms.afmetingDisplay(locatie.type, item.displayAfmeting);
                            return spec
                              ? <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${afmetingBadge(item.displayAfmeting)}`}>{labelForAfmeting(spec)}</span>
                              : <span className="text-xs text-gray-300">—</span>;
                          })()}
                        </td>
                        {isHQ && <td className="py-2 text-xs text-gray-500">{item.article.supplierNameReal}</td>}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RootSection({
  root, allCats, planogramItems, displayConfigs, isHQ, showroomId,
}: {
  root: CategoryTree; allCats: CategoryLite[]; planogramItems: PlanogramItem[];
  displayConfigs: DisplayConfig[]; isHQ: boolean; showroomId: string;
}) {
  const [open, setOpen] = useState(true);
  const leafCats = getLeafCategories([root]);
  const totalItems = planogramItems.filter((i) => leafCats.some((l) => l.id === i.categoryId)).length;
  if (totalItems === 0) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl text-left hover:bg-gray-700 transition"
      >
        <span className="font-bold text-white text-sm">{root.name}</span>
        <span className="text-xs text-gray-400">{totalItems} artikel{totalItems !== 1 ? "en" : ""}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
          : <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />}
      </button>
      {open && (
        <div className="space-y-3 pl-3 border-l-2 border-gray-200">
          {leafCats.map((cat, idx) => {
            const catItems = planogramItems.filter((i) => i.categoryId === cat.id);
            const config = displayConfigs.find((c) => c.categoryId === cat.id);
            return (
              <SubafdelingSection
                key={cat.id}
                cat={cat}
                allCats={allCats}
                catNr={idx + 1}
                items={catItems}
                config={config}
                isHQ={isHQ}
                showroomId={showroomId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PlanogramView({ showroomId, categoryTree, planogramItems, displayConfigs, isHQ }: Props) {
  const allCats = flattenTree(categoryTree);
  return (
    <div className="space-y-5">
      {categoryTree.map((root) => (
        <RootSection
          key={root.id}
          root={root}
          allCats={allCats}
          planogramItems={planogramItems}
          displayConfigs={displayConfigs}
          isHQ={isHQ}
          showroomId={showroomId}
        />
      ))}
      {planogramItems.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-gray-400 text-sm">Nog geen schappenplan items</p>
        </div>
      )}
    </div>
  );
}
