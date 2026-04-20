"use client";

import { useState } from "react";

interface ShowFloorItem {
  id: string;
  nummer: string | null;
  lengte: number | null;
  breedte: number | null;
  status: string | null;
  stock: number;
  notes: string | null;
  article: { articleNumber: string; articleName: string };
  category: { id: string; name: string };
}

interface RootGroup {
  name: string;
  order: number;
  items: ShowFloorItem[];
}

function StockCell({ itemId, initial }: { itemId: string; initial: number }) {
  const [val, setVal] = useState(initial);

  async function save(newVal: number) {
    await fetch(`/api/showfloor?id=${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: newVal }),
    });
  }

  return (
    <input
      type="number"
      min="0"
      value={val}
      onChange={(e) => setVal(parseInt(e.target.value) || 0)}
      onBlur={(e) => save(parseInt(e.target.value) || 0)}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className="w-16 text-xs text-center border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
    />
  );
}

export default function ShowFloorInventory({ rootGroups }: { rootGroups: RootGroup[] }) {
  if (rootGroups.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Showvloer</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {rootGroups.map((root) => (
        <div key={root.name} className="space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl">
            <span className="font-bold text-white text-sm">{root.name}</span>
            <span className="text-xs text-gray-400">{root.items.length} display{root.items.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="pl-3 border-l-2 border-gray-200">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Nr.</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnummer</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Artikelnaam</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Afmeting</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Status</th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600 text-xs">Voorraad</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Notitie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {root.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {item.nummer ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{item.article.articleNumber}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{item.article.articleName}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">
                        {item.lengte && item.breedte
                          ? `${item.lengte} × ${item.breedte} m`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.status === "aanwezig, niet beschadigd" ? "bg-green-100 text-green-700" :
                          item.status === "aanwezig, beschadigd"      ? "bg-orange-100 text-orange-700" :
                          item.status === "niet aanwezig"             ? "bg-red-100 text-red-700" :
                                                                        "bg-gray-100 text-gray-500"
                        }`}>
                          {item.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <StockCell itemId={item.id} initial={item.stock} />
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{item.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
