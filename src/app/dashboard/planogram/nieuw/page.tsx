import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StandardPlanogramForm from "@/components/StandardPlanogramForm";

export default async function NieuwSchappenplanPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;

  const showroomId = user.showroomId ?? (await prisma.showroom.findFirst())!.id;

  const [articles, showrooms, categories] = await Promise.all([
    prisma.article.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: [{ category: { order: "asc" } }, { articleName: "asc" }],
    }),
    user.role === "HOOFDKANTOOR"
      ? prisma.showroom.findMany()
      : prisma.showroom.findMany({ where: { id: showroomId } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Standaard schappenplan invullen</h1>
        <p className="text-gray-500 text-sm mt-1">Voeg artikelen toe per locatie en positie</p>
      </div>
      <StandardPlanogramForm
        articles={articles as any}
        showrooms={showrooms}
        categories={categories}
        defaultShowroomId={showroomId}
      />
    </div>
  );
}
