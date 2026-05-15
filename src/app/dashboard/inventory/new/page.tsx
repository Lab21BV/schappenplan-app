import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/dataCache";
import NewInventoryForm from "@/components/NewInventoryForm";

export default async function NewInventoryPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;

  const showroomId = user.showroomId ?? (await prisma.showroom.findFirst())!.id;

  const [articles, showrooms, categories, displayConfigs] = await Promise.all([
    prisma.article.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: [{ category: { order: "asc" } }, { articleName: "asc" }],
    }),
    user.role === "HOOFDKANTOOR"
      ? prisma.showroom.findMany()
      : prisma.showroom.findMany({ where: { id: showroomId } }),
    getCategories(),
    prisma.displayConfig.findMany({
      where: { showroomId },
      include: { category: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-lg:space-y-5 max-lg:pb-2">
      <div className="mobile-fade-in">
        <h1 className="text-2xl max-lg:text-xl font-bold text-gray-900">Nieuwe inventarisatie</h1>
        <p className="text-gray-500 text-sm mt-1">Per afdeling · Per wand / bok · Per bord</p>
      </div>
      <NewInventoryForm
        articles={articles as any}
        showrooms={showrooms}
        categories={categories}
        displayConfigs={displayConfigs as any}
        defaultShowroomId={showroomId}
        userId={(session.user as any).id}
      />
    </div>
  );
}
