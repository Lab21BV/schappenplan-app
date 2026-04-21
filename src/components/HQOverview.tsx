"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle, Minus } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShowroomStat = {
  id: string;
  name: string;
  planogramCount: number;
  inventoryCount: number;
  missingCount: number;
  extraCount: number;
};

export type SupplierRow = {
  articleNumber: string;
  articleName: string;
  supplier: string;
  planShowrooms: number;
  invShowrooms: number;
  planTotal: number;
  invTotal: number;
  verschilShowrooms: number;
};

export type VerschilItem = {
  articleNumber: string;
  articleName: string;
  supplier: string;
  catName: string;
  locatieType: string;
  locatieNummer: number;
};

export type VerschilShowroom = {
  showroomId: string;
  showroomName: string;
  missing: VerschilItem[];
  extra: VerschilItem[];
};

// ── ShowroomsOverview ─────────────────────────────────────────────────────────

export function ShowroomsOverview({ stats, totalShowrooms }: { stats: ShowroomStat[]; totalShowrooms: number }) {
  const totals = stats.reduce(
    (acc, s) => ({ plan: acc.plan + s.planogramCount, inv: acc.inv + s.inventoryCount, missing: acc.missing + s.missingCount, extra: acc.extra + s.extraCount }),
    { plan: 0, inv: 0, missing: 0, extra: 0 }
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Showroom</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Schappenplan</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Inventaris</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Ontbreekt</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Extra</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {stats.map((s) => {
            const ok = s.missingCount === 0 && s.extraCount === 0 && s.inventoryCount > 0;
            const noInv = s.inventoryCount === 0;
            return (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{s.planogramCount}</td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{s.inventoryCount}</td>
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${s.missingCount > 0 ? "text-red-600" : "text-gray-400"}`}>
                  {s.missingCount > 0 ? s.missingCount : "—"}
                </td>
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${s.extraCount > 0 ? "text-amber-600" : "text-gray-400"}`}>
                  {s.extraCount > 0 ? s.extraCount : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  {noInv
                    ? <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Minus className="w-3 h-3" />Geen inv.</span>
                    : ok
                    ? <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="w-3 h-3" />OK</span>
                    : <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium"><AlertCircle className="w-3 h-3" />Verschil</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-blue-50 border-t border-blue-100">
          <tr>
            <td className="px-4 py-3 font-semibold text-blue-900">Totaal ({totalShowrooms} showrooms)</td>
            <td className="px-4 py-3 text-right tabular-nums font-semibold text-blue-900">{totals.plan}</td>
            <td className="px-4 py-3 text-right tabular-nums font-semibold text-blue-900">{totals.inv}</td>
            <td className={`px-4 py-3 text-right tabular-nums font-semibold ${totals.missing > 0 ? "text-red-600" : "text-blue-900"}`}>{totals.missing || "—"}</td>
            <td className={`px-4 py-3 text-right tabular-nums font-semibold ${totals.extra > 0 ? "text-amber-600" : "text-blue-900"}`}>{totals.extra || "—"}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── LeveranciersOverview ──────────────────────────────────────────────────────

export function LeveranciersOverview({ rows, totalShowrooms }: { rows: SupplierRow[]; totalShowrooms: number }) {
  const [openSuppliers, setOpenSuppliers] = useState<Set<string>>(new Set());

  function toggle(supplier: string) {
    setOpenSuppliers((prev) => {
      const next = new Set(prev);
      next.has(supplier) ? next.delete(supplier) : next.add(supplier);
      return next;
    });
  }

  const bySupplier = rows.reduce((acc, row) => {
    if (!acc[row.supplier]) acc[row.supplier] = [];
    acc[row.supplier].push(row);
    return acc;
  }, {} as Record<string, SupplierRow[]>);

  return (
    <div className="space-y-2">
      {Object.keys(bySupplier).sort().map((supplier) => {
        const articles = bySupplier[supplier];
        const open = openSuppliers.has(supplier);
        const supplierPlan = articles.reduce((s, a) => s + a.planTotal, 0);
        const supplierInv = articles.reduce((s, a) => s + a.invTotal, 0);
        const supplierVerschil = articles.reduce((s, a) => s + a.verschilShowrooms, 0);

        return (
          <div key={supplier} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => toggle(supplier)}
            >
              <div className="flex items-center gap-3">
                {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <span className="font-semibold text-gray-900 text-sm">{supplier}</span>
                <span className="text-xs text-gray-400">{articles.length} artikel{articles.length !== 1 ? "en" : ""}</span>
              </div>
              <div className="flex items-center gap-8 text-sm">
                <span className="text-gray-500">Plan: <span className="font-medium text-gray-900 tabular-nums">{supplierPlan}</span></span>
                <span className="text-gray-500">Inv.: <span className="font-medium text-gray-900 tabular-nums">{supplierInv}</span></span>
                {supplierVerschil > 0
                  ? <span className="text-red-600 font-medium">{supplierVerschil} verschil</span>
                  : <span className="text-green-600 font-medium">✓</span>}
              </div>
            </button>

            {open && (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-white">
                  <tr>
                    <th className="text-left px-6 py-2 font-medium text-gray-500 text-xs">Artikel</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">In plan (totaal)</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Plan showrooms</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Inv. showrooms</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Verschil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {articles.map((a) => (
                    <tr key={a.articleNumber} className="hover:bg-gray-50">
                      <td className="px-6 py-2">
                        <span className="font-mono text-xs text-gray-500 mr-2">{a.articleNumber}</span>
                        <span className="text-gray-800">{a.articleName}</span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-700">{a.planTotal}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-700">{a.planShowrooms}/{totalShowrooms}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-700">{a.invShowrooms}/{totalShowrooms}</td>
                      <td className={`px-4 py-2 text-right tabular-nums font-medium ${a.verschilShowrooms > 0 ? "text-red-600" : "text-green-600"}`}>
                        {a.verschilShowrooms > 0 ? `${a.verschilShowrooms} showroom${a.verschilShowrooms !== 1 ? "s" : ""}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── VerschilDetail ────────────────────────────────────────────────────────────

export function VerschilDetail({ items }: { items: VerschilShowroom[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set(items.map((i) => i.showroomId)));

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-gray-900">Geen verschil gevonden</p>
        <p className="text-sm text-gray-500 mt-1">Alle showrooms met inventaris komen overeen met het schappenplan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((sr) => {
        const isOpen = open.has(sr.showroomId);
        return (
          <div key={sr.showroomId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => toggle(sr.showroomId)}
            >
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <span className="font-semibold text-gray-900">{sr.showroomName}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {sr.missing.length > 0 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">{sr.missing.length} ontbreekt in inv.</span>}
                {sr.extra.length > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">{sr.extra.length} extra in inv.</span>}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {sr.missing.length > 0 && <VerschilSection title="In schappenplan, niet in inventaris" items={sr.missing} type="missing" />}
                {sr.extra.length > 0 && <VerschilSection title="In inventaris, niet in schappenplan" items={sr.extra} type="extra" />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VerschilSection({ title, items, type }: { title: string; items: VerschilItem[]; type: "missing" | "extra" }) {
  const bySupplier = items.reduce((acc, item) => {
    if (!acc[item.supplier]) acc[item.supplier] = [];
    acc[item.supplier].push(item);
    return acc;
  }, {} as Record<string, VerschilItem[]>);

  const headerColor = type === "missing" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800";
  const badgeColor = type === "missing" ? "text-red-600" : "text-amber-600";

  return (
    <div>
      <div className={`px-4 py-2 text-xs font-semibold ${headerColor}`}>{title}</div>
      {Object.entries(bySupplier).sort(([a], [b]) => a.localeCompare(b)).map(([supplier, supplierItems]) => (
        <div key={supplier}>
          <div className="px-4 py-1.5 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100">{supplier}</div>
          <table className="w-full text-xs">
            <tbody>
              {supplierItems.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <td className="px-6 py-1.5 font-mono text-gray-500 w-24">{item.articleNumber}</td>
                  <td className="px-2 py-1.5 text-gray-800">{item.articleName}</td>
                  <td className="px-2 py-1.5 text-gray-500">{item.catName}</td>
                  <td className={`px-4 py-1.5 font-medium ${badgeColor}`}>{item.locatieType} {item.locatieNummer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ── TotaalVerschilOverview ────────────────────────────────────────────────────

export function TotaalVerschilOverview({ verschilByShowroom, totalShowrooms }: { verschilByShowroom: VerschilShowroom[]; totalShowrooms: number }) {
  const [openSuppliers, setOpenSuppliers] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpenSuppliers((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // Build: per article → which showrooms have it missing / extra
  type ArticleVerschil = {
    articleNumber: string;
    articleName: string;
    supplier: string;
    catName: string;
    missingIn: string[];
    extraIn: string[];
  };

  const articleMap = new Map<string, ArticleVerschil>();

  for (const sr of verschilByShowroom) {
    for (const item of sr.missing) {
      const key = `${item.articleNumber}|${item.locatieType}|${item.locatieNummer}`;
      if (!articleMap.has(key)) articleMap.set(key, { articleNumber: item.articleNumber, articleName: item.articleName, supplier: item.supplier, catName: item.catName, missingIn: [], extraIn: [] });
      articleMap.get(key)!.missingIn.push(sr.showroomName);
    }
    for (const item of sr.extra) {
      const key = `extra|${item.articleNumber}|${item.locatieType}|${item.locatieNummer}`;
      if (!articleMap.has(key)) articleMap.set(key, { articleNumber: item.articleNumber, articleName: item.articleName, supplier: item.supplier, catName: item.catName, missingIn: [], extraIn: [] });
      articleMap.get(key)!.extraIn.push(sr.showroomName);
    }
  }

  const bySupplier = [...articleMap.values()].reduce((acc, a) => {
    if (!acc[a.supplier]) acc[a.supplier] = [];
    acc[a.supplier].push(a);
    return acc;
  }, {} as Record<string, ArticleVerschil[]>);

  const totalMissing = verschilByShowroom.reduce((s, sr) => s + sr.missing.length, 0);
  const totalExtra = verschilByShowroom.reduce((s, sr) => s + sr.extra.length, 0);

  if (totalMissing === 0 && totalExtra === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-gray-900">Geen totaal verschil</p>
        <p className="text-sm text-gray-500 mt-1">Alle showrooms met inventaris komen overeen met het schappenplan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-8">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Showrooms met verschil</p>
          <p className="text-2xl font-bold text-gray-900">{verschilByShowroom.length}<span className="text-sm font-normal text-gray-400 ml-1">/ {totalShowrooms}</span></p>
        </div>
        <div className="w-px h-10 bg-gray-200" />
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Totaal ontbreekt in inventaris</p>
          <p className="text-2xl font-bold text-red-600">{totalMissing}</p>
        </div>
        <div className="w-px h-10 bg-gray-200" />
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Totaal extra in inventaris</p>
          <p className="text-2xl font-bold text-amber-600">{totalExtra}</p>
        </div>
      </div>

      {/* Per leverancier / artikel breakdown */}
      {Object.keys(bySupplier).sort().map((supplier) => {
        const articles = bySupplier[supplier];
        const open = openSuppliers.has(supplier);
        const supplierMissing = articles.reduce((s, a) => s + a.missingIn.length, 0);
        const supplierExtra = articles.reduce((s, a) => s + a.extraIn.length, 0);

        return (
          <div key={supplier} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => toggle(supplier)}
            >
              <div className="flex items-center gap-3">
                {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <span className="font-semibold text-gray-900 text-sm">{supplier}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {supplierMissing > 0 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">{supplierMissing} ontbreekt</span>}
                {supplierExtra > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">{supplierExtra} extra</span>}
              </div>
            </button>

            {open && (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-white">
                  <tr>
                    <th className="text-left px-6 py-2 font-medium text-gray-500 text-xs">Artikel</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Afdeling</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs text-red-600">Ontbreekt in</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs text-amber-600">Extra in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {articles.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-2">
                        <span className="font-mono text-xs text-gray-500 mr-2">{a.articleNumber}</span>
                        <span className="text-gray-800">{a.articleName}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">{a.catName}</td>
                      <td className="px-4 py-2 text-xs">
                        {a.missingIn.length > 0
                          ? <span className="text-red-600">{a.missingIn.join(", ")}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {a.extraIn.length > 0
                          ? <span className="text-amber-600">{a.extraIn.join(", ")}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
