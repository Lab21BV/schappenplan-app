import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Grid3X3, ClipboardList, Package, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;

  const showroomId = user.showroomId;

  const [articleCount, inventoryCount, planogramCount] = await Promise.all([
    prisma.article.count({ where: { isActive: true } }),
    showroomId
      ? prisma.inventory.count({ where: { showroomId } })
      : prisma.inventory.count(),
    showroomId
      ? prisma.planogramItem.count({ where: { showroomId } })
      : prisma.planogramItem.count(),
  ]);

  const recentInventories = await prisma.inventory.findMany({
    where: showroomId ? { showroomId } : {},
    include: {
      article: true,
      showroom: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const topArticles = await prisma.article.findMany({
    where: { isActive: true },
    orderBy: { priorityScore: "desc" },
    take: 5,
    include: { category: true },
  });

  const stats = [
    { label: "Actieve artikelen", value: articleCount, icon: Package, color: "bg-blue-100 text-blue-700" },
    { label: "Planogram posities", value: planogramCount, icon: Grid3X3, color: "bg-green-100 text-green-700" },
    { label: "Inventarisaties", value: inventoryCount, icon: ClipboardList, color: "bg-orange-100 text-orange-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welkom terug, {user.name}
          {user.showroomName ? ` — ${user.showroomName}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top artikelen (prioriteit)</h2>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {topArticles.map((art, i) => (
              <div key={art.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-yellow-100 text-yellow-700" :
                  i === 1 ? "bg-gray-100 text-gray-600" :
                  "bg-orange-50 text-orange-600"
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{art.articleName}</p>
                  <p className="text-xs text-gray-500">{art.category.name}</p>
                </div>
                <div className="text-right">
                  <div className="w-16 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(art.priorityScore / 5, 1) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{art.priorityScore.toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recente inventarisaties</h2>
            <Link href="/dashboard/inventory" className="text-xs text-blue-600 hover:underline">
              Bekijk alles
            </Link>
          </div>
          {recentInventories.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Nog geen inventarisaties</p>
          ) : (
            <div className="space-y-3">
              {recentInventories.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{inv.article.articleName}</p>
                    <p className="text-xs text-gray-500">
                      {inv.showroom.name} · {new Date(inv.createdAt).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    inv.stock > 10 ? "bg-green-100 text-green-700" :
                    inv.stock > 0 ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {inv.stock} st.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/planogram" className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl p-5 transition group">
          <Grid3X3 className="w-6 h-6 mb-3" />
          <p className="font-semibold">Schappenplan bekijken</p>
          <p className="text-blue-200 text-sm mt-1">Planogram per categorie</p>
        </Link>
        <Link href="/dashboard/inventory/new" className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 transition">
          <ClipboardList className="w-6 h-6 mb-3 text-blue-700" />
          <p className="font-semibold text-gray-900">Inventarisatie aanmaken</p>
          <p className="text-gray-500 text-sm mt-1">Voorraad bijhouden</p>
        </Link>
        <Link href="/dashboard/showfloor" className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 transition">
          <Package className="w-6 h-6 mb-3 text-green-700" />
          <p className="font-semibold text-gray-900">Showvloer</p>
          <p className="text-gray-500 text-sm mt-1">Tentoongestelde artikelen</p>
        </Link>
      </div>
    </div>
  );
}
