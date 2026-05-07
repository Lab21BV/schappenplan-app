import type { CategoryTree } from "@/types";

interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  slug?: string;
}

export function buildCategoryTree<T extends CategoryNode>(
  parentId: string | null,
  allCats: T[],
): CategoryTree[] {
  return allCats
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug ?? "",
      parentId: c.parentId,
      order: c.order,
      children: buildCategoryTree(c.id, allCats),
    }));
}

export function findRoot<T extends CategoryNode>(
  catId: string,
  allCats: T[],
): { id: string; name: string; order: number } {
  let cur = allCats.find((c) => c.id === catId);
  while (cur?.parentId) cur = allCats.find((c) => c.id === cur!.parentId);
  return cur
    ? { id: cur.id, name: cur.name, order: cur.order }
    : { id: catId, name: "Overig", order: 99 };
}

export function leafOrder<T extends CategoryNode>(
  parentId: string | null,
  allCats: T[],
): string[] {
  return allCats
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .flatMap((c) =>
      allCats.some((x) => x.parentId === c.id) ? leafOrder(c.id, allCats) : [c.id],
    );
}
