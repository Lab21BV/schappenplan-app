import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ArticlesManager from "@/components/ArticlesManager";

export default async function ArticlesPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") redirect("/dashboard");

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      include: { category: true },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  function leafOrder(parentId: string | null): string[] {
    const children = categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.order - b.order);
    return children.flatMap((c) =>
      categories.some((x) => x.parentId === c.id) ? leafOrder(c.id) : [c.id]
    );
  }

  const order = leafOrder(null);
  const sorted = [...articles].sort((a, b) => {
    const ai = order.indexOf(a.categoryId);
    const bi = order.indexOf(b.categoryId);
    const catDiff = (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    if (catDiff !== 0) return catDiff;
    return a.articleName.localeCompare(b.articleName);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Artikelbeheer</h1>
        <p className="text-gray-500 text-sm mt-1">
          Inclusief kostprijs, marge en echte leveranciersnamen
        </p>
      </div>
      <ArticlesManager articles={sorted as any} categories={categories} />
    </div>
  );
}
