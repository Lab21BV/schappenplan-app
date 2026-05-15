import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShowrooms, getCategories } from "@/lib/dataCache";
import { buildCategoryTree } from "@/lib/categoryTree";
import PlanogramView from "@/components/PlanogramView";
import PlanogramImport from "@/components/PlanogramImport";
import PageHelp, { HelpList, HelpNote, HelpSection } from "@/components/PageHelp";
import { BookOpen } from "lucide-react";

export default async function PlanogramPage({
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

  // HQ: use URL param → fallback to first showroom
  // Verkoper: always their own showroom
  const showroomId = isHQ
    ? (allShowrooms.find((s) => s.id === showroomParam)?.id ?? allShowrooms[0]?.id ?? "")
    : (user.showroomId ?? (await prisma.showroom.findFirst())!.id);

  const [allCategories, showroom, displayConfigs, planogramItems] = await Promise.all([
    getCategories(),
    prisma.showroom.findUnique({ where: { id: showroomId } }),
    prisma.displayConfig.findMany({
      where: { showroomId },
      include: { category: true },
    }),
    prisma.planogramItem.findMany({
      where: { showroomId },
      include: { article: true },
      orderBy: [{ locatieType: "asc" }, { locatieNummer: "asc" }, { positie: "asc" }],
    }),
  ]);

  const categoryTree = buildCategoryTree(null, allCategories);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schappenplan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Showroom {showroom?.name} · Planogram overzicht per categorie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/planogram/nuttige-info${isHQ ? `?showroom=${showroomId}` : ""}`}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <BookOpen className="w-4 h-4" />
            Nuttige info
          </Link>
          <Link
            href="/dashboard/planogram/nieuw"
            className="flex items-center gap-2 px-3 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
          >
            + Standaard invullen
          </Link>
          {isHQ && <PlanogramImport showrooms={allShowrooms} isHQ={true} />}
        </div>
      </div>

      {/* Showroom selector for HQ */}
      {isHQ && (
        <div className="flex items-center gap-2 flex-wrap">
          {allShowrooms.map((sr) => (
            <Link
              key={sr.id}
              href={`/dashboard/planogram?showroom=${sr.id}`}
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

      <PageHelp title="Toelichting Schappenplan — opbouw & gebruik">
        <HelpSection title="Wat is het schappenplan?">
          <p>
            Het schappenplan is de <strong>norm</strong>: welke artikelen horen op welke
            locatie in deze showroom te staan. Het wordt door het hoofdkantoor bepaald
            en is de basis voor de verschil-berekening op de inventarisatiepagina.
          </p>
        </HelpSection>

        <HelpSection title="Lezen van een locatie">
          <HelpList>
            <li><strong>Locatie type / nummer</strong> — bijv. <code className="bg-white/60 px-1 rounded">wand 3</code> of <code className="bg-white/60 px-1 rounded">bok 2</code>.</li>
            <li><strong>Positie</strong> — volgorde binnen die locatie (links→rechts, boven→onder).</li>
            <li><strong>Artikel</strong> — artikelnummer + naam.</li>
            <li><strong>Display-afmeting</strong> — bord/strook-maat (bijv. 120×60).</li>
          </HelpList>
        </HelpSection>

        <HelpSection title="Wat kun je hier doen?">
          <HelpList>
            <li><strong>Standaard invullen</strong> — handmatig per locatie een artikel toewijzen.</li>
            {isHQ && <li><strong>Importeer / Exporteer</strong> (alleen HQ) — CSV/Excel uitwisselen. Importeren vervangt het bestaande plan voor de gekozen showroom volledig.</li>}
            <li>Als verkoper kun je het plan inzien maar niet wijzigen — meld fouten bij HQ.</li>
          </HelpList>
          {isHQ && (
            <HelpNote>
              Importeren overschrijft het bestaande schappenplan van de geselecteerde
              showroom volledig. Maak eerst een export als back-up.
            </HelpNote>
          )}
        </HelpSection>
      </PageHelp>

      <PlanogramView
        showroomId={showroomId}
        categoryTree={categoryTree as any}
        planogramItems={planogramItems as any}
        displayConfigs={displayConfigs as any}
        isHQ={isHQ}
      />
    </div>
  );
}
