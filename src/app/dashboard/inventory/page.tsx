import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import InventoryTabs, { type RootGroup, type VerschilRoot, type ShowFloorVerschilItem } from "@/components/InventoryTabs";

export default async function InventoryPage({
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

  const showroomId = isHQ
    ? (allShowrooms.find((s) => s.id === showroomParam)?.id ?? allShowrooms[0]?.id ?? "")
    : (user.showroomId ?? (await prisma.showroom.findFirst())!.id);

  const [inventories, allCategories, planogramItems, showFloors] = await Promise.all([
    prisma.inventory.findMany({
      where: { showroomId },
      include: {
        article: { include: { category: true } },
        category: true,
        showroom: true,
        createdBy: true,
      },
      orderBy: [
        { categoryId: "asc" },
        { locatieType: "asc" },
        { locatieNummer: "asc" },
        { bordNummer: "asc" },
        { createdAt: "desc" },
      ],
      take: 500,
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.planogramItem.findMany({
      where: { showroomId },
      include: { article: { include: { category: true } }, category: true },
    }),
    prisma.showFloor.findMany({
      where: { showroomId },
      include: { article: true },
      orderBy: { nummer: "asc" },
    }),
  ]);

  function findRoot(catId: string): { id: string; name: string; order: number } {
    let cur = allCategories.find((c) => c.id === catId);
    while (cur?.parentId) cur = allCategories.find((c) => c.id === cur!.parentId);
    return cur ?? { id: catId, name: "Overig", order: 99 };
  }

  function leafOrder(parentId: string | null): string[] {
    const children = allCategories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.order - b.order);
    return children.flatMap((c) =>
      allCategories.some((x) => x.parentId === c.id) ? leafOrder(c.id) : [c.id]
    );
  }

  // ── Inventarisatie grouping ──────────────────────────────────────────────
  const rootMap: Record<string, RootGroup> = {};
  for (const inv of inventories) {
    const leafCatId   = inv.categoryId ?? inv.article.category.id;
    const leafCatName = inv.category?.name ?? inv.article.category.name;
    const root = findRoot(leafCatId);
    if (!rootMap[root.id]) rootMap[root.id] = { name: root.name, order: root.order, cats: {} };
    if (!rootMap[root.id].cats[leafCatId]) rootMap[root.id].cats[leafCatId] = { name: leafCatName, items: [] };
    rootMap[root.id].cats[leafCatId].items.push({
      id: inv.id,
      locatieType: inv.locatieType,
      locatieNummer: inv.locatieNummer,
      bordNummer: inv.bordNummer,
      stock: inv.stock,
      notes: inv.notes,
      createdAt: inv.createdAt.toISOString(),
      isDisplayMaterial: (inv as any).isDisplayMaterial ?? false,
      displayAfmeting: inv.displayAfmeting,
      article: { articleNumber: inv.article.articleNumber, articleName: inv.article.articleName, status: (inv.article as any).status },
      createdBy: { name: inv.createdBy.name },
    });
  }

  const sortedRoots = Object.entries(rootMap)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([rootId, rootGroup]) => {
      const order = leafOrder(rootId);
      const sortedCats = Object.fromEntries(
        Object.entries(rootGroup.cats).sort(([a], [b]) => {
          const ai = order.indexOf(a), bi = order.indexOf(b);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        })
      );
      return [rootId, { ...rootGroup, cats: sortedCats }] as [string, RootGroup];
    });

  const hasLocatie = inventories.some((i) => i.locatieType);

  // ── Verschil ─────────────────────────────────────────────────────────────
  const invKeys = new Set(
    inventories
      .filter((i) => i.locatieType && !(i as any).isDisplayMaterial)
      .map((i) => `${i.articleId}|${i.locatieType}|${i.locatieNummer}`)
  );
  const planKeys = new Set(
    planogramItems.map((p) => `${p.articleId}|${p.locatieType}|${p.locatieNummer}`)
  );

  const missingRootMap: Record<string, VerschilRoot> = {};
  for (const p of planogramItems) {
    if (!invKeys.has(`${p.articleId}|${p.locatieType}|${p.locatieNummer}`)) {
      const root = findRoot(p.category.id);
      if (!missingRootMap[root.id]) missingRootMap[root.id] = { name: root.name, order: root.order, items: [], leafOrder: leafOrder(root.id) };
      const alreadyAdded = missingRootMap[root.id].items.some(
        (x) => x.articleNumber === p.article.articleNumber && x.locatieType === p.locatieType && x.locatieNummer === p.locatieNummer
      );
      if (!alreadyAdded) {
        missingRootMap[root.id].items.push({
          articleNumber: p.article.articleNumber,
          articleName: p.article.articleName,
          catName: p.category.name,
          catId: p.category.id,
          locatieType: p.locatieType,
          locatieNummer: p.locatieNummer,
        });
      }
    }
  }

  const extraRootMap: Record<string, VerschilRoot> = {};
  for (const inv of inventories) {
    if (!inv.locatieType) continue;
    if ((inv as any).isDisplayMaterial) continue; // displaymateriaal hoort niet op schappenplan
    if (!planKeys.has(`${inv.articleId}|${inv.locatieType}|${inv.locatieNummer}`)) {
      const leafCatId = inv.categoryId ?? inv.article.category.id;
      const root = findRoot(leafCatId);
      if (!extraRootMap[root.id]) extraRootMap[root.id] = { name: root.name, order: root.order, items: [], leafOrder: leafOrder(root.id) };
      extraRootMap[root.id].items.push({
        articleNumber: inv.article.articleNumber,
        articleName: inv.article.articleName,
        catName: inv.category?.name ?? inv.article.category.name,
        catId: inv.categoryId ?? inv.article.category.id,
        locatieType: inv.locatieType,
        locatieNummer: inv.locatieNummer ?? 0,
      });
    }
  }

  const showFloorVerschil: ShowFloorVerschilItem[] = showFloors
    .filter((sf) => sf.status === "aanwezig, beschadigd" || sf.status === "niet aanwezig")
    .map((sf) => ({
      id: sf.id,
      nummer: sf.nummer,
      articleNumber: sf.article.articleNumber,
      articleName: sf.article.articleName,
      status: sf.status,
      notes: sf.notes,
    }));

  const selectedShowroom = allShowrooms.find((s) => s.id === showroomId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventarisatie</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isHQ ? `Showroom ${selectedShowroom?.name} · ` : ""}Per afdeling · Per wand / bok / bord
          </p>
        </div>
        <Link
          href="/dashboard/inventory/new"
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          <Plus className="w-4 h-4" />
          Nieuwe inventarisatie
        </Link>
      </div>

      {/* Showroom selector for HQ */}
      {isHQ && (
        <div className="flex items-center gap-2 flex-wrap">
          {allShowrooms.map((sr) => (
            <Link
              key={sr.id}
              href={`/dashboard/inventory?showroom=${sr.id}`}
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

      <InventoryTabs
        sortedRoots={sortedRoots}
        hasLocatie={hasLocatie}
        verschilMissing={Object.values(missingRootMap)}
        verschilExtra={Object.values(extraRootMap)}
        showFloorItems={showFloorVerschil}
      />
    </div>
  );
}
