import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminManager from "@/components/AdminManager";

export default async function AdminPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") redirect("/dashboard");

  const [showrooms, categories, displayConfigs] = await Promise.all([
    prisma.showroom.findMany(),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.displayConfig.findMany({ include: { category: true, showroom: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Beheer</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configureer displays per showroom en categorie
        </p>
      </div>
      <AdminManager
        showrooms={showrooms}
        categories={categories}
        displayConfigs={displayConfigs as any}
      />
    </div>
  );
}
