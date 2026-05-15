import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/dataCache";
import { leafOrder } from "@/lib/categoryTree";
import ArticlesManager from "@/components/ArticlesManager";
import PageHelp, { HelpList, HelpNote, HelpSection } from "@/components/PageHelp";

export default async function ArticlesPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") redirect("/dashboard");

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      include: { category: true },
    }),
    getCategories(),
  ]);

  const order = leafOrder(null, categories);
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
      <PageHelp title="Toelichting Artikelbeheer — velden & marges">
        <HelpSection title="Wat beheer je hier?">
          <p>
            De centrale artikellijst die overal in de app wordt gebruikt (schappenplan,
            inventaris, uitleningen, rapporten).
          </p>
        </HelpSection>
        <HelpSection title="Velden">
          <HelpList>
            <li><strong>Artikelnummer</strong> + <strong>Naam</strong> — uniek, zichtbaar in keuzelijsten.</li>
            <li><strong>Leverancier</strong> (en echte leveranciersnaam — voor groepering in rapporten).</li>
            <li><strong>Categorie</strong> — bepaalt of een artikel in <em>Vloer</em>, <em>Raamdecoratie</em>, <em>Trap</em> etc. valt.</li>
            <li><strong>Kostprijs / Verkoopprijs</strong> — marge wordt automatisch berekend: <code className="bg-white/60 px-1 rounded">(verkoop − kost) ÷ verkoop × 100</code>.</li>
            <li><strong>Status</strong> — <em>Collectie</em> = actief; andere statussen tellen mee in het <em>Uit collectie</em>-rapport.</li>
            <li><strong>Actief</strong> — inactief = verbergt het artikel uit importlijsten en keuzemenu&apos;s.</li>
          </HelpList>
        </HelpSection>
        <HelpNote>
          Een artikel deactiveren is veiliger dan verwijderen: historische
          inventaris- en uitleenregels blijven dan zichtbaar.
        </HelpNote>
      </PageHelp>

      <ArticlesManager articles={sorted as any} categories={categories} />
    </div>
  );
}
