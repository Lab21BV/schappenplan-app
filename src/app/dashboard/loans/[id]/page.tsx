import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User, Package, AlertCircle, CheckCircle, ClipboardList } from "lucide-react";
import LoanDetailActions from "@/components/LoanDetailActions";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" });
}

function daysBetween(a: Date, b: Date) {
  const ad = new Date(a); ad.setHours(0, 0, 0, 0);
  const bd = new Date(b); bd.setHours(0, 0, 0, 0);
  return Math.round((bd.getTime() - ad.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) return null;
  const user = session.user as { role: string; showroomId: string | null };

  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      showroom: true,
      user: true,
      article: true,
      inventory: { include: { article: true, category: true } },
    },
  });

  if (!loan) notFound();
  if (user.role !== "HOOFDKANTOOR" && loan.showroomId !== user.showroomId) {
    redirect("/dashboard/loans");
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdueDays = !loan.returnedAt && loan.promisedReturnAt < today
    ? daysBetween(loan.promisedReturnAt, today)
    : 0;

  const status: { label: string; cls: string; icon: typeof CheckCircle } = loan.returnedAt
    ? { label: `Teruggebracht op ${fmtDate(loan.returnedAt)}`, cls: "bg-green-100 text-green-700", icon: CheckCircle }
    : overdueDays > 0
      ? { label: `${overdueDays} dag${overdueDays !== 1 ? "en" : ""} te laat`, cls: "bg-red-100 text-red-700", icon: AlertCircle }
      : { label: "Open", cls: "bg-blue-100 text-blue-700", icon: Package };

  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href={`/dashboard/loans?showroom=${loan.showroomId}`}
        className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Terug naar uitleningen
      </Link>

      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{loan.itemDescription}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Showroom {loan.showroom.name} · Geleend door {loan.user.name}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.cls}`}>
            <StatusIcon className="w-4 h-4" />
            {status.label}
          </span>
        </div>
      </div>

      <LoanDetailActions
        id={loan.id}
        returnedAt={loan.returnedAt ? loan.returnedAt.toISOString() : null}
        showroomId={loan.showroomId}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" /> Klantgegevens
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-24 text-gray-500">Naam</dt>
              <dd className="font-medium text-gray-900">{loan.customerName}</dd>
            </div>
            {loan.customerEmail && (
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</dt>
                <dd>
                  <a href={`mailto:${loan.customerEmail}`} className="text-blue-700 hover:underline">{loan.customerEmail}</a>
                </dd>
              </div>
            )}
            {loan.customerPhone && (
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> Telefoon</dt>
                <dd>
                  <a href={`tel:${loan.customerPhone}`} className="text-blue-700 hover:underline">{loan.customerPhone}</a>
                </dd>
              </div>
            )}
            {loan.customerAddress && (
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adres</dt>
                <dd className="text-gray-900">{loan.customerAddress}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" /> Uitleen-info
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-32 text-gray-500">Geleend op</dt>
              <dd className="text-gray-900">{fmtDate(loan.borrowedAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 text-gray-500">Toegezegd terug</dt>
              <dd className="text-gray-900">{fmtDate(loan.promisedReturnAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 text-gray-500">Daadwerkelijk terug</dt>
              <dd className="text-gray-900">{fmtDate(loan.returnedAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 text-gray-500">Verkoper</dt>
              <dd className="text-gray-900">{loan.user.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-32 text-gray-500">Showroom</dt>
              <dd className="text-gray-900">{loan.showroom.name}</dd>
            </div>
          </dl>
        </section>

        {loan.article && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" /> Gekoppeld artikel
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500">Artikelnr</dt>
                <dd className="font-mono text-gray-900">{loan.article.articleNumber}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500">Naam</dt>
                <dd className="text-gray-900">{loan.article.articleName}</dd>
              </div>
            </dl>
          </section>
        )}

        {loan.inventory && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gray-500" /> Inventaris-item
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500">Locatie</dt>
                <dd className="text-gray-900">
                  {loan.inventory.locatieType ?? "—"} {loan.inventory.locatieNummer ?? ""}
                  {loan.inventory.bordNummer ? ` · bord ${loan.inventory.bordNummer}` : ""}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500">Afdeling</dt>
                <dd className="text-gray-900">{loan.inventory.category?.name ?? loan.inventory.article.articleName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-gray-500">Artikel</dt>
                <dd className="text-gray-900">{loan.inventory.article.articleNumber} · {loan.inventory.article.articleName}</dd>
              </div>
              <div className="pt-1">
                <Link
                  href={`/dashboard/inventory?showroom=${loan.showroomId}`}
                  className="text-xs text-blue-700 hover:underline"
                >
                  Bekijk in inventarisatie →
                </Link>
              </div>
            </dl>
          </section>
        )}

        {loan.notes && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-2">Notities</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{loan.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}
