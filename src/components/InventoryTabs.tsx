"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, AlertCircle } from "lucide-react";

// ── shared helpers ────────────────────────────────────────────────────────────

function locatieLabel(locatieType: string | null, locatieNummer: number | null, bordNummer?: number | null) {
  if (!locatieType) return "—";
  if (locatieType === "STROK") return `Strok ${locatieNummer ?? ""}`.trim();
  if (locatieType === "WAND")  return `Wand ${locatieNummer ?? ""}`.trim();
  if (locatieType === "BOK") {
    const bok = `Bok ${locatieNummer ?? ""}`.trim();
    return bordNummer ? `${bok} / Bord ${bordNummer}` : bok;
  }
  return "—";
}

function locatieColor(type: string | null) {
  if (type === "WAND")  return "bg-purple-100 text-purple-700";
  if (type === "BOK")   return "bg-blue-100 text-blue-700";
  if (type === "STROK") return "bg-gray-100 text-gray-600";
  return "bg-gray-100 text-gray-500";
}

// ── types ────────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  locatieType: string | null;
  locatieNummer: number | null;
  bordNummer: number | null;
  stock: number;
  notes: string | null;
  createdAt: string;
  isDisplayMaterial?: boolean;
  displayAfmeting?: string | null;
  article: { articleNumber: string; articleName: string };
  createdBy: { name: string };
}

export interface LeafGroup { name: string; items: InventoryItem[] }
export interface RootGroup  { name: string; order: number; cats: Record<string, LeafGroup> }

export interface VerschilItem {
  articleNumber: string;
  articleName: string;
  catName: string;
  catId: string;
  locatieType: string;
  locatieNummer: number;
}

export interface VerschilRoot { name: string; order: number; items: VerschilItem[]; leafOrder: string[] }

export interface ShowFloorVerschilItem {
  id: string;
  nummer: string | null;
  articleNumber: string;
  articleName: string;
  status: string | null;
  notes: string | null;
}

// ── Inventarisatie tab ────────────────────────────────────────────────────────

function InventarisatieTab({
  sortedRoots, hasLocatie,
}: {
  sortedRoots: [string, RootGroup][];
  hasLocatie: boolean;
}) {
  if (sortedRoots.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
      <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">Nog geen inventarisaties</p>
      <Link href="/dashboard/inventory/new" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
        Maak de eerste aan
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {sortedRoots.map(([rootId, rootGroup], rootIdx) => {
        const sortedCats = Object.entries(rootGroup.cats);
        const rootTotal = sortedCats.reduce((s, [, g]) => s + g.items.length, 0);
        return (
          <div key={rootId} className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl">
              <span className="font-bold text-white text-sm">{rootGroup.name}</span>
              <span className="text-xs text-gray-400">{rootTotal} regel{rootTotal !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-3 pl-3 border-l-2 border-gray-200">
              {sortedCats.map(([catId, group], catIdx) => (
                <div key={catId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
                    <span className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">{catIdx + 1}</span>
                    <h2 className="font-semibold text-blue-900 text-sm">{group.name}</h2>
                    <span className="text-xs text-blue-400 ml-auto">{group.items.length} regel{group.items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {hasLocatie && <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Locatie</th>}
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnummer</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnaam</th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600 text-xs">Voorraad</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Notitie</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Door</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Datum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.items.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50">
                          {hasLocatie && (
                            <td className="px-4 py-2.5">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${locatieColor(inv.locatieType)}`}>
                                {locatieLabel(inv.locatieType, inv.locatieNummer, inv.bordNummer)}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{inv.article.articleNumber}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {inv.article.articleName}
                            {inv.isDisplayMaterial && (
                              <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 align-middle">
                                Displaymateriaal
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                              inv.stock > 10 ? "bg-green-100 text-green-700" :
                              inv.stock > 0  ? "bg-orange-100 text-orange-700" :
                                               "bg-red-100 text-red-700"
                            }`}>
                              {inv.stock} st.
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{inv.notes ?? "—"}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{inv.createdBy.name}</td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">
                            {new Date(inv.createdAt).toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Verschil tab ──────────────────────────────────────────────────────────────

function VerschilSection({
  title, roots, emptyText, badge,
}: {
  title: string;
  roots: VerschilRoot[];
  emptyText: string;
  badge: string;
}) {
  const total = roots.reduce((s, r) => s + r.items.length, 0);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        {total > 0
          ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{total}</span>
          : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ volledig</span>}
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
          <p className="text-gray-400 text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...roots].sort((a, b) => a.order - b.order).map((root) => {
            const sorted = [...root.items].sort((a, b) => {
              const ai = root.leafOrder.indexOf(a.catId);
              const bi = root.leafOrder.indexOf(b.catId);
              return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            });
            return (
              <div key={root.name} className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-800 rounded-xl">
                  <span className="font-bold text-white text-sm">{root.name}</span>
                  <span className="text-xs text-gray-400">{sorted.length} artikel{sorted.length !== 1 ? "en" : ""}</span>
                </div>
                <div className="pl-3 border-l-2 border-gray-200">
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Categorie</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnummer</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnaam</th>
                          <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Locatie</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {sorted.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-xs text-gray-500">{item.catName}</td>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{item.articleNumber}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-900">{item.articleName}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${locatieColor(item.locatieType)}`}>
                                {locatieLabel(item.locatieType, item.locatieNummer)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function statusColor(status: string | null) {
  if (status === "aanwezig, niet beschadigd") return "bg-green-100 text-green-700";
  if (status === "aanwezig, beschadigd")      return "bg-orange-100 text-orange-700";
  if (status === "niet aanwezig")             return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-500";
}

function VerschilTab({
  missing, extra, showFloorItems,
}: {
  missing: VerschilRoot[];
  extra: VerschilRoot[];
  showFloorItems: ShowFloorVerschilItem[];
}) {
  return (
    <div className="space-y-8">
      <VerschilSection
        title="In schappenplan, niet geïnventariseerd"
        roots={missing}
        emptyText="Alle artikelen uit het schappenplan zijn geïnventariseerd"
        badge="bg-orange-100 text-orange-700"
      />
      <VerschilSection
        title="Geïnventariseerd, niet in schappenplan"
        roots={extra}
        emptyText="Geen extra inventarisaties buiten het schappenplan"
        badge="bg-blue-100 text-blue-700"
      />

      {/* Showvloer — altijd als laatste */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-800 text-sm">Showvloer</h2>
          <span className="text-xs text-gray-400">{showFloorItems.length} display{showFloorItems.length !== 1 ? "s" : ""}</span>
        </div>
        {showFloorItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-8 text-center">
            <p className="text-gray-400 text-sm">Geen showvloer items</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Nr.</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnummer</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnaam</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Status</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Notitie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {showFloorItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{item.nummer ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{item.articleNumber}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{item.articleName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(item.status)}`}>
                        {item.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{item.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function InventoryTabs({
  sortedRoots, hasLocatie, verschilMissing, verschilExtra, showFloorItems,
}: {
  sortedRoots: [string, RootGroup][];
  hasLocatie: boolean;
  verschilMissing: VerschilRoot[];
  verschilExtra: VerschilRoot[];
  showFloorItems: ShowFloorVerschilItem[];
}) {
  const [tab, setTab] = useState<"inventarisatie" | "verschil">("inventarisatie");

  const missingCount  = verschilMissing.reduce((s, r) => s + r.items.length, 0);
  const extraCount    = verschilExtra.reduce((s, r)   => s + r.items.length, 0);
  const verschilCount = missingCount + extraCount;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["inventarisatie", "verschil"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "inventarisatie" ? "Inventarisatie" : "Verschil"}
            {t === "verschil" && verschilCount > 0 && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                {verschilCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "inventarisatie"
        ? <InventarisatieTab sortedRoots={sortedRoots} hasLocatie={hasLocatie} />
        : <VerschilTab missing={verschilMissing} extra={verschilExtra} showFloorItems={showFloorItems} />}
    </div>
  );
}
