import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShowrooms } from "@/lib/dataCache";
import Link from "next/link";
import LoansManager from "@/components/LoansManager";

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ showroom?: string }>;
}) {
  const session = await auth();
  if (!session) return null;
  const user = session.user as { id: string; role: string; showroomId: string | null };
  const isHQ = user.role === "HOOFDKANTOOR";

  const { showroom: showroomParam } = await searchParams;

  const allShowrooms = isHQ ? await getShowrooms() : [];

  const showroomId = isHQ
    ? (allShowrooms.find((s) => s.id === showroomParam)?.id ?? allShowrooms[0]?.id ?? "")
    : (user.showroomId ?? (await prisma.showroom.findFirst())!.id);

  const [loans, articles, showroom] = await Promise.all([
    prisma.loan.findMany({
      where: { showroomId },
      include: { user: true, article: true },
      orderBy: [{ returnedAt: "asc" }, { promisedReturnAt: "asc" }],
    }),
    prisma.article.findMany({
      where: { isActive: true },
      select: { id: true, articleNumber: true, articleName: true },
      orderBy: { articleName: "asc" },
    }),
    prisma.showroom.findUnique({ where: { id: showroomId } }),
  ]);

  const loansSerialized = loans.map((l) => ({
    id: l.id,
    itemDescription: l.itemDescription,
    customerName: l.customerName,
    customerEmail: l.customerEmail,
    customerPhone: l.customerPhone,
    customerAddress: l.customerAddress,
    borrowedAt: l.borrowedAt.toISOString(),
    promisedReturnAt: l.promisedReturnAt.toISOString(),
    returnedAt: l.returnedAt ? l.returnedAt.toISOString() : null,
    notes: l.notes,
    articleId: l.articleId,
    article: l.article ? { articleNumber: l.article.articleNumber, articleName: l.article.articleName } : null,
    user: { name: l.user.name },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Uitleningen</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isHQ ? `Showroom ${showroom?.name} · ` : ""}Uitgeleende stalen per klant
        </p>
      </div>

      {isHQ && (
        <div className="flex items-center gap-2 flex-wrap">
          {allShowrooms.map((sr) => (
            <Link
              key={sr.id}
              href={`/dashboard/loans?showroom=${sr.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                sr.id === showroomId
                  ? "bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {sr.name}
            </Link>
          ))}
        </div>
      )}

      <LoansManager loans={loansSerialized} articles={articles} showroomId={showroomId} />
    </div>
  );
}
