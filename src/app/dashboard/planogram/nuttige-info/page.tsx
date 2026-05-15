import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShowrooms } from "@/lib/dataCache";
import KoppelingenTable, { type KoppelingSection } from "@/components/KoppelingenTable";
import PageHelp, { HelpList, HelpSection } from "@/components/PageHelp";
import koppelingenData from "@/lib/data/koppelingen-patroon-pvc.json";

export default async function NuttigeInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ showroom?: string }>;
}) {
  const session = await auth();
  if (!session) return null;
  const user = session.user as { role: string; showroomId: string | null };
  const isHQ = user.role === "HOOFDKANTOOR";

  const { showroom: showroomParam } = await searchParams;

  const allShowrooms = isHQ ? await getShowrooms() : [];
  const showroomId = isHQ
    ? (allShowrooms.find((s) => s.id === showroomParam)?.id ?? allShowrooms[0]?.id ?? "")
    : (user.showroomId ?? (await prisma.showroom.findFirst())!.id);
  const showroom = await prisma.showroom.findUnique({ where: { id: showroomId } });

  const sections = koppelingenData as KoppelingSection[];
  const total = sections.reduce((sum, s) => sum + s.rows.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/planogram${isHQ && showroomId ? `?showroom=${showroomId}` : ""}`}
            className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Terug naar schappenplan
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nuttige info — Patroonvloeren PVC</h1>
          <p className="text-gray-500 text-sm mt-1">
            {showroom?.name ? `Showroom ${showroom.name} · ` : ""}
            Koppeling visgraat / walvisgraat / hongaarse &amp; weense punt ↔ bijbehorende rechte plank ·{" "}
            {total} combinaties
          </p>
        </div>
      </div>

      {/* Showroom selector for HQ — voor consistentie met overige pagina's; de inhoud is gelijk per showroom */}
      {isHQ && (
        <div className="flex items-center gap-2 flex-wrap">
          {allShowrooms.map((sr) => (
            <Link
              key={sr.id}
              href={`/dashboard/planogram/nuttige-info?showroom=${sr.id}`}
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

      <PageHelp title="Toelichting — hoe lees je dit koppelingsdocument?" defaultOpen>
        <HelpSection title="Wat is een koppeling?">
          <p>
            Elke rij toont twee artikelen die als <strong>combinatie</strong> worden
            aangeboden, met hetzelfde decor maar een ander legpatroon:
          </p>
          <HelpList>
            <li>
              <strong>Linker kolom</strong> = het patroonartikel (visgraat, walvisgraat,
              hongaarse of weense punt).
            </li>
            <li>
              <strong>Rechter kolom</strong> = de bijbehorende rechte plankvariant —
              bedoeld als <em>band</em> of <em>bies</em> langs de patroonvloer.
            </li>
            <li>
              <strong>↔</strong> = de pijl geeft aan dat de twee artikelen bij elkaar
              horen: zelfde kleur/decor, ander legpatroon.
            </li>
          </HelpList>
        </HelpSection>
        <HelpSection title="Drie secties">
          <HelpList>
            <li>
              <strong className="text-blue-900">Sectie 1 — Visgraat Klik PVC</strong>:
              klikvloer-varianten + bijpassende rechte klikplank.
            </li>
            <li>
              <strong className="text-purple-900">Sectie 2 — Visgraat Lijm PVC</strong>:
              lijmvloer-varianten + bijpassende rechte lijmplank.
            </li>
            <li>
              <strong className="text-red-900">Sectie 3 — Weense / Hongaarse punt
                Lijm PVC</strong>: punt-patronen + bijpassende rechte plank.
            </li>
          </HelpList>
        </HelpSection>
        <HelpSection title="Zoeken">
          <p>
            Gebruik het zoekveld om snel een artikelnummer, kleurnaam of decor te
            vinden. De zoekopdracht filtert alle drie de secties tegelijk.
          </p>
        </HelpSection>
      </PageHelp>

      <KoppelingenTable sections={sections} />
    </div>
  );
}
