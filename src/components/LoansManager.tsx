"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Check, Pencil, Trash2, X, AlertCircle } from "lucide-react";

type Loan = {
  id: string;
  itemDescription: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  borrowedAt: string;
  promisedReturnAt: string;
  returnedAt: string | null;
  notes: string | null;
  articleId: string | null;
  article: { articleNumber: string; articleName: string } | null;
  inventoryId: string | null;
  inventory: { locatieType: string | null; locatieNummer: number | null; bordNummer: number | null } | null;
  user: { name: string };
};

type ArticleOption = { id: string; articleNumber: string; articleName: string };
type InventoryOption = { id: string; label: string };

type Tab = "open" | "telaat" | "terug";

const TABS: { key: Tab; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "telaat", label: "Te laat" },
  { key: "terug", label: "Teruggebracht" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysBetween(aIso: string, bIso: string) {
  const a = new Date(aIso); a.setHours(0, 0, 0, 0);
  const b = new Date(bIso); b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(loan: Loan) {
  if (loan.returnedAt) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(loan.promisedReturnAt) < today;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function in14Days() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export default function LoansManager({
  loans,
  articles,
  inventoryOptions,
  showroomId,
}: {
  loans: Loan[];
  articles: ArticleOption[];
  inventoryOptions: InventoryOption[];
  showroomId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("open");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);

  const open = loans.filter((l) => !l.returnedAt && !isOverdue(l));
  const overdue = loans.filter((l) => isOverdue(l));
  const returned = loans.filter((l) => l.returnedAt);

  const visible = tab === "open" ? open : tab === "telaat" ? overdue : returned;

  async function markReturned(id: string) {
    await fetch(`/api/loans?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnedAt: new Date().toISOString() }),
    });
    router.refresh();
  }

  async function unreturn(id: string) {
    await fetch(`/api/loans?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnedAt: null }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Deze uitlening verwijderen?")) return;
    await fetch(`/api/loans?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map((t) => {
            const count = t.key === "open" ? open.length : t.key === "telaat" ? overdue.length : returned.length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-white text-blue-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  t.key === "telaat" && count > 0 ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          <Plus className="w-4 h-4" />
          Nieuwe uitlening
        </button>
      </div>

      {showForm && (
        <LoanForm
          articles={articles}
          inventoryOptions={inventoryOptions}
          showroomId={showroomId}
          loan={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); router.refresh(); }}
        />
      )}

      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          Geen uitleningen in deze categorie.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Staal</th>
                <th className="text-left px-4 py-3">Klant</th>
                <th className="text-left px-4 py-3">Verkoper</th>
                <th className="text-left px-4 py-3">Geleend</th>
                <th className="text-left px-4 py-3">Toegezegd terug</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => {
                const overdueDays = !l.returnedAt && isOverdue(l) ? -daysBetween(todayISO(), l.promisedReturnAt) : 0;
                return (
                  <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/loans/${l.id}`} className="font-medium text-gray-900 hover:text-blue-700 hover:underline">
                        {l.itemDescription}
                      </Link>
                      {l.article && (
                        <div className="text-xs text-gray-500">{l.article.articleNumber} · {l.article.articleName}</div>
                      )}
                      {l.inventory && (
                        <div className="text-xs text-gray-400">
                          {l.inventory.locatieType} {l.inventory.locatieNummer}
                          {l.inventory.bordNummer ? ` · bord ${l.inventory.bordNummer}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{l.customerName}</div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {l.customerEmail && <div>{l.customerEmail}</div>}
                        {l.customerPhone && <div>{l.customerPhone}</div>}
                        {l.customerAddress && <div className="truncate max-w-xs" title={l.customerAddress}>{l.customerAddress}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{l.user.name}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(l.borrowedAt)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDate(l.promisedReturnAt)}</td>
                    <td className="px-4 py-3">
                      {l.returnedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Terug · {formatDate(l.returnedAt)}
                        </span>
                      ) : isOverdue(l) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {overdueDays} dag{overdueDays !== 1 ? "en" : ""} te laat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {!l.returnedAt ? (
                        <button
                          onClick={() => markReturned(l.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          title="Markeer als teruggebracht"
                        >
                          <Check className="w-3 h-3" /> Terug
                        </button>
                      ) : (
                        <button
                          onClick={() => unreturn(l.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          title="Maak retour ongedaan"
                        >
                          ↺
                        </button>
                      )}
                      <button
                        onClick={() => { setEditing(l); setShowForm(true); }}
                        className="ml-1 inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                        title="Bewerken"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => remove(l.id)}
                        className="ml-1 inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LoanForm({
  articles,
  inventoryOptions,
  showroomId,
  loan,
  onClose,
  onSaved,
}: {
  articles: ArticleOption[];
  inventoryOptions: InventoryOption[];
  showroomId: string;
  loan: Loan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [articleId, setArticleId] = useState<string>(loan?.articleId ?? "");
  const [inventoryId, setInventoryId] = useState<string>(loan?.inventoryId ?? "");
  const [itemDescription, setItemDescription] = useState(loan?.itemDescription ?? "");
  const [customerName, setCustomerName] = useState(loan?.customerName ?? "");
  const [customerEmail, setCustomerEmail] = useState(loan?.customerEmail ?? "");
  const [customerPhone, setCustomerPhone] = useState(loan?.customerPhone ?? "");
  const [customerAddress, setCustomerAddress] = useState(loan?.customerAddress ?? "");
  const [borrowedAt, setBorrowedAt] = useState(loan?.borrowedAt?.slice(0, 10) ?? todayISO());
  const [promisedReturnAt, setPromisedReturnAt] = useState(loan?.promisedReturnAt?.slice(0, 10) ?? in14Days());
  const [notes, setNotes] = useState(loan?.notes ?? "");

  const articleOptions = useMemo(
    () => articles.slice(0, 500),
    [articles]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      showroomId,
      articleId: articleId || null,
      inventoryId: inventoryId || null,
      itemDescription,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      borrowedAt,
      promisedReturnAt,
      notes,
    };

    const url = loan ? `/api/loans?id=${loan.id}` : "/api/loans";
    const method = loan ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Opslaan mislukt");
      return;
    }
    onSaved();
  }

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">
          {loan ? "Uitlening bewerken" : "Nieuwe uitlening"}
        </h2>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Inventaris-item (optioneel — kies om de status &apos;Uitgeleend&apos; in inventarisatie te tonen)
          </label>
          <select
            value={inventoryId}
            onChange={(e) => setInventoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— niet gekoppeld aan inventarisatie —</option>
            {inventoryOptions.map((i) => (
              <option key={i.id} value={i.id}>{i.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Staal / omschrijving *</label>
            <input
              required
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="bv. Bord 120x60 Sensation Oak Grey"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Gekoppeld artikel (optioneel)</label>
            <select
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— geen artikel gekoppeld —</option>
              {articleOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.articleNumber} · {a.articleName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="border border-gray-200 rounded-lg p-4">
          <legend className="text-xs font-medium text-gray-600 px-2">Klant</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Naam *</label>
              <input
                required
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Telefoon</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Adres</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Straat 1, 1234 AB Plaats"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Geleend op *</label>
            <input
              required
              type="date"
              value={borrowedAt}
              onChange={(e) => setBorrowedAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Toegezegd terug *</label>
            <input
              required
              type="date"
              value={promisedReturnAt}
              onChange={(e) => setPromisedReturnAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Notities</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? "Opslaan..." : loan ? "Wijzigingen opslaan" : "Uitlening registreren"}
          </button>
        </div>
      </form>
    </div>
  );
}
