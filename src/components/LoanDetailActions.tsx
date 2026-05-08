"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";

export default function LoanDetailActions({
  id,
  returnedAt,
  showroomId,
}: {
  id: string;
  returnedAt: string | null;
  showroomId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markReturned() {
    setBusy(true);
    await fetch(`/api/loans?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnedAt: new Date().toISOString() }),
    });
    setBusy(false);
    router.refresh();
  }

  async function unreturn() {
    setBusy(true);
    await fetch(`/api/loans?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnedAt: null }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Deze uitlening verwijderen?")) return;
    setBusy(true);
    const res = await fetch(`/api/loans?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/dashboard/loans?showroom=${showroomId}`);
      router.refresh();
    } else {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {returnedAt ? (
        <button
          onClick={unreturn}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-60"
        >
          ↺ Maak retour ongedaan
        </button>
      ) : (
        <button
          onClick={markReturned}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
        >
          <Check className="w-4 h-4" /> Markeer als teruggebracht
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-60"
      >
        <Trash2 className="w-4 h-4" /> Verwijderen
      </button>
    </div>
  );
}
