import { cache } from "react";
import { prisma } from "@/lib/prisma";

// React cache(): per-request memoization. Same query within one render → 1 DB call.
export const getShowrooms = cache(async () => {
  return prisma.showroom.findMany({ orderBy: { name: "asc" } });
});

export const getCategories = cache(async () => {
  return prisma.category.findMany({ orderBy: { order: "asc" } });
});
