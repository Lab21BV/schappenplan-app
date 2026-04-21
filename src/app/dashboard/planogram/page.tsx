import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlanogramView from "@/components/PlanogramView";
import PlanogramImport from "@/components/PlanogramImport";
import type { CategoryTree } from "@/types";

function buildCategoryTree(parentId: string | null, allCats: any[]): CategoryTree[] {
  return allCats
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      ...c,
      children: buildCategoryTree(c.id, allCats),
    }));
}

export default async function PlanogramPage({
  searchParams,
}: {
  searchParams: Promise<{ showroom?: string }>;
}) {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  const isHQ = user.role === "HOOFDKANTOOR";

  const { showroom: showroomParam } = await searchParams;

  const allShowrooms = isHQ ? await prisma.showroom.findMany({ orderBy: { name: "asc" } }) : [];

  // HQ: use URL param → fallback to first showroom
  // Verkoper: always their own showroom
  const showroomId = isHQ
    ? (allShowrooms.find((s) => s.id === showroomParam)?.id ?? allShowrooms[0]?.id ?? "")
    : (user.showroomId ?? (await prisma.showroom.findFirst())!.id);

  const [allCategories, showroom, displayConfigs] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.showroom.findUnique({ where: { id: showroomId } }),
    prisma.displayConfig.findMany({
      where: { showroomId },
      include: { category: true },
    }),
  ]);

  const planogramItems = await prisma.planogramItem.findMany({
    where: { showroomId },
    include: { article: true },
    orderBy: [{ locatieType: "asc" }, { locatieNummer: "asc" }, { positie: "asc" }],
  });

  const categoryTree = buildCategoryTree(null, allCategories as any[]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schappenplan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Showroom {showroom?.name} · Planogram overzicht per categorie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/planogram/nieuw"
            className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
          >
            + Standaard invullen
          </Link>
          {isHQ && <PlanogramImport showrooms={allShowrooms} isHQ={true} />}
        </div>
      </div>

      {/* Showroom selector for HQ */}
      {isHQ && (
        <div className="flex items-center gap-2 flex-wrap">
          {allShowrooms.map((sr) => (
            <Link
              key={sr.id}
              href={`/dashboard/planogram?showroom=${sr.id}`}
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

      <PlanogramView
        showroomId={showroomId}
        categoryTree={categoryTree as any}
        planogramItems={planogramItems as any}
        displayConfigs={displayConfigs as any}
        isHQ={isHQ}
      />
    </div>
  );
}
