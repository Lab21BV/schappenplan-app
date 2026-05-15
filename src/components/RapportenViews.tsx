"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, AlertCircle, Search } from "lucide-react";
import { labelForAfmeting, statusBadgeClass } from "@/lib/displayOptions";

const eur = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const pct = (n: number) => `${n.toFixed(1)}%`;

// ── Ontbreekt op showroom ─────────────────────────────────────────────────────

export type OntbreektRow = {
  showroomId: string;
  showroomName: string;
  articleNumber: string;
  articleName: string;
  supplier: string;
  catName: string;
  locatieType: string;
  locatieNummer: number;
  displayAfmeting: string;
  articleStatus: string;
  showFloorStatus: string | null;
  showFloorNotes: string | null;
  showFloorNummer: string | null;
};

export function OntbreektStalenReport({
  rows,
  totalShowrooms,
}: {
  rows: OntbreektRow[];
  totalShowrooms: number;
}) {
  const [q, setQ] = useState("");
  const [openSr, setOpenSr] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.articleNumber.toLowerCase().includes(needle) ||
        r.articleName.toLowerCase().includes(needle) ||
        r.supplier.toLowerCase().includes(needle) ||
        r.catName.toLowerCase().includes(needle)
    );
  }, [rows, q]);

  const bySr = useMemo(() => {
    const map = new Map<string, { name: string; items: OntbreektRow[] }>();
    for (const r of filtered) {
      if (!map.has(r.showroomId)) map.set(r.showroomId, { name: r.showroomName, items: [] });
      map.get(r.showroomId)!.items.push(r);
    }
    return [...map.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [filtered]);

  function toggle(id: string) {
    setOpenSr((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <SummaryBar
        items={[
          { label: "Totaal ontbrekend", value: rows.length, tone: "red" },
          { label: "Showrooms betrokken", value: bySr.length, total: totalShowrooms, tone: "blue" },
        ]}
      />
      <SearchInput value={q} onChange={setQ} placeholder="Zoek artikelnr, naam, leverancier, afdeling..." />

      {bySr.length === 0 && <EmptyState>Geen ontbrekende stalen — alles compleet.</EmptyState>}

      {bySr.map(([id, { name, items }]) => {
        const open = openSr.has(id);
        return (
          <div key={id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggle(id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 transition"
            >
              <div className="flex items-center gap-3">
                {open ? <ChevronDown className="w-4 h-4 text-red-700" /> : <ChevronRight className="w-4 h-4 text-red-700" />}
                <span className="font-semibold text-red-900 text-sm">{name}</span>
              </div>
              <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {items.length} stalen
              </span>
            </button>
            {open && (
              <div className="overflow-x-auto no-scrollbar scroll-edge-fade">
              <table className="w-full text-xs min-w-[980px]">
                <thead className="bg-gray-50 text-gray-500 uppercase">
                  <tr>
                    <th className="text-left px-4 py-2">Artikel</th>
                    <th className="text-left px-3 py-2">Leverancier</th>
                    <th className="text-left px-3 py-2">Afdeling</th>
                    <th className="text-left px-3 py-2">Locatie</th>
                    <th className="text-left px-3 py-2">Afmeting</th>
                    <th className="text-left px-3 py-2">Status art.</th>
                    <th className="text-left px-3 py-2">Staat display</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-mono text-gray-500">{r.articleNumber}</div>
                        <div className="text-gray-800">{r.articleName}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{r.supplier}</td>
                      <td className="px-3 py-2 text-gray-700">{r.catName}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {r.locatieType} {r.locatieNummer}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{labelForAfmeting(r.displayAfmeting)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusBadgeClass(r.articleStatus)}`}>
                          {r.articleStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {r.showFloorStatus ? (
                          <div>
                            <div className={r.showFloorStatus.startsWith("aanwezig") ? "text-amber-700" : "text-red-700"}>
                              {r.showFloorStatus}
                              {r.showFloorNummer ? ` · #${r.showFloorNummer}` : ""}
                            </div>
                            {r.showFloorNotes && <div className="text-gray-400 italic">{r.showFloorNotes}</div>}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Ghost: in inventaris, niet op schappenplan ────────────────────────────────

export type GhostRow = {
  showroomId: string;
  showroomName: string;
  articleNumber: string;
  articleName: string;
  supplier: string;
  catName: string;
  locatieType: string;
  locatieNummer: number;
  stock: number;
  articleStatus: string;
};

export function GhostStalenReport({ rows }: { rows: GhostRow[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const n = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.articleNumber.toLowerCase().includes(n) ||
        r.articleName.toLowerCase().includes(n) ||
        r.supplier.toLowerCase().includes(n) ||
        r.showroomName.toLowerCase().includes(n)
    );
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <SummaryBar
        items={[
          { label: "Stalen zonder schappenplan-positie", value: rows.length, tone: "amber" },
        ]}
      />
      <SearchInput value={q} onChange={setQ} placeholder="Zoek artikel, leverancier, showroom..." />
      {filtered.length === 0 ? (
        <EmptyState>Geen losse stalen.</EmptyState>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar scroll-edge-fade">
          <table className="w-full text-xs min-w-[920px]">
            <thead className="bg-amber-50 text-amber-900 uppercase">
              <tr>
                <th className="text-left px-4 py-2">Showroom</th>
                <th className="text-left px-3 py-2">Artikel</th>
                <th className="text-left px-3 py-2">Leverancier</th>
                <th className="text-left px-3 py-2">Afdeling</th>
                <th className="text-left px-3 py-2">Locatie</th>
                <th className="text-right px-3 py-2">Voorraad</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{r.showroomName}</td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-gray-500">{r.articleNumber}</div>
                    <div className="text-gray-800">{r.articleName}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{r.supplier}</td>
                  <td className="px-3 py-2 text-gray-700">{r.catName}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {r.locatieType} {r.locatieNummer}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.stock}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusBadgeClass(r.articleStatus)}`}>
                      {r.articleStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stalen verdelen ───────────────────────────────────────────────────────────

export type VerdelenRow = {
  articleNumber: string;
  articleName: string;
  supplier: string;
  missingIn: string[];
  doubleIn: { name: string; count: number }[];
};

export function StalenVerdelenReport({
  rows,
  totalShowrooms,
}: {
  rows: VerdelenRow[];
  totalShowrooms: number;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const n = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.articleNumber.toLowerCase().includes(n) ||
        r.articleName.toLowerCase().includes(n) ||
        r.supplier.toLowerCase().includes(n)
    );
  }, [rows, q]);

  const totalMissing = rows.reduce((s, r) => s + r.missingIn.length, 0);
  const totalDouble = rows.reduce((s, r) => s + r.doubleIn.length, 0);

  return (
    <div className="space-y-4">
      <SummaryBar
        items={[
          { label: "Referenties met verdeel-issue", value: rows.length, tone: "blue" },
          { label: "Showroom-gaten (ontbreekt)", value: totalMissing, tone: "red" },
          { label: "Showrooms met dubbel", value: totalDouble, tone: "amber" },
          { label: "Showrooms totaal", value: totalShowrooms, tone: "gray" },
        ]}
      />
      <SearchInput value={q} onChange={setQ} placeholder="Zoek artikel of leverancier..." />
      {filtered.length === 0 ? (
        <EmptyState>Geen herverdeel-acties nodig.</EmptyState>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar scroll-edge-fade">
          <table className="w-full text-xs min-w-[920px]">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-2">Artikel</th>
                <th className="text-left px-3 py-2">Leverancier</th>
                <th className="text-left px-3 py-2 text-red-600">Ontbreekt in</th>
                <th className="text-left px-3 py-2 text-amber-600">Dubbel in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-2">
                    <div className="font-mono text-gray-500">{r.articleNumber}</div>
                    <div className="text-gray-800">{r.articleName}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{r.supplier}</td>
                  <td className="px-3 py-2 text-red-700">
                    {r.missingIn.length > 0 ? r.missingIn.join(", ") : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-amber-700">
                    {r.doubleIn.length > 0
                      ? r.doubleIn.map((d) => `${d.name} (${d.count})`).join(", ")
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Uit collectie ─────────────────────────────────────────────────────────────

export type UitCollectieRow = {
  showroomId: string;
  showroomName: string;
  source: "Inventaris" | "Schappenplan";
  articleNumber: string;
  articleName: string;
  supplier: string;
  catName: string;
  locatieType: string;
  locatieNummer: number;
  positie: number | null;
  articleStatus: string;
};

export function UitCollectieReport({ rows }: { rows: UitCollectieRow[] }) {
  const [openSr, setOpenSr] = useState<Set<string>>(new Set());
  const bySr = useMemo(() => {
    const map = new Map<string, { name: string; items: UitCollectieRow[] }>();
    for (const r of rows) {
      if (!map.has(r.showroomId)) map.set(r.showroomId, { name: r.showroomName, items: [] });
      map.get(r.showroomId)!.items.push(r);
    }
    return [...map.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [rows]);

  function toggle(id: string) {
    setOpenSr((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <SummaryBar
        items={[
          { label: "Uit-collectie stalen", value: rows.length, tone: "amber" },
          { label: "Showrooms met opruim-actie", value: bySr.length, tone: "blue" },
        ]}
      />
      {bySr.length === 0 ? (
        <EmptyState>Geen uit-collectie stalen aanwezig in de showrooms.</EmptyState>
      ) : (
        bySr.map(([id, { name, items }]) => {
          const open = openSr.has(id);
          return (
            <div key={id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggle(id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition"
              >
                <div className="flex items-center gap-3">
                  {open ? <ChevronDown className="w-4 h-4 text-amber-700" /> : <ChevronRight className="w-4 h-4 text-amber-700" />}
                  <span className="font-semibold text-amber-900 text-sm">{name}</span>
                </div>
                <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  {items.length} stalen
                </span>
              </button>
              {open && (
                <div className="overflow-x-auto no-scrollbar scroll-edge-fade">
                <table className="w-full text-xs min-w-[900px]">
                  <thead className="bg-gray-50 text-gray-500 uppercase">
                    <tr>
                      <th className="text-left px-4 py-2">Bron</th>
                      <th className="text-left px-3 py-2">Artikel</th>
                      <th className="text-left px-3 py-2">Leverancier</th>
                      <th className="text-left px-3 py-2">Afdeling</th>
                      <th className="text-left px-3 py-2">Locatie</th>
                      <th className="text-left px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{r.source}</td>
                        <td className="px-3 py-2">
                          <div className="font-mono text-gray-500">{r.articleNumber}</div>
                          <div className="text-gray-800">{r.articleName}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{r.supplier}</td>
                        <td className="px-3 py-2 text-gray-700">{r.catName}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {r.locatieType} {r.locatieNummer}
                          {r.positie ? ` · pos ${r.positie}` : ""}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusBadgeClass(r.articleStatus)}`}>
                            {r.articleStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Omzet ─────────────────────────────────────────────────────────────────────

export type OmzetRow = {
  articleNumber: string;
  articleName: string;
  supplier: string;
  revenue: number;
  quantity: number;
  revenueShare: number;
  showroomsWithStaal: number;
  pctShowrooms: number;
  status: string;
};

export function OmzetReport({
  rows,
  totalShowrooms,
  totalRevenue,
}: {
  rows: OmzetRow[];
  totalShowrooms: number;
  totalRevenue: number;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const n = q.toLowerCase();
    return rows.filter(
      (r) =>
        r.articleNumber.toLowerCase().includes(n) ||
        r.articleName.toLowerCase().includes(n) ||
        r.supplier.toLowerCase().includes(n)
    );
  }, [rows, q]);

  const noSaleNoStaal = rows.filter((r) => r.revenue > 0 && r.showroomsWithStaal === 0).length;

  return (
    <div className="space-y-4">
      <SummaryBar
        items={[
          { label: "Totale omzet", value: eur(totalRevenue), tone: "blue" },
          { label: "Referenties met omzet", value: rows.length, tone: "gray" },
          { label: "Omzet zonder enig staal", value: noSaleNoStaal, tone: "red" },
          { label: "Showrooms", value: totalShowrooms, tone: "gray" },
        ]}
      />
      <SearchInput value={q} onChange={setQ} placeholder="Zoek artikel of leverancier..." />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar scroll-edge-fade">
        <table className="w-full text-xs min-w-[980px]">
          <thead className="bg-gray-50 text-gray-500 uppercase">
            <tr>
              <th className="text-left px-4 py-2">Artikel</th>
              <th className="text-left px-3 py-2">Leverancier</th>
              <th className="text-right px-3 py-2">Omzet</th>
              <th className="text-right px-3 py-2">Aandeel</th>
              <th className="text-right px-3 py-2">Stuks</th>
              <th className="text-right px-3 py-2">Showrooms met staal</th>
              <th className="text-right px-3 py-2">% beschikbaar</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((r, i) => {
              const warn = r.revenue > 0 && r.showroomsWithStaal === 0;
              return (
                <tr key={i} className={`hover:bg-gray-50 ${warn ? "bg-red-50/40" : ""}`}>
                  <td className="px-4 py-2">
                    <div className="font-mono text-gray-500">{r.articleNumber}</div>
                    <div className="text-gray-800">{r.articleName}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-700">{r.supplier}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{eur(r.revenue)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">{pct(r.revenueShare)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">{r.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.showroomsWithStaal}/{totalShowrooms}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums font-medium ${
                      r.pctShowrooms >= 75
                        ? "text-green-600"
                        : r.pctShowrooms >= 25
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {pct(r.pctShowrooms)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
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

// ── Helpers ───────────────────────────────────────────────────────────────────

type Tone = "red" | "amber" | "blue" | "green" | "gray";
function toneClass(tone: Tone) {
  switch (tone) {
    case "red": return "text-red-600";
    case "amber": return "text-amber-600";
    case "blue": return "text-blue-700";
    case "green": return "text-green-600";
    default: return "text-gray-900";
  }
}

function SummaryBar({
  items,
}: {
  items: { label: string; value: string | number; total?: number; tone: Tone }[];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-8 flex-wrap">
      {items.map((it, i) => (
        <div key={i} className="flex items-baseline gap-2">
          <p className={`text-2xl font-bold ${toneClass(it.tone)}`}>
            {it.value}
            {it.total !== undefined && <span className="text-sm text-gray-400 font-normal ml-1">/ {it.total}</span>}
          </p>
          <p className="text-xs text-gray-500">{it.label}</p>
        </div>
      ))}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
      <p className="font-semibold text-gray-900">{children}</p>
    </div>
  );
}

// unused alert icon import-guard
void AlertCircle;
