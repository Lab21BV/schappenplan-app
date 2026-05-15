import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShowrooms } from "@/lib/dataCache";
import { ARTICLE_STATUSES } from "@/lib/displayOptions";
import {
  OmzetReport,
  StalenVerdelenReport,
  UitCollectieReport,
  GhostStalenReport,
  OntbreektStalenReport,
  type OmzetRow,
  type VerdelenRow,
  type UitCollectieRow,
  type GhostRow,
  type OntbreektRow,
} from "@/components/RapportenViews";
import PageHelp, { HelpList, HelpSection } from "@/components/PageHelp";

type Tab =
  | "omzet"
  | "ontbreekt"
  | "ghost"
  | "verdelen"
  | "uitcollectie"
  | "bestellijst";

const TABS: { key: Tab; label: string }[] = [
  { key: "ontbreekt", label: "Ontbrekend op showroom" },
  { key: "ghost", label: "Stalen zonder schappenplan" },
  { key: "verdelen", label: "Stalen verdelen" },
  { key: "uitcollectie", label: "Uit collectie" },
  { key: "omzet", label: "Omzet per referentie" },
  { key: "bestellijst", label: "Bestellijst" },
];

const UIT_COLLECTIE: ReadonlyArray<string> = ARTICLE_STATUSES.filter((s) => s !== "Collectie");

export default async function RapportenPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") redirect("/dashboard");

  const { tab: rawTab = "ontbreekt" } = await searchParams;
  const tab: Tab = (TABS.some((t) => t.key === rawTab) ? rawTab : "ontbreekt") as Tab;

  return (
    <div className="space-y-6 max-lg:space-y-5 max-lg:pb-2">
      <div>
        <h1 className="text-2xl max-lg:text-xl font-bold text-gray-900">Rapporten</h1>
        <p className="text-gray-500 text-sm mt-1">
          HQ-overzichten: ontbrekende stalen, herverdeling, uit-collectie, omzet en bestellijst.
        </p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap max-lg:w-full max-lg:flex-nowrap max-lg:overflow-x-auto max-lg:no-scrollbar max-lg:pb-1 mobile-fade-in">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/rapporten?tab=${t.key}`}
            className={`px-4 py-2 max-lg:py-3 rounded-lg text-sm font-medium transition-colors mobile-animate-fast max-lg:whitespace-nowrap ${
              tab === t.key ? "bg-white text-blue-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <RapportenHelp tab={tab} />

      {tab === "ontbreekt" && <Ontbreekt />}
      {tab === "ghost" && <Ghost />}
      {tab === "verdelen" && <Verdelen />}
      {tab === "uitcollectie" && <UitCollectie />}
      {tab === "omzet" && <Omzet />}
      {tab === "bestellijst" && <Bestellijst />}
    </div>
  );
}

// ── Help per tab ──────────────────────────────────────────────────────────────

function RapportenHelp({ tab }: { tab: Tab }) {
  if (tab === "ontbreekt") {
    return (
      <PageHelp title="Toelichting — Ontbrekend op showroom">
        <HelpSection title="Wie staat in deze lijst?">
          <p>Artikelen die wel op het schappenplan staan, maar:</p>
          <HelpList>
            <li>géén overeenkomstige inventarisatie-regel hebben (zelfde <code className="bg-white/60 px-1 rounded">artikel + locatieType + locatieNummer</code>);</li>
            <li>én niet op dit moment uitgeleend zijn (open <em>Loan</em> voor dat artikel sluit uit);</li>
            <li>plus de status uit het showvloer-record als die er is (bv. <em>beschadigd</em>).</li>
          </HelpList>
        </HelpSection>
      </PageHelp>
    );
  }
  if (tab === "ghost") {
    return (
      <PageHelp title="Toelichting — Stalen zonder schappenplan (ghost)">
        <p>
          Inventarisatie-regels met een locatie, waarvoor de combinatie
          <code className="bg-white/60 px-1 rounded mx-1">artikel + locatie</code>
          niet op het schappenplan voorkomt. Bestelfouten of restanten.
        </p>
      </PageHelp>
    );
  }
  if (tab === "verdelen") {
    return (
      <PageHelp title="Toelichting — Stalen verdelen">
        <HelpSection title="Berekening per artikel">
          <HelpList>
            <li><strong>Ontbreekt in</strong> — showrooms waar het artikel op het schappenplan staat maar geen enkele inventarisatie-regel heeft.</li>
            <li><strong>Dubbel in</strong> — showrooms waar de totale stock (records × stock, minimaal 1 per record) &gt; 1 is.</li>
            <li>Sortering: meeste afwijkingen eerst, daarna leverancier en artikelnummer.</li>
          </HelpList>
        </HelpSection>
      </PageHelp>
    );
  }
  if (tab === "uitcollectie") {
    return (
      <PageHelp title="Toelichting — Uit collectie">
        <p>
          Alle inventarisatie- én planogram-regels waarvan het artikel een andere
          status heeft dan <em>Collectie</em> (bv. <em>Uit collectie</em>, <em>Vervangen</em>).
          Per regel zie je of het uit inventaris of uit het schappenplan komt.
        </p>
      </PageHelp>
    );
  }
  if (tab === "omzet") {
    return (
      <PageHelp title="Toelichting — Omzet per referentie">
        <HelpSection title="Kolommen">
          <HelpList>
            <li><strong>Omzet</strong> — som van <code className="bg-white/60 px-1 rounded">revenue</code> per artikel uit <em>SalesData</em>.</li>
            <li><strong>Aandeel %</strong> — omzet artikel ÷ totale omzet × 100.</li>
            <li><strong>Showrooms met staal</strong> — aantal unieke showrooms waar het artikel in de inventaris staat (met locatie).</li>
            <li><strong>% showrooms</strong> — showrooms met staal ÷ totaal aantal showrooms × 100.</li>
          </HelpList>
        </HelpSection>
      </PageHelp>
    );
  }
  if (tab === "bestellijst") {
    return (
      <PageHelp title="Toelichting — Bestellijst">
        <HelpSection title="Wat staat er in de Excel?">
          <HelpList>
            <li>Eén tabblad per leverancier, gegroepeerd per display-formaat.</li>
            <li><strong>Inclusief</strong>: stalen die op het schappenplan staan maar ontbreken in de inventaris, én vloerartikelen met showvloer-status <em>beschadigd</em> of <em>niet aanwezig</em>.</li>
            <li><strong>Exclusief</strong>: artikelen die nu open uitgeleend zijn — die hoeven niet besteld te worden.</li>
          </HelpList>
        </HelpSection>
      </PageHelp>
    );
  }
  return null;
}

// ── Ontbrekende stalen (planogram \ inventaris, excl. uitleen) ────────────────

async function Ontbreekt() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [showrooms, planogramItems, inventoryItems, openLoans, showFloors] = await Promise.all([
    getShowrooms(),
    prisma.planogramItem.findMany({
      select: {
        showroomId: true,
        articleId: true,
        locatieType: true,
        locatieNummer: true,
        displayAfmeting: true,
        article: { select: { articleNumber: true, articleName: true, supplierNameReal: true, status: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.inventory.findMany({
      where: { locatieType: { not: null } },
      select: { showroomId: true, articleId: true, locatieType: true, locatieNummer: true },
    }),
    prisma.loan
      .findMany({
        where: { returnedAt: null },
        select: { showroomId: true, articleId: true, customerName: true, promisedReturnAt: true },
      })
      .catch(() => []),
    prisma.showFloor.findMany({
      select: { showroomId: true, articleId: true, status: true, notes: true, nummer: true },
    }),
  ]);

  // Inventaris-set per showroom
  const invKey = (sid: string, aid: string, lt: string, ln: number) => `${sid}|${aid}|${lt}|${ln}`;
  const invSet = new Set(inventoryItems.map((i) => invKey(i.showroomId, i.articleId, i.locatieType!, i.locatieNummer!)));

  // Open loans per (showroom, article) — als artikel uitgeleend is, tellen we het niet als "ontbrekend"
  const loanKey = (sid: string, aid: string | null) => `${sid}|${aid ?? ""}`;
  const loanMap = new Map<string, { customer: string; promised: Date }>();
  for (const l of openLoans) {
    if (!l.articleId) continue;
    loanMap.set(loanKey(l.showroomId, l.articleId), { customer: l.customerName, promised: l.promisedReturnAt });
  }

  // ShowFloor status per (showroom, article) — geeft staat van displaymateriaal
  type SFInfo = { status: string | null; notes: string | null; nummer: string | null };
  const sfMap = new Map<string, SFInfo>();
  for (const sf of showFloors) {
    sfMap.set(`${sf.showroomId}|${sf.articleId}`, { status: sf.status, notes: sf.notes, nummer: sf.nummer });
  }

  const rows: OntbreektRow[] = [];
  for (const p of planogramItems) {
    if (invSet.has(invKey(p.showroomId, p.articleId, p.locatieType, p.locatieNummer))) continue;
    const loan = loanMap.get(loanKey(p.showroomId, p.articleId));
    if (loan) continue; // uitgeleend → sluit uit
    const sf = sfMap.get(`${p.showroomId}|${p.articleId}`);
    rows.push({
      showroomId: p.showroomId,
      showroomName: showrooms.find((s) => s.id === p.showroomId)?.name ?? "?",
      articleNumber: p.article.articleNumber,
      articleName: p.article.articleName,
      supplier: p.article.supplierNameReal,
      catName: p.category.name,
      locatieType: p.locatieType,
      locatieNummer: p.locatieNummer,
      displayAfmeting: p.displayAfmeting,
      articleStatus: p.article.status,
      showFloorStatus: sf?.status ?? null,
      showFloorNotes: sf?.notes ?? null,
      showFloorNummer: sf?.nummer ?? null,
    });
  }

  rows.sort(
    (a, b) =>
      a.showroomName.localeCompare(b.showroomName) ||
      a.supplier.localeCompare(b.supplier) ||
      a.articleNumber.localeCompare(b.articleNumber)
  );

  return <OntbreektStalenReport rows={rows} totalShowrooms={showrooms.length} />;
}

// ── "Ghost"-stalen: aanwezig in inventaris, niet op schappenplan ──────────────

async function Ghost() {
  const [showrooms, planogramItems, inventoryItems] = await Promise.all([
    getShowrooms(),
    prisma.planogramItem.findMany({
      select: { showroomId: true, articleId: true, locatieType: true, locatieNummer: true },
    }),
    prisma.inventory.findMany({
      where: { locatieType: { not: null } },
      select: {
        showroomId: true,
        articleId: true,
        locatieType: true,
        locatieNummer: true,
        stock: true,
        article: { select: { articleNumber: true, articleName: true, supplierNameReal: true, status: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  const planKey = (sid: string, aid: string, lt: string, ln: number) => `${sid}|${aid}|${lt}|${ln}`;
  const planSet = new Set(planogramItems.map((p) => planKey(p.showroomId, p.articleId, p.locatieType, p.locatieNummer)));

  const rows: GhostRow[] = [];
  for (const inv of inventoryItems) {
    if (!inv.locatieType) continue;
    if (planSet.has(planKey(inv.showroomId, inv.articleId, inv.locatieType, inv.locatieNummer!))) continue;
    rows.push({
      showroomId: inv.showroomId,
      showroomName: showrooms.find((s) => s.id === inv.showroomId)?.name ?? "?",
      articleNumber: inv.article.articleNumber,
      articleName: inv.article.articleName,
      supplier: inv.article.supplierNameReal,
      catName: inv.category?.name ?? "—",
      locatieType: inv.locatieType,
      locatieNummer: inv.locatieNummer ?? 0,
      stock: inv.stock,
      articleStatus: inv.article.status,
    });
  }

  rows.sort(
    (a, b) =>
      a.showroomName.localeCompare(b.showroomName) ||
      a.supplier.localeCompare(b.supplier) ||
      a.articleNumber.localeCompare(b.articleNumber)
  );

  return <GhostStalenReport rows={rows} />;
}

// ── Stalen verdelen — per artikel: showrooms zonder vs showrooms met dubbel ───

async function Verdelen() {
  const [showrooms, planogramItems, inventoryItems] = await Promise.all([
    getShowrooms(),
    prisma.planogramItem.findMany({
      select: {
        showroomId: true,
        articleId: true,
        article: { select: { articleNumber: true, articleName: true, supplierNameReal: true } },
      },
    }),
    prisma.inventory.findMany({
      where: { locatieType: { not: null } },
      select: { showroomId: true, articleId: true, stock: true },
    }),
  ]);

  // Wie heeft het artikel op het schappenplan staan?
  const planByArticle = new Map<string, Set<string>>();
  const metaByArticle = new Map<string, { articleNumber: string; articleName: string; supplier: string }>();
  for (const p of planogramItems) {
    if (!planByArticle.has(p.articleId)) planByArticle.set(p.articleId, new Set());
    planByArticle.get(p.articleId)!.add(p.showroomId);
    if (!metaByArticle.has(p.articleId)) {
      metaByArticle.set(p.articleId, {
        articleNumber: p.article.articleNumber,
        articleName: p.article.articleName,
        supplier: p.article.supplierNameReal,
      });
    }
  }

  // Inventory count per (article, showroom) — telt records én stock
  const invCount = new Map<string, number>(); // key = articleId|showroomId → totaal stuks
  for (const inv of inventoryItems) {
    const k = `${inv.articleId}|${inv.showroomId}`;
    invCount.set(k, (invCount.get(k) ?? 0) + Math.max(inv.stock, 1));
  }

  const rows: VerdelenRow[] = [];
  for (const [articleId, planShowroomIds] of planByArticle) {
    const meta = metaByArticle.get(articleId)!;
    const missingIn: string[] = [];
    const doubleIn: { name: string; count: number }[] = [];
    for (const sr of showrooms) {
      const inPlan = planShowroomIds.has(sr.id);
      const cnt = invCount.get(`${articleId}|${sr.id}`) ?? 0;
      if (inPlan && cnt === 0) missingIn.push(sr.name);
      if (cnt > 1) doubleIn.push({ name: sr.name, count: cnt });
    }
    if (missingIn.length === 0 && doubleIn.length === 0) continue;
    rows.push({
      articleNumber: meta.articleNumber,
      articleName: meta.articleName,
      supplier: meta.supplier,
      missingIn,
      doubleIn,
    });
  }

  rows.sort(
    (a, b) =>
      (b.missingIn.length + b.doubleIn.length) - (a.missingIn.length + a.doubleIn.length) ||
      a.supplier.localeCompare(b.supplier) ||
      a.articleNumber.localeCompare(b.articleNumber)
  );

  return <StalenVerdelenReport rows={rows} totalShowrooms={showrooms.length} />;
}

// ── Uit-collectie stalen per showroom ─────────────────────────────────────────

async function UitCollectie() {
  const [showrooms, inventoryItems, planogramItems] = await Promise.all([
    getShowrooms(),
    prisma.inventory.findMany({
      where: {
        locatieType: { not: null },
        article: { status: { in: [...UIT_COLLECTIE] } },
      },
      select: {
        showroomId: true,
        locatieType: true,
        locatieNummer: true,
        bordNummer: true,
        article: { select: { articleNumber: true, articleName: true, supplierNameReal: true, status: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.planogramItem.findMany({
      where: { article: { status: { in: [...UIT_COLLECTIE] } } },
      select: {
        showroomId: true,
        locatieType: true,
        locatieNummer: true,
        positie: true,
        article: { select: { articleNumber: true, articleName: true, supplierNameReal: true, status: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  const rows: UitCollectieRow[] = [];

  for (const inv of inventoryItems) {
    rows.push({
      showroomId: inv.showroomId,
      showroomName: showrooms.find((s) => s.id === inv.showroomId)?.name ?? "?",
      source: "Inventaris",
      articleNumber: inv.article.articleNumber,
      articleName: inv.article.articleName,
      supplier: inv.article.supplierNameReal,
      catName: inv.category?.name ?? "—",
      locatieType: inv.locatieType ?? "",
      locatieNummer: inv.locatieNummer ?? 0,
      positie: inv.bordNummer ?? null,
      articleStatus: inv.article.status,
    });
  }
  for (const p of planogramItems) {
    rows.push({
      showroomId: p.showroomId,
      showroomName: showrooms.find((s) => s.id === p.showroomId)?.name ?? "?",
      source: "Schappenplan",
      articleNumber: p.article.articleNumber,
      articleName: p.article.articleName,
      supplier: p.article.supplierNameReal,
      catName: p.category.name,
      locatieType: p.locatieType,
      locatieNummer: p.locatieNummer,
      positie: p.positie,
      articleStatus: p.article.status,
    });
  }

  rows.sort(
    (a, b) =>
      a.showroomName.localeCompare(b.showroomName) ||
      a.supplier.localeCompare(b.supplier) ||
      a.articleNumber.localeCompare(b.articleNumber)
  );

  return <UitCollectieReport rows={rows} />;
}

// ── Omzet per referentie + % showrooms met staal ──────────────────────────────

async function Omzet() {
  const [showrooms, sales, inventoryItems] = await Promise.all([
    getShowrooms(),
    prisma.salesData.findMany({
      select: {
        articleId: true,
        revenue: true,
        quantity: true,
        article: { select: { articleNumber: true, articleName: true, supplierNameReal: true, status: true } },
      },
    }),
    prisma.inventory.findMany({
      where: { locatieType: { not: null } },
      select: { showroomId: true, articleId: true },
    }),
  ]);

  type Agg = {
    articleNumber: string;
    articleName: string;
    supplier: string;
    revenue: number;
    quantity: number;
    showrooms: Set<string>;
    status: string;
  };

  const byArticle = new Map<string, Agg>();
  for (const s of sales) {
    if (!byArticle.has(s.articleId)) {
      byArticle.set(s.articleId, {
        articleNumber: s.article.articleNumber,
        articleName: s.article.articleName,
        supplier: s.article.supplierNameReal,
        revenue: 0,
        quantity: 0,
        showrooms: new Set(),
        status: s.article.status,
      });
    }
    const a = byArticle.get(s.articleId)!;
    a.revenue += s.revenue;
    a.quantity += s.quantity;
  }
  for (const inv of inventoryItems) {
    const a = byArticle.get(inv.articleId);
    if (a) a.showrooms.add(inv.showroomId);
  }

  const totalRevenue = [...byArticle.values()].reduce((s, a) => s + a.revenue, 0);

  const rows: OmzetRow[] = [...byArticle.values()]
    .map((a) => ({
      articleNumber: a.articleNumber,
      articleName: a.articleName,
      supplier: a.supplier,
      revenue: a.revenue,
      quantity: a.quantity,
      revenueShare: totalRevenue > 0 ? (a.revenue / totalRevenue) * 100 : 0,
      showroomsWithStaal: a.showrooms.size,
      pctShowrooms: showrooms.length > 0 ? (a.showrooms.size / showrooms.length) * 100 : 0,
      status: a.status,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return <OmzetReport rows={rows} totalShowrooms={showrooms.length} totalRevenue={totalRevenue} />;
}

// ── Bestellijst — link naar Excel download ────────────────────────────────────

function Bestellijst() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Bestellijst per leverancier</h2>
        <p className="text-sm text-gray-500 mt-1">
          Excel-bestand met per leverancier een tab van ontbrekende stalen, gegroepeerd per formaat. De
          lijst sluit openstaande uitleningen uit en neemt stalen mee waarvan het displaymateriaal in de
          showvloer is gemarkeerd als <em>beschadigd</em> of <em>niet aanwezig</em>.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="/api/rapporten/bestellijst"
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          ↓ Download bestellijst (Excel)
        </a>
        <a
          href="/api/rapporten/bestellijst?format=csv"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          ↓ CSV (1 sheet)
        </a>
      </div>
    </div>
  );
}
