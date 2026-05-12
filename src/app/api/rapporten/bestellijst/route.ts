import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShowrooms } from "@/lib/dataCache";
import { labelForAfmeting } from "@/lib/displayOptions";
import * as XLSX from "xlsx";

type Reason = "Ontbreekt" | "Beschadigd" | "Niet aanwezig";

function sheetName(name: string): string {
  // Excel sheet-namen max 31 chars en geen []:*?/\ in
  return name.replace(/[\[\]:*?\/\\]/g, "").slice(0, 31) || "Sheet";
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "xlsx";

  const [showrooms, planogramItems, inventoryItems, openLoans, showFloors] = await Promise.all([
    getShowrooms(),
    prisma.planogramItem.findMany({
      select: {
        showroomId: true,
        articleId: true,
        locatieType: true,
        locatieNummer: true,
        displayAfmeting: true,
        article: {
          select: { articleNumber: true, articleName: true, supplierNameReal: true, status: true },
        },
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
        select: { showroomId: true, articleId: true },
      })
      .catch(() => []),
    prisma.showFloor.findMany({
      select: {
        showroomId: true,
        articleId: true,
        status: true,
        notes: true,
        nummer: true,
        article: {
          select: { articleNumber: true, articleName: true, supplierNameReal: true, status: true },
        },
      },
    }),
  ]);

  const showroomName = new Map(showrooms.map((s) => [s.id, s.name]));

  const invSet = new Set(
    inventoryItems.map((i) => `${i.showroomId}|${i.articleId}|${i.locatieType}|${i.locatieNummer}`)
  );
  const loanSet = new Set(openLoans.filter((l) => l.articleId).map((l) => `${l.showroomId}|${l.articleId}`));

  type OrderRow = {
    supplier: string;
    articleNumber: string;
    articleName: string;
    afmeting: string;
    afmetingLabel: string;
    catName: string;
    locatie: string;
    showroomName: string;
    reason: Reason;
    detail: string;
    articleStatus: string;
  };

  const rows: OrderRow[] = [];

  // 1. Ontbreekt: in planogram, niet in inventaris, niet uitgeleend
  for (const p of planogramItems) {
    const k = `${p.showroomId}|${p.articleId}|${p.locatieType}|${p.locatieNummer}`;
    if (invSet.has(k)) continue;
    if (loanSet.has(`${p.showroomId}|${p.articleId}`)) continue;
    rows.push({
      supplier: p.article.supplierNameReal,
      articleNumber: p.article.articleNumber,
      articleName: p.article.articleName,
      afmeting: p.displayAfmeting,
      afmetingLabel: labelForAfmeting(p.displayAfmeting),
      catName: p.category.name,
      locatie: `${p.locatieType} ${p.locatieNummer}`,
      showroomName: showroomName.get(p.showroomId) ?? "?",
      reason: "Ontbreekt",
      detail: "",
      articleStatus: p.article.status,
    });
  }

  // 2. Showvloer-status beschadigd / niet aanwezig
  for (const sf of showFloors) {
    const status = (sf.status ?? "").toLowerCase();
    if (!status.includes("beschadigd") && !status.includes("niet aanwezig")) continue;
    rows.push({
      supplier: sf.article.supplierNameReal,
      articleNumber: sf.article.articleNumber,
      articleName: sf.article.articleName,
      afmeting: "",
      afmetingLabel: "Showvloer",
      catName: "",
      locatie: sf.nummer ? `#${sf.nummer}` : "",
      showroomName: showroomName.get(sf.showroomId) ?? "?",
      reason: status.includes("beschadigd") ? "Beschadigd" : "Niet aanwezig",
      detail: sf.notes ?? "",
      articleStatus: sf.article.status,
    });
  }

  rows.sort(
    (a, b) =>
      a.supplier.localeCompare(b.supplier) ||
      a.articleNumber.localeCompare(b.articleNumber) ||
      a.afmetingLabel.localeCompare(b.afmetingLabel) ||
      a.showroomName.localeCompare(b.showroomName)
  );

  const date = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const header = [
      "Leverancier",
      "Artikelnummer",
      "Artikelnaam",
      "Afmeting",
      "Afdeling",
      "Locatie",
      "Showroom",
      "Reden",
      "Detail",
      "Status artikel",
    ].join(";");
    const csv = [
      header,
      ...rows.map((r) =>
        [
          r.supplier,
          r.articleNumber,
          r.articleName,
          r.afmetingLabel,
          r.catName,
          r.locatie,
          r.showroomName,
          r.reason,
          r.detail.replace(/[\n;]/g, " "),
          r.articleStatus,
        ].join(";")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="bestellijst_${date}.csv"`,
      },
    });
  }

  // ── Excel ──
  const wb = XLSX.utils.book_new();

  // Samenvatting per leverancier × formaat
  type SumKey = string;
  const summary = new Map<SumKey, { supplier: string; afmeting: string; articleNumber: string; articleName: string; count: number; reasons: Record<Reason, number> }>();
  for (const r of rows) {
    const key = `${r.supplier}||${r.articleNumber}||${r.afmetingLabel}`;
    if (!summary.has(key)) {
      summary.set(key, {
        supplier: r.supplier,
        afmeting: r.afmetingLabel,
        articleNumber: r.articleNumber,
        articleName: r.articleName,
        count: 0,
        reasons: { Ontbreekt: 0, Beschadigd: 0, "Niet aanwezig": 0 },
      });
    }
    const s = summary.get(key)!;
    s.count++;
    s.reasons[r.reason]++;
  }
  const summaryRows = [...summary.values()].sort(
    (a, b) =>
      a.supplier.localeCompare(b.supplier) ||
      a.articleNumber.localeCompare(b.articleNumber) ||
      a.afmeting.localeCompare(b.afmeting)
  );

  const samenvattingSheet = XLSX.utils.aoa_to_sheet([
    ["Leverancier", "Artikelnummer", "Artikelnaam", "Afmeting", "Totaal", "Ontbreekt", "Beschadigd", "Niet aanwezig"],
    ...summaryRows.map((s) => [
      s.supplier,
      s.articleNumber,
      s.articleName,
      s.afmeting,
      s.count,
      s.reasons.Ontbreekt,
      s.reasons.Beschadigd,
      s.reasons["Niet aanwezig"],
    ]),
  ]);
  samenvattingSheet["!cols"] = [
    { wch: 24 }, { wch: 14 }, { wch: 36 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 11 }, { wch: 13 },
  ];
  XLSX.utils.book_append_sheet(wb, samenvattingSheet, "Samenvatting");

  // Per leverancier
  const bySupplier = rows.reduce((acc, r) => {
    if (!acc[r.supplier]) acc[r.supplier] = [];
    acc[r.supplier].push(r);
    return acc;
  }, {} as Record<string, OrderRow[]>);

  for (const [supplier, supplierRows] of Object.entries(bySupplier).sort(([a], [b]) => a.localeCompare(b))) {
    const data = [
      ["Artikelnummer", "Artikelnaam", "Afmeting", "Afdeling", "Locatie", "Showroom", "Reden", "Detail", "Status artikel"],
      ...supplierRows.map((r) => [
        r.articleNumber,
        r.articleName,
        r.afmetingLabel,
        r.catName,
        r.locatie,
        r.showroomName,
        r.reason,
        r.detail,
        r.articleStatus,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [
      { wch: 14 }, { wch: 36 }, { wch: 18 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 30 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, sheetName(supplier));
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bestellijst_${date}.xlsx"`,
    },
  });
}
