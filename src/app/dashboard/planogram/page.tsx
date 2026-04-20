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

export default async function PlanogramPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  const showroomId = user.showroomId ?? (await prisma.showroom.findFirst())!.id;

  const [allCategories, showroom, displayConfigs, allShowrooms] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.showroom.findUnique({ where: { id: showroomId } }),
    prisma.displayConfig.findMany({
      where: { showroomId },
      include: { category: true },
    }),
    user.role === "HOOFDKANTOOR" ? prisma.showroom.findMany() : Promise.resolve([]),
  ]);

  const planogramItems = await prisma.planogramItem.findMany({
    where: { showroomId },
    include: {
      article: true,
    },
    orderBy: [
      { locatieType: "asc" },
      { locatieNummer: "asc" },
      { positie: "asc" },
    ],
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
        {user.role === "HOOFDKANTOOR" && (
          <PlanogramImport showrooms={allShowrooms} />
        )}
      </div>
      <PlanogramView
        showroomId={showroomId}
        categoryTree={categoryTree as any}
        planogramItems={planogramItems as any}
        displayConfigs={displayConfigs as any}
        isHQ={user.role === "HOOFDKANTOOR"}
      />
    </div>
  );
}
