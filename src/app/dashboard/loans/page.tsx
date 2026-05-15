import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShowrooms } from "@/lib/dataCache";
import Link from "next/link";
import LoansManager from "@/components/LoansManager";
import PageHelp, { HelpList, HelpNote, HelpSection } from "@/components/PageHelp";

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ showroom?: string }>;
}) {
  const session = await auth();
  if (!session) return null;
  const user = session.user as { id: string; role: string; showroomId: string | null };
  const isHQ = user.role === "HOOFDKANTOOR";

  const { showroom: showroomParam } = await searchParams;

  const allShowrooms = isHQ ? await getShowrooms() : [];

  const showroomId = isHQ
    ? (allShowrooms.find((s) => s.id === showroomParam)?.id ?? allShowrooms[0]?.id ?? "")
    : (user.showroomId ?? (await prisma.showroom.findFirst())!.id);

  const [loans, articles, inventoryItems, showroom] = await Promise.all([
    prisma.loan.findMany({
      where: { showroomId },
      include: { user: true, article: true, inventory: true },
      orderBy: [{ returnedAt: "asc" }, { promisedReturnAt: "asc" }],
    }),
    prisma.article.findMany({
      where: { isActive: true },
      select: { id: true, articleNumber: true, articleName: true },
      orderBy: { articleName: "asc" },
    }),
    prisma.inventory.findMany({
      where: { showroomId },
      include: { article: { select: { articleNumber: true, articleName: true } } },
      orderBy: [{ locatieType: "asc" }, { locatieNummer: "asc" }, { bordNummer: "asc" }],
      take: 1000,
    }),
    prisma.showroom.findUnique({ where: { id: showroomId } }),
  ]);

  const loansSerialized = loans.map((l) => ({
    id: l.id,
    itemDescription: l.itemDescription,
    customerName: l.customerName,
    customerEmail: l.customerEmail,
    customerPhone: l.customerPhone,
    customerAddress: l.customerAddress,
    borrowedAt: l.borrowedAt.toISOString(),
    promisedReturnAt: l.promisedReturnAt.toISOString(),
    returnedAt: l.returnedAt ? l.returnedAt.toISOString() : null,
    notes: l.notes,
    articleId: l.articleId,
    article: l.article ? { articleNumber: l.article.articleNumber, articleName: l.article.articleName } : null,
    inventoryId: l.inventoryId,
    inventory: l.inventory
      ? {
          locatieType: l.inventory.locatieType,
          locatieNummer: l.inventory.locatieNummer,
          bordNummer: l.inventory.bordNummer,
        }
      : null,
    user: { name: l.user.name },
  }));

  const inventoryOptions = inventoryItems.map((i) => ({
    id: i.id,
    label: `${i.locatieType ?? "-"} ${i.locatieNummer ?? ""}${i.bordNummer ? ` · bord ${i.bordNummer}` : ""} — ${i.article.articleNumber} ${i.article.articleName}`.trim(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Uitleningen</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isHQ ? `Showroom ${showroom?.name} · ` : ""}Uitgeleende stalen per klant
        </p>
      </div>

      {isHQ && (
        <div className="flex items-center gap-2 flex-wrap">
          {allShowrooms.map((sr) => (
            <Link
              key={sr.id}
              href={`/dashboard/loans?showroom=${sr.id}`}
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

      <PageHelp title="Toelichting Uitleningen — registratie & opvolging">
        <HelpSection title="Wanneer gebruik je deze pagina?">
          <p>
            Telkens als een klant een staal (bord, strook, sample) meeneemt, leg je dat
            hier vast. Zo weet je wie wat heeft, wanneer het terug moet, en zie je op de
            inventarisatie-pagina automatisch een <strong className="text-amber-700">Uitgeleend</strong> badge
            in plaats van een <em>ontbreekt</em>-melding.
          </p>
        </HelpSection>

        <HelpSection title="Nieuwe uitlening — verplichte velden">
          <HelpList>
            <li><strong>Omschrijving van het staal</strong> (bijv. &quot;Bord 120×60 Sensation Oak Grey&quot;).</li>
            <li><strong>Klantnaam</strong> (e-mail, telefoon, adres optioneel maar aanbevolen).</li>
            <li><strong>Geleend op</strong> en <strong>Toegezegd terug</strong> — default is vandaag + 14 dagen.</li>
            <li>(Optioneel) <strong>Inventaris-item</strong> — als je de exacte locatie kiest, springt de inventarisatie-pagina automatisch op <em>Uitgeleend</em> bij die rij.</li>
          </HelpList>
        </HelpSection>

        <HelpSection title="Tabbladen & berekening">
          <HelpList>
            <li><strong>Open</strong> — <code className="bg-white/60 px-1 rounded">returnedAt is null</code> én <code className="bg-white/60 px-1 rounded">promisedReturnAt ≥ vandaag</code>.</li>
            <li><strong className="text-red-700">Te laat</strong> — <code className="bg-white/60 px-1 rounded">returnedAt is null</code> én <code className="bg-white/60 px-1 rounded">promisedReturnAt &lt; vandaag</code>. Dagen te laat = vandaag − toegezegd terug.</li>
            <li><strong className="text-green-700">Teruggebracht</strong> — <code className="bg-white/60 px-1 rounded">returnedAt</code> is gezet.</li>
          </HelpList>
        </HelpSection>

        <HelpSection title="Acties">
          <HelpList>
            <li><strong>✓ Terug</strong> aan het eind van de rij → markeert als teruggebracht en verplaatst naar de juiste tab.</li>
            <li>Klik op de omschrijving voor de <strong>detailpagina</strong> (bewerken, verwijderen, retour ongedaan maken).</li>
          </HelpList>
          <HelpNote>
            Per ongeluk afgemeld? Open de detailpagina en klik op <em>↺ Maak retour ongedaan</em>.
          </HelpNote>
        </HelpSection>
      </PageHelp>

      <LoansManager
        loans={loansSerialized}
        articles={articles}
        inventoryOptions={inventoryOptions}
        showroomId={showroomId}
      />
    </div>
  );
}
