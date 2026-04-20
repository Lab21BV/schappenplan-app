"use client";

import { useState } from "react";
import { Save } from "lucide-react";

interface Showroom { id: string; name: string }
interface Category { id: string; name: string; parentId: string | null; order: number }
interface DisplayConfig {
  id: string;
  showroomId: string;
  categoryId: string;
  numStroken: number;
  numWandborden: number;
  numBokken: number;
}

export default function AdminManager({
  showrooms,
  categories,
  displayConfigs: initial,
}: {
  showrooms: Showroom[];
  categories: Category[];
  displayConfigs: DisplayConfig[];
}) {
  const [selectedShowroom, setSelectedShowroom] = useState(showrooms[0]?.id ?? "");
  const [configs, setConfigs] = useState<Record<string, DisplayConfig>>(() =>
    Object.fromEntries(initial.map((c) => [`${c.showroomId}|${c.categoryId}`, c]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function getLeafIds(catId: string): string[] {
    const children = categories.filter((c) => c.parentId === catId).sort((a, b) => a.order - b.order);
    if (children.length === 0) return [catId];
    return children.flatMap((c) => getLeafIds(c.id));
  }

  const roots = categories.filter((c) => c.parentId === null).sort((a, b) => a.order - b.order);
  const groups = roots.map((root) => ({
    root,
    leaves: getLeafIds(root.id).map((id) => categories.find((c) => c.id === id)!).filter(Boolean),
  }));

  function getConfig(categoryId: string): DisplayConfig {
    const key = `${selectedShowroom}|${categoryId}`;
    return (
      configs[key] ?? {
        id: "",
        showroomId: selectedShowroom,
        categoryId,
        numStroken: 0,
        numWandborden: 0,
        numBokken: 0,
      }
    );
  }

  function updateConfig(categoryId: string, field: keyof DisplayConfig, value: number) {
    const key = `${selectedShowroom}|${categoryId}`;
    const existing = getConfig(categoryId);
    setConfigs({ ...configs, [key]: { ...existing, [field]: value } });
  }

  async function saveConfig(categoryId: string) {
    const key = `${selectedShowroom}|${categoryId}`;
    const cfg = getConfig(categoryId);
    setSaving(categoryId);
    const res = await fetch("/api/display-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cfg, showroomId: selectedShowroom, categoryId }),
    });
    const data = await res.json();
    setConfigs({ ...configs, [key]: data });
    setSaving(null);
    setSaved(categoryId);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Showroom</label>
        <div className="flex gap-2">
          {showrooms.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedShowroom(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedShowroom === s.id
                  ? "bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1 text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-200 px-5 py-3">
        <p className="font-semibold text-sm text-gray-700">Display configuratie per categorie</p>
        <p>Vloerdisplay: a. Strok, b. Wandbord 100×60cm, c. Displaybord in bok 120×60cm (max 10/bok)</p>
      </div>

      <div className="space-y-4">
        {groups.map(({ root, leaves }) => (
          <div key={root.id}>
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl mb-2">
              <span className="font-bold text-white text-sm">{root.name}</span>
            </div>
            <div className="pl-3 border-l-2 border-gray-200">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Categorie</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Stroken</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Wandborden (100×60cm)</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Bokken (120×60cm)</th>
                      <th className="w-24 px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {leaves.map((cat) => {
                      const cfg = getConfig(cat.id);
                      const isSaving = saving === cat.id;
                      const isSaved = saved === cat.id;
                      return (
                        <tr key={cat.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{cat.name}</td>
                          {(["numStroken", "numWandborden", "numBokken"] as const).map((field) => (
                            <td key={field} className="px-4 py-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                max={field === "numBokken" ? 20 : 50}
                                value={(cfg as any)[field]}
                                onChange={(e) => updateConfig(cat.id, field, parseInt(e.target.value) || 0)}
                                className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => saveConfig(cat.id)}
                              disabled={isSaving}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                isSaved ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              } disabled:opacity-60`}
                            >
                              <Save className="w-3 h-3" />
                              {isSaving ? "..." : isSaved ? "Opgeslagen!" : "Opslaan"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
