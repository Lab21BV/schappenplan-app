import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function displayInfo(afmeting: string): { type: string; size: string } {
  if (afmeting === "STROK") return { type: "Strook", size: "" };
  if (afmeting === "100x60") return { type: "Bord", size: "100x60" };
  if (afmeting === "120x60") return { type: "Bord", size: "120x60" };
  return { type: afmeting || "—", size: "" };
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const [showrooms, planogramItems, inventoryItems] = await Promise.all([
    prisma.showroom.findMany({ orderBy: { name: "asc" } }),
    prisma.planogramItem.findMany({
      include: {
        article: { select: { articleNumber: true, articleName: true, supplierNameReal: true } },
      },
    }),
    prisma.inventory.findMany({
      where: { locatieType: { not: null } },
      select: { showroomId: true, articleId: true, locatieType: true, locatieNummer: true },
    }),
  ]);

  const showroomNames = showrooms.map((s) => s.name);

  // Build lookup sets: per showroom, which article+locatie keys are in inventory
  const invByShowroom = new Map<string, Set<string>>();
  for (const sr of showrooms) invByShowroom.set(sr.id, new Set());
  for (const i of inventoryItems) {
    invByShowroom.get(i.showroomId)?.add(`${i.articleId}|${i.locatieType}|${i.locatieNummer}`);
  }

  // Build per-showroom plan sets
  const planByShowroom = new Map<string, Set<string>>();
  for (const sr of showrooms) planByShowroom.set(sr.id, new Set());
  for (const p of planogramItems) {
    planByShowroom.get(p.showroomId)?.add(`${p.articleId}|${p.locatieType}|${p.locatieNummer}`);
  }

  // Collect unique slots (articleId + locatieType + locatieNummer) from all planograms
  type Slot = {
    key: string;
    articleId: string;
    articleNumber: string;
    articleName: string;
    supplier: string;
    displayAfmeting: string;
    locatieType: string;
    locatieNummer: number;
  };

  const slotMap = new Map<string, Slot>();
  for (const p of planogramItems) {
    const key = `${p.articleId}|${p.locatieType}|${p.locatieNummer}`;
    if (!slotMap.has(key)) {
      slotMap.set(key, {
        key,
        articleId: p.articleId,
        articleNumber: p.article.articleNumber,
        articleName: p.article.articleName,
        supplier: p.article.supplierNameReal,
        displayAfmeting: p.displayAfmeting,
        locatieType: p.locatieType,
        locatieNummer: p.locatieNummer,
      });
    }
  }

  // For each slot, compute status per showroom and keep only slots with at least one verschil
  type DataRow = {
    supplier: string;
    articleNumber: string;
    articleName: string;
    locatieType: string;
    locatieNummer: number;
    displayType: string;
    size: string;
    statuses: string[]; // one per showroom, in order
    hasVerschil: boolean;
  };

  const rows: DataRow[] = [];

  for (const slot of slotMap.values()) {
    const { type: displayType, size } = displayInfo(slot.displayAfmeting);
    const statuses = showrooms.map((sr) => {
      const inPlan = planByShowroom.get(sr.id)?.has(slot.key) ?? false;
      const inInv = invByShowroom.get(sr.id)?.has(slot.key) ?? false;
      if (!inPlan) return "—";
      return inInv ? "OK" : "Ontbreekt";
    });

    const hasVerschil = statuses.some((s) => s === "Ontbreekt");
    if (!hasVerschil) continue;

    rows.push({
      supplier: slot.supplier,
      articleNumber: slot.articleNumber,
      articleName: slot.articleName,
      locatieType: slot.locatieType,
      locatieNummer: slot.locatieNummer,
      displayType,
      size,
      statuses,
      hasVerschil,
    });
  }

  rows.sort((a, b) =>
    a.supplier.localeCompare(b.supplier) ||
    a.articleNumber.localeCompare(b.articleNumber) ||
    a.locatieType.localeCompare(b.locatieType) ||
    a.locatieNummer - b.locatieNummer
  );

  const date = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const header = ["Leverancier", "Artikelnummer", "Artikelnaam", "Locatie Type", "Locatie Nr.", "Display Type", "Afmeting", ...showroomNames].join(";");
    const csvRows = rows.map((r) =>
      [r.supplier, r.articleNumber, r.articleName, r.locatieType, r.locatieNummer, r.displayType, r.size, ...r.statuses].join(";")
    );
    const csv = [header, ...csvRows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="verschil_leveranciers_${date}.csv"`,
      },
    });
  }

  // ── Excel ────────────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // Group by supplier
  const bySupplier = rows.reduce((acc, r) => {
    if (!acc[r.supplier]) acc[r.supplier] = [];
    acc[r.supplier].push(r);
    return acc;
  }, {} as Record<string, DataRow[]>);

  for (const [supplier, supplierRows] of Object.entries(bySupplier)) {
    const headerRow = ["Artikelnummer", "Artikelnaam", "Locatie Type", "Locatie Nr.", "Display Type", "Afmeting", ...showroomNames];
    const dataRows = supplierRows.map((r) => [
      r.articleNumber,
      r.articleName,
      r.locatieType,
      r.locatieNummer,
      r.displayType,
      r.size,
      ...r.statuses,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

    // Column widths
    ws["!cols"] = [
      { wch: 14 }, // artikelnummer
      { wch: 36 }, // artikelnaam
      { wch: 12 }, // locatie type
      { wch: 11 }, // locatie nr
      { wch: 13 }, // display type
      { wch: 10 }, // afmeting
      ...showroomNames.map(() => ({ wch: 12 })),
    ];

    const sheetName = supplier.length > 31 ? supplier.substring(0, 31) : supplier;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Summary sheet (all suppliers combined)
  const summaryHeader = ["Leverancier", "Artikelnummer", "Artikelnaam", "Locatie Type", "Locatie Nr.", "Display Type", "Afmeting", ...showroomNames];
  const summaryData = rows.map((r) => [r.supplier, r.articleNumber, r.articleName, r.locatieType, r.locatieNummer, r.displayType, r.size, ...r.statuses]);
  const summaryWs = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryData]);
  summaryWs["!cols"] = [
    { wch: 22 }, { wch: 14 }, { wch: 36 }, { wch: 12 }, { wch: 11 }, { wch: 13 }, { wch: 10 },
    ...showroomNames.map(() => ({ wch: 12 })),
  ];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Alle leveranciers");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="verschil_leveranciers_${date}.xlsx"`,
    },
  });
}
