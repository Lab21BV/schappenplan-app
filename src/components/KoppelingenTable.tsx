"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export type KoppelingRow = {
  leftNum: string;
  leftName: string;
  rightNum: string;
  rightName: string;
};

export type KoppelingSection = {
  title: string;
  description: string;
  rows: KoppelingRow[];
};

export default function KoppelingenTable({ sections }: { sections: KoppelingSection[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        rows: s.rows.filter(
          (r) =>
            r.leftNum.toLowerCase().includes(q) ||
            r.leftName.toLowerCase().includes(q) ||
            r.rightNum.toLowerCase().includes(q) ||
            r.rightName.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.rows.length > 0);
  }, [sections, q]);

  const totalMatches = filtered.reduce((sum, s) => sum + s.rows.length, 0);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op artikelnummer, naam, kleur of decor…"
          className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {q && (
          <p className="text-xs text-gray-500 mt-1.5 ml-1">
            {totalMatches} {totalMatches === 1 ? "koppeling" : "koppelingen"} gevonden
          </p>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
          Geen koppelingen gevonden voor &ldquo;{query}&rdquo;.
        </div>
      )}

      {filtered.map((section, sIdx) => {
        const accent = sectionAccent(section.title);
        return (
          <section key={sIdx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className={`px-5 py-3 border-b border-gray-200 ${accent.headerBg}`}>
              <h2 className={`text-sm font-semibold ${accent.headerText}`}>{section.title}</h2>
              <p className={`text-xs mt-0.5 ${accent.headerSub}`}>{section.description}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold w-40">Artikelnr. patroon</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold">Patroon — visgraat / walvisgraat / punt</th>
                    <th className="text-center px-2 py-2 border-b border-gray-200 font-semibold w-8">↔</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold w-40">Artikelnr. rechte plank</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold">Rechte plank — band / bies</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className={`px-3 py-1.5 border-b border-gray-100 font-mono text-[11px] ${accent.leftCell}`}>{r.leftNum}</td>
                      <td className="px-3 py-1.5 border-b border-gray-100">{r.leftName}</td>
                      <td className="px-2 py-1.5 border-b border-gray-100 text-center text-gray-400">↔</td>
                      <td className={`px-3 py-1.5 border-b border-gray-100 font-mono text-[11px] ${accent.rightCell}`}>{r.rightNum}</td>
                      <td className="px-3 py-1.5 border-b border-gray-100">{r.rightName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function sectionAccent(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("klik")) {
    return {
      headerBg: "bg-blue-50",
      headerText: "text-blue-900",
      headerSub: "text-blue-700/80",
      leftCell: "text-blue-900",
      rightCell: "text-green-800",
    };
  }
  if (lower.includes("hongaarse") || lower.includes("weense") || lower.includes("punt")) {
    return {
      headerBg: "bg-red-50",
      headerText: "text-red-900",
      headerSub: "text-red-700/80",
      leftCell: "text-red-900",
      rightCell: "text-green-800",
    };
  }
  // visgraat lijm
  return {
    headerBg: "bg-purple-50",
    headerText: "text-purple-900",
    headerSub: "text-purple-700/80",
    leftCell: "text-purple-900",
    rightCell: "text-green-800",
  };
}
