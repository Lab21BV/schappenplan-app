import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Cross-request cache: showrooms/categories change extremely rarely (only via seed/admin).
// 1u revalidate + tag voor handmatige invalidatie (revalidateTag('showrooms'|'categories')).
const showroomsCached = unstable_cache(
  () => prisma.showroom.findMany({ orderBy: { name: "asc" } }),
  ["showrooms-list"],
  { tags: ["showrooms"], revalidate: 3600 }
);

const categoriesCached = unstable_cache(
  () => prisma.category.findMany({ orderBy: { order: "asc" } }),
  ["categories-list"],
  { tags: ["categories"], revalidate: 3600 }
);

// React cache() on top: dedupes within a single render pass.
export const getShowrooms = cache(() => showroomsCached());
export const getCategories = cache(() => categoriesCached());
