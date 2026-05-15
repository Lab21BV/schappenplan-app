import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShowrooms, getCategories } from "@/lib/dataCache";
import { findRoot } from "@/lib/categoryTree";
import Link from "next/link";
import ShowFloorManager from "@/components/ShowFloorManager";
import PageHelp, { HelpList, HelpSection } from "@/components/PageHelp";

export default async function ShowFloorPage({
  searchParams,
}: {
  searchParams: Promise<{ showroom?: string }>;
}) {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  const isHQ = user.role === "HOOFDKANTOOR";

  const { showroom: showroomParam } = await searchParams;

  const allShowrooms = isHQ ? await getShowrooms() : [];

  const showroomId = isHQ
    ? (allShowrooms.find((s) => s.id === showroomParam)?.id ?? allShowrooms[0]?.id ?? "")
    : (user.showroomId ?? (await prisma.showroom.findFirst())!.id);

  const allCategories = await getCategories();

  const fr = (catId: string) => findRoot(catId, allCategories);

  const vloerLeafCatIds = new Set(
    allCategories
      .filter((c) => !allCategories.some((x) => x.parentId === c.id))
      .filter((c) => fr(c.id).name === "Vloer")
      .map((c) => c.id)
  );

  const catRootMap: Record<string, { id: string; name: string; order: number }> = {};
  for (const cat of allCategories) {
    if (!allCategories.some((c) => c.parentId === cat.id)) {
      catRootMap[cat.id] = fr(cat.id);
    }
  }

  const [showFloors, articles, showroom] = await Promise.all([
    prisma.showFloor.findMany({
      where: { showroomId },
      include: { article: { include: { category: true } } },
      orderBy: { nummer: "asc" },
    }),
    prisma.article.findMany({
      where: { isActive: true, categoryId: { in: [...vloerLeafCatIds] } },
      include: { category: true },
      orderBy: { articleName: "asc" },
    }),
    prisma.showroom.findUnique({ where: { id: showroomId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Showvloer</h1>
        <p className="text-gray-500 text-sm mt-1">
          Showroom {showroom?.name} · Tentoongestelde vloeren
        </p>
      </div>

      {/* Showroom selector for HQ */}
      {isHQ && (
        <div className="flex items-center gap-2 flex-wrap">
          {allShowrooms.map((sr) => (
            <Link
              key={sr.id}
              href={`/dashboard/showfloor?showroom=${sr.id}`}
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

      <PageHelp title="Toelichting Showvloer — tentoongestelde vloeren">
        <HelpSection title="Wat registreer je hier?">
          <p>
            De daadwerkelijk <strong>tentoongestelde vloerartikelen</strong> in deze
            showroom, genummerd per positie. Alleen artikelen uit de categorie
            <em> Vloer</em> zijn beschikbaar — de overige categorieën horen op het
            schappenplan.
          </p>
        </HelpSection>

        <HelpSection title="Statussen en hoe ze meetellen">
          <HelpList>
            <li><strong className="text-green-700">Aanwezig</strong> — het vloerstuk staat tentoongesteld en is in goede staat.</li>
            <li><strong className="text-amber-700">Aanwezig, beschadigd</strong> — staat er, maar moet vervangen worden. Wordt op de inventarisatie-pagina als <em>afwijking</em> en in de bestellijst als <em>te bestellen</em> meegeteld.</li>
            <li><strong className="text-red-700">Niet aanwezig</strong> — hoort hier te staan, maar ontbreekt. Komt in het verschil-overzicht.</li>
          </HelpList>
        </HelpSection>

        <HelpSection title="Wat kun je hier doen?">
          <HelpList>
            <li><strong>+ Artikel toevoegen</strong> — een nieuw vloerstuk koppelen aan een positienummer.</li>
            <li><strong>Status wijzigen</strong> — per regel via het dropdown-veld.</li>
            <li><strong>Notitie</strong> toevoegen (bijv. &quot;hoek afgesleten&quot;) — verschijnt in het bestellijst-rapport.</li>
            <li><strong>Verwijderen</strong> via het prullenbak-icoontje.</li>
          </HelpList>
        </HelpSection>
      </PageHelp>

      <ShowFloorManager
        showFloors={showFloors as any}
        articles={articles as any}
        showroomId={showroomId}
        catRootMap={catRootMap}
        isHQ={isHQ}
      />
    </div>
  );
}
