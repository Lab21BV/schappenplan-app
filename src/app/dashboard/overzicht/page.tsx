import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PlanogramView from "@/components/PlanogramView";
import InventoryTabs from "@/components/InventoryTabs";
import type { RootGroup, VerschilRoot, ShowFloorVerschilItem } from "@/components/InventoryTabs";
import { ShowroomsOverview, LeveranciersOverview, VerschilDetail, TotaalVerschilOverview } from "@/components/HQOverview";
import type { ShowroomStat, SupplierRow, VerschilShowroom } from "@/components/HQOverview";
import type { CategoryTree } from "@/types";

type View = "overzicht" | "schappenplan" | "inventarisatie" | "verschil";

const VIEWS: { key: View; label: string }[] = [
  { key: "overzicht", label: "Overzicht" },
  { key: "schappenplan", label: "Schappenplan" },
  { key: "inventarisatie", label: "Inventarisatie" },
  { key: "verschil", label: "Verschil" },
];

function buildCategoryTree(parentId: string | null, allCats: any[]): CategoryTree[] {
  return allCats
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ ...c, children: buildCategoryTree(c.id, allCats) }));
}

function findRoot(catId: string, allCats: any[]): { id: string; name: string; order: number } {
  let cur = allCats.find((c: any) => c.id === catId);
  while (cur?.parentId) cur = allCats.find((c: any) => c.id === cur!.parentId);
  return cur ?? { id: catId, name: "Overig", order: 99 };
}

function leafOrder(parentId: string | null, allCats: any[]): string[] {
  return allCats
    .filter((c: any) => c.parentId === parentId)
    .sort((a: any, b: any) => a.order - b.order)
    .flatMap((c: any) =>
      allCats.some((x: any) => x.parentId === c.id) ? leafOrder(c.id, allCats) : [c.id]
    );
}

export default async function OverzichtPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; showroom?: string }>;
}) {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") redirect("/dashboard");

  const { view: rawView = "overzicht", showroom: showroomParam } = await searchParams;
  const view: View = (["overzicht", "schappenplan", "inventarisatie", "verschil"].includes(rawView)
    ? rawView
    : "overzicht") as View;

  const showrooms = await prisma.showroom.findMany({ orderBy: { name: "asc" } });
  const selectedShowroom = showrooms.find((s) => s.id === showroomParam) ?? showrooms[0];
  const showroomId = selectedShowroom?.id ?? "";

  const needsShowroomSelector = view === "schappenplan" || view === "inventarisatie";
  const activeHref = (v: View, sr?: string) => {
    const base = "/dashboard/overzicht";
    const srId = sr ?? (needsShowroomSelector ? showroomId : undefined);
    const params = new URLSearchParams();
    if (v !== "overzicht") params.set("view", v);
    if (srId && (v === "schappenplan" || v === "inventarisatie")) params.set("showroom", srId);
    if (srId && v === "verschil") params.set("showroom", srId);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HQ Overzicht</h1>
        <p className="text-gray-500 text-sm mt-1">{showrooms.length} showrooms · Schappenplan & Inventaris</p>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {VIEWS.map((v) => {
          const href = activeHref(v.key);
          const active = view === v.key;
          return (
            <Link
              key={v.key}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-white text-blue-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>

      {/* Showroom selector for schappenplan / inventarisatie / per-showroom verschil */}
      {(needsShowroomSelector || view === "verschil") && (
        <div className="flex items-center gap-2 flex-wrap">
          {view === "verschil" && (
            <Link
              href="/dashboard/overzicht?view=verschil"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                !showroomParam
                  ? "bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Alle showrooms
            </Link>
          )}
          {showrooms.map((sr) => (
            <Link
              key={sr.id}
              href={activeHref(view, sr.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                sr.id === showroomId && (needsShowroomSelector || showroomParam)
                  ? "bg-blue-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {sr.name}
            </Link>
          ))}
        </div>
      )}

      {/* ── View content ─────────────────────────────────────────── */}
      {view === "overzicht" && <OverzichtView showrooms={showrooms} />}
      {view === "schappenplan" && <SchappenplanView showroomId={showroomId} showroomName={selectedShowroom?.name ?? ""} />}
      {view === "inventarisatie" && <InventarisatieView showroomId={showroomId} showroomName={selectedShowroom?.name ?? ""} />}
      {view === "verschil" && <VerschilView showrooms={showrooms} filterShowroomId={showroomParam} />}
    </div>
  );
}

// ── Overzicht ─────────────────────────────────────────────────────────────────

async function OverzichtView({ showrooms }: { showrooms: { id: string; name: string }[] }) {
  const [planogramItems, inventoryItems] = await Promise.all([
    prisma.planogramItem.findMany({
      include: {
        article: { select: { id: true, articleNumber: true, articleName: true, supplierNameReal: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.inventory.findMany({
      where: { locatieType: { not: null } },
      include: {
        article: { select: { id: true, articleNumber: true, articleName: true, supplierNameReal: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  const showroomStats: ShowroomStat[] = showrooms.map((sr) => {
    const plan = planogramItems.filter((p) => p.showroomId === sr.id);
    const inv = inventoryItems.filter((i) => i.showroomId === sr.id);
    const invKeys = new Set(inv.map((i) => `${i.articleId}|${i.locatieType}|${i.locatieNummer}`));
    const planKeys = new Set(plan.map((p) => `${p.articleId}|${p.locatieType}|${p.locatieNummer}`));
    const missingKeys = new Set<string>();
    for (const p of plan) { const k = `${p.articleId}|${p.locatieType}|${p.locatieNummer}`; if (!invKeys.has(k)) missingKeys.add(k); }
    const extraKeys = new Set<string>();
    for (const i of inv) { const k = `${i.articleId}|${i.locatieType}|${i.locatieNummer}`; if (!planKeys.has(k)) extraKeys.add(k); }
    return { id: sr.id, name: sr.name, planogramCount: plan.length, inventoryCount: inv.length, missingCount: missingKeys.size, extraCount: extraKeys.size };
  });

  const articleMap = new Map<string, { articleNumber: string; articleName: string; supplier: string; planShowrooms: Set<string>; invShowrooms: Set<string>; planTotal: number; invTotal: number }>();
  for (const p of planogramItems) {
    if (!articleMap.has(p.article.id)) articleMap.set(p.article.id, { articleNumber: p.article.articleNumber, articleName: p.article.articleName, supplier: p.article.supplierNameReal, planShowrooms: new Set(), invShowrooms: new Set(), planTotal: 0, invTotal: 0 });
    const e = articleMap.get(p.article.id)!; e.planShowrooms.add(p.showroomId); e.planTotal++;
  }
  for (const i of inventoryItems) {
    if (!articleMap.has(i.article.id)) articleMap.set(i.article.id, { articleNumber: i.article.articleNumber, articleName: i.article.articleName, supplier: i.article.supplierNameReal, planShowrooms: new Set(), invShowrooms: new Set(), planTotal: 0, invTotal: 0 });
    const e = articleMap.get(i.article.id)!; e.invShowrooms.add(i.showroomId); e.invTotal++;
  }

  const supplierRows: SupplierRow[] = [...articleMap.values()]
    .map((a) => ({ articleNumber: a.articleNumber, articleName: a.articleName, supplier: a.supplier, planShowrooms: a.planShowrooms.size, invShowrooms: a.invShowrooms.size, planTotal: a.planTotal, invTotal: a.invTotal, verschilShowrooms: Math.abs(a.planShowrooms.size - a.invShowrooms.size) }))
    .sort((a, b) => a.supplier.localeCompare(b.supplier) || a.articleNumber.localeCompare(b.articleNumber));

  return (
    <div className="space-y-6">
      <ShowroomsOverview stats={showroomStats} totalShowrooms={showrooms.length} />
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Per leverancier</h2>
        <LeveranciersOverview rows={supplierRows} totalShowrooms={showrooms.length} />
      </div>
    </div>
  );
}

// ── Schappenplan ──────────────────────────────────────────────────────────────

async function SchappenplanView({ showroomId, showroomName }: { showroomId: string; showroomName: string }) {
  const [allCategories, displayConfigs, planogramItems] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.displayConfig.findMany({ where: { showroomId }, include: { category: true } }),
    prisma.planogramItem.findMany({
      where: { showroomId },
      include: { article: true },
      orderBy: [{ locatieType: "asc" }, { locatieNummer: "asc" }, { positie: "asc" }],
    }),
  ]);

  const categoryTree = buildCategoryTree(null, allCategories as any[]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{planogramItems.length} items · Showroom {showroomName}</p>
      <PlanogramView
        showroomId={showroomId}
        categoryTree={categoryTree as any}
        planogramItems={planogramItems as any}
        displayConfigs={displayConfigs as any}
        isHQ={true}
      />
    </div>
  );
}

// ── Inventarisatie ────────────────────────────────────────────────────────────

async function InventarisatieView({ showroomId, showroomName }: { showroomId: string; showroomName: string }) {
  const [inventories, allCategories, planogramItems, showFloors] = await Promise.all([
    prisma.inventory.findMany({
      where: { showroomId },
      include: { article: { include: { category: true } }, category: true, showroom: true, createdBy: true },
      orderBy: [{ categoryId: "asc" }, { locatieType: "asc" }, { locatieNummer: "asc" }, { bordNummer: "asc" }, { createdAt: "desc" }],
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

  function fr(catId: string) { return findRoot(catId, allCategories); }
  function lo(parentId: string | null) { return leafOrder(parentId, allCategories); }

  // Build sortedRoots for InventoryTabs
  const rootMap: Record<string, RootGroup> = {};
  for (const inv of inventories) {
    const leafCatId = inv.categoryId ?? inv.article.category.id;
    const leafCatName = inv.category?.name ?? inv.article.category.name;
    const root = fr(leafCatId);
    if (!rootMap[root.id]) rootMap[root.id] = { name: root.name, order: root.order, cats: {} };
    if (!rootMap[root.id].cats[leafCatId]) rootMap[root.id].cats[leafCatId] = { name: leafCatName, items: [] };
    rootMap[root.id].cats[leafCatId].items.push({
      id: inv.id, locatieType: inv.locatieType, locatieNummer: inv.locatieNummer, bordNummer: inv.bordNummer,
      stock: inv.stock, notes: inv.notes, createdAt: inv.createdAt.toISOString(),
      article: { articleNumber: inv.article.articleNumber, articleName: inv.article.articleName },
      createdBy: { name: inv.createdBy.name },
    });
  }

  const sortedRoots = Object.entries(rootMap)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([rootId, rootGroup]) => {
      const order = lo(rootId);
      const sortedCats = Object.fromEntries(
        Object.entries(rootGroup.cats).sort(([a], [b]) => {
          const ai = order.indexOf(a), bi = order.indexOf(b);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        })
      );
      return [rootId, { ...rootGroup, cats: sortedCats }] as [string, RootGroup];
    });

  const invKeys = new Set(inventories.filter((i) => i.locatieType).map((i) => `${i.articleId}|${i.locatieType}|${i.locatieNummer}`));
  const planKeys = new Set(planogramItems.map((p) => `${p.articleId}|${p.locatieType}|${p.locatieNummer}`));

  const missingRootMap: Record<string, VerschilRoot> = {};
  for (const p of planogramItems) {
    if (!invKeys.has(`${p.articleId}|${p.locatieType}|${p.locatieNummer}`)) {
      const root = fr(p.category.id);
      if (!missingRootMap[root.id]) missingRootMap[root.id] = { name: root.name, order: root.order, items: [], leafOrder: lo(root.id) };
      if (!missingRootMap[root.id].items.some((x) => x.articleNumber === p.article.articleNumber && x.locatieType === p.locatieType && x.locatieNummer === p.locatieNummer)) {
        missingRootMap[root.id].items.push({ articleNumber: p.article.articleNumber, articleName: p.article.articleName, catName: p.category.name, catId: p.category.id, locatieType: p.locatieType, locatieNummer: p.locatieNummer });
      }
    }
  }

  const extraRootMap: Record<string, VerschilRoot> = {};
  for (const inv of inventories) {
    if (!inv.locatieType) continue;
    if (!planKeys.has(`${inv.articleId}|${inv.locatieType}|${inv.locatieNummer}`)) {
      const leafCatId = inv.categoryId ?? inv.article.category.id;
      const root = fr(leafCatId);
      if (!extraRootMap[root.id]) extraRootMap[root.id] = { name: root.name, order: root.order, items: [], leafOrder: lo(root.id) };
      extraRootMap[root.id].items.push({ articleNumber: inv.article.articleNumber, articleName: inv.article.articleName, catName: inv.category?.name ?? inv.article.category.name, catId: leafCatId, locatieType: inv.locatieType, locatieNummer: inv.locatieNummer ?? 0 });
    }
  }

  const showFloorVerschil: ShowFloorVerschilItem[] = showFloors
    .filter((sf) => sf.status === "aanwezig, beschadigd" || sf.status === "niet aanwezig")
    .map((sf) => ({ id: sf.id, nummer: sf.nummer, articleNumber: sf.article.articleNumber, articleName: sf.article.articleName, status: sf.status, notes: sf.notes }));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{inventories.length} regels · Showroom {showroomName}</p>
      <InventoryTabs
        sortedRoots={sortedRoots}
        hasLocatie={inventories.some((i) => i.locatieType)}
        verschilMissing={Object.values(missingRootMap)}
        verschilExtra={Object.values(extraRootMap)}
        showFloorItems={showFloorVerschil}
      />
    </div>
  );
}

// ── Verschil ──────────────────────────────────────────────────────────────────

async function VerschilView({
  showrooms,
  filterShowroomId,
}: {
  showrooms: { id: string; name: string }[];
  filterShowroomId?: string;
}) {
  const [planogramItems, inventoryItems] = await Promise.all([
    prisma.planogramItem.findMany({
      where: filterShowroomId ? { showroomId: filterShowroomId } : undefined,
      include: {
        article: { select: { id: true, articleNumber: true, articleName: true, supplierNameReal: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.inventory.findMany({
      where: filterShowroomId ? { showroomId: filterShowroomId, locatieType: { not: null } } : { locatieType: { not: null } },
      include: {
        article: { select: { id: true, articleNumber: true, articleName: true, supplierNameReal: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  const targetShowrooms = filterShowroomId
    ? showrooms.filter((s) => s.id === filterShowroomId)
    : showrooms;

  const verschilByShowroom: VerschilShowroom[] = targetShowrooms
    .map((sr) => {
      const plan = planogramItems.filter((p) => p.showroomId === sr.id);
      const inv = inventoryItems.filter((i) => i.showroomId === sr.id);
      const invKeys = new Set(inv.map((i) => `${i.articleId}|${i.locatieType}|${i.locatieNummer}`));
      const planKeys = new Set(plan.map((p) => `${p.articleId}|${p.locatieType}|${p.locatieNummer}`));

      const seenM = new Set<string>();
      const missing = plan
        .filter((p) => { const k = `${p.articleId}|${p.locatieType}|${p.locatieNummer}`; if (invKeys.has(k) || seenM.has(k)) return false; seenM.add(k); return true; })
        .map((p) => ({ articleNumber: p.article.articleNumber, articleName: p.article.articleName, supplier: p.article.supplierNameReal, catName: p.category.name, locatieType: p.locatieType, locatieNummer: p.locatieNummer }));

      const seenE = new Set<string>();
      const extra = inv
        .filter((i) => { const k = `${i.articleId}|${i.locatieType}|${i.locatieNummer}`; if (planKeys.has(k) || seenE.has(k)) return false; seenE.add(k); return true; })
        .map((i) => ({ articleNumber: i.article.articleNumber, articleName: i.article.articleName, supplier: i.article.supplierNameReal, catName: i.category?.name ?? "", locatieType: i.locatieType ?? "", locatieNummer: i.locatieNummer ?? 0 }));

      return { showroomId: sr.id, showroomName: sr.name, missing, extra };
    })
    .filter((v) => v.missing.length > 0 || v.extra.length > 0);

  const exportButtons = (
    <div className="flex items-center gap-2">
      <a
        href="/api/planogram/export-verschil?format=xlsx"
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        ↓ Excel
      </a>
      <a
        href="/api/planogram/export-verschil?format=csv"
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        ↓ CSV
      </a>
    </div>
  );

  if (filterShowroomId) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{exportButtons}</div>
        <VerschilDetail items={verschilByShowroom} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div />
        {exportButtons}
      </div>
      <TotaalVerschilOverview verschilByShowroom={verschilByShowroom} totalShowrooms={showrooms.length} />
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Per showroom</h2>
        <VerschilDetail items={verschilByShowroom} />
      </div>
    </div>
  );
}
