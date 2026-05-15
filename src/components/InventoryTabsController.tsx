"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Edit2, Save, X, Camera, Plus, Trash2, Loader2 } from "lucide-react";
import InventoryTabs, { type InventoryItem, type RootGroup, type VerschilRoot, type ShowFloorVerschilItem } from "@/components/InventoryTabs";

export default function InventoryTabsController({
  sortedRoots, hasLocatie, verschilMissing, verschilExtra, showFloorItems,
}: {
  sortedRoots: [string, RootGroup][];
  hasLocatie: boolean;
  verschilMissing: VerschilRoot[];
  verschilExtra: VerschilRoot[];
  showFloorItems: ShowFloorVerschilItem[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ notes: string; stock: number; isDisplayMaterial: boolean; images: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je dit item wilt verwijderen? Foto's worden ook verwijderd.")) return;
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  function startEdit(inv: InventoryItem) {
    setEditingId(inv.id);
    setEditDraft({
      notes: inv.notes ?? "",
      stock: inv.stock,
      isDisplayMaterial: inv.isDisplayMaterial ?? false,
      images: inv.images ?? [],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function saveEdit() {
    if (!editingId || !editDraft) return;
    setSaving(true);
    const res = await fetch(`/api/inventory/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editDraft),
    });
    setSaving(false);
    if (res.ok) { cancelEdit(); router.refresh(); }
  }

  async function uploadAndAdd(files: File[]) {
    if (!editDraft) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const res = await fetch("/api/inventory/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { keys } = await res.json();
      setEditDraft({ ...editDraft, images: [...editDraft.images, ...keys] });
    }
  }

  function removeImage(idx: number) {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, images: editDraft.images.filter((_, i) => i !== idx) });
  }

  const onRenderInventoryRow = (inv: InventoryItem) => {
    if (editingId !== inv.id || !editDraft) return null;
    const numCols = hasLocatie ? 12 : 11;

    return (
      <tr className="bg-blue-50/50">
        <td colSpan={numCols} className="px-4 py-3">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Voorraad:</span>
              <input type="number" min="0" value={editDraft.stock} onChange={(e) => setEditDraft({ ...editDraft, stock: parseInt(e.target.value) || 0 })} className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-right" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">Displaymat.:</span>
              <input type="checkbox" checked={editDraft.isDisplayMaterial} onChange={(e) => setEditDraft({ ...editDraft, isDisplayMaterial: e.target.checked })} className="w-4 h-4 accent-blue-700" />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-xs font-medium text-gray-600">Notitie:</span>
              <input type="text" value={editDraft.notes} onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })} placeholder="Notitie..." className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {editDraft.images.map((key, idx) => (
                  <div key={idx} className="relative group w-10 h-10 rounded overflow-hidden border border-gray-200">
                    <img src={`/api/inventory/images?path=${encodeURIComponent(key)}`} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="inline-flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                <Plus className="w-3.5 h-3.5" /> Foto
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) uploadAndAdd(Array.from(e.target.files)); e.target.value = ""; }} />
              </label>
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 disabled:opacity-60">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Opslaan
              </button>
              <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs hover:bg-gray-50">
                <X className="w-3.5 h-3.5" /> Annuleren
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <InventoryTabs
      sortedRoots={sortedRoots}
      hasLocatie={hasLocatie}
      verschilMissing={verschilMissing}
      verschilExtra={verschilExtra}
      showFloorItems={showFloorItems}
      onDelete={handleDelete}
      onEdit={startEdit}
      editingId={editingId}
      editRow={onRenderInventoryRow}
    />
  );
}
