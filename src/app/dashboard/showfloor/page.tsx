import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ShowFloorManager from "@/components/ShowFloorManager";

export default async function ShowFloorPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  const isHQ = user.role === "HOOFDKANTOOR";
  const showroomId = user.showroomId ?? (await prisma.showroom.findFirst())!.id;

  const allCategories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  function findRoot(catId: string): { id: string; name: string } {
    let cur = allCategories.find((c) => c.id === catId);
    while (cur?.parentId) cur = allCategories.find((c) => c.id === cur!.parentId);
    return cur ?? { id: catId, name: "Overig" };
  }

  // Only leaf categories whose root is "Vloer"
  const vloerLeafCatIds = new Set(
    allCategories
      .filter((c) => !allCategories.some((x) => x.parentId === c.id))
      .filter((c) => findRoot(c.id).name === "Vloer")
      .map((c) => c.id)
  );

  const catRootMap: Record<string, { id: string; name: string; order: number }> = {};
  for (const cat of allCategories) {
    if (!allCategories.some((c) => c.parentId === cat.id)) {
      const root = findRoot(cat.id);
      catRootMap[cat.id] = { ...root, order: allCategories.find((c) => c.id === root.id)?.order ?? 99 };
    }
  }

  const [showFloors, articles, showroom] = await Promise.all([
    prisma.showFloor.findMany({
      where: { showroomId },
      include: { article: { include: { category: true } } },
      orderBy: { nummer: "asc" },
    }),
    prisma.article.findMany({
      where: { isActive: true, categoryId: { in: [...vloerLeafCatIds] } },
      include: { category: true },
      orderBy: { articleName: "asc" },
    }),
    prisma.showroom.findUnique({ where: { id: showroomId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Showvloer</h1>
        <p className="text-gray-500 text-sm mt-1">
          Showroom {showroom?.name} · Tentoongestelde vloeren
        </p>
      </div>
      <ShowFloorManager
        showFloors={showFloors as any}
        articles={articles as any}
        showroomId={showroomId}
        catRootMap={catRootMap}
        isHQ={isHQ}
      />
    </div>
  );
}
