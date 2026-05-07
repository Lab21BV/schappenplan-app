import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "HOOFDKANTOOR") {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Geen bestand" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  // Case-insensitive header lookup, with trimming
  const rows = rawRows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[String(k).trim().toLowerCase()] = v;
    }
    return normalized;
  });

  const pick = (row: Record<string, unknown>, ...keys: string[]): string => {
    for (const k of keys) {
      const v = row[k.toLowerCase()];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
    return "";
  };

  const categories = await prisma.category.findMany();
  const validStatuses = new Set(["Collectie", "Uitlopend", "Tijdelijk niet leverbaar"]);

  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const artikelnummer = pick(row, "artikelnummer").trim();
    const artikelnaam = pick(row, "artikelnaam").trim();
    const leverancier = pick(row, "leverancier").trim();
    const categorieRaw = pick(row, "categorie").trim();
    const displayRaw = pick(row, "display").trim();
    const kostprijs = parseFloat(pick(row, "kostprijs").replace(",", ".")) || 0;
    const verkoopprijs = parseFloat(pick(row, "verkoopprijs_incl_btw", "verkoopprijs incl btw", "verkoopprijs").replace(",", ".")) || 0;
    const verkoopprijsExBtw = verkoopprijs / 1.21;
    const grossMargin = verkoopprijsExBtw > 0 ? ((verkoopprijsExBtw - kostprijs) / verkoopprijsExBtw) * 100 : 0;
    const prioRaw = pick(row, "prio", "prioriteit", "priority");
    const prio = prioRaw
      ? Math.min(5, Math.max(1, parseInt(prioRaw, 10) || 3))
      : 3;
    const statusRaw = pick(row, "status").trim();
    const status = validStatuses.has(statusRaw) ? statusRaw : "Collectie";

    if (!artikelnummer) {
      errors.push(`Rij ${rowNum}: artikelnummer ontbreekt`);
      continue;
    }
    if (!artikelnaam) {
      errors.push(`Rij ${rowNum}: artikelnaam ontbreekt`);
      continue;
    }

    // Resolve category by name (case-insensitive leaf match)
    let categoryId: string | null = null;
    if (categorieRaw) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === categorieRaw.toLowerCase()
      );
      if (match) categoryId = match.id;
      else errors.push(`Rij ${rowNum}: categorie "${categorieRaw}" niet gevonden (overgeslagen)`);
    }
    if (!categoryId) {
      skipped++;
      continue;
    }

    // Parse display types
    const displayTypes: string[] = displayRaw
      ? displayRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
      : [];

    await prisma.article.upsert({
      where: { articleNumber: artikelnummer },
      create: {
        articleNumber: artikelnummer,
        articleName: artikelnaam,
        supplierNameAnonymized: leverancier,
        supplierNameReal: leverancier,
        categoryId,
        displayTypes: JSON.stringify(displayTypes),
        costPrice: kostprijs,
        sellingPrice: verkoopprijs,
        grossMargin: Math.round(grossMargin * 10) / 10,
        priorityScore: prio,
        status,
      },
      update: {
        articleName: artikelnaam,
        supplierNameAnonymized: leverancier,
        supplierNameReal: leverancier,
        categoryId,
        displayTypes: JSON.stringify(displayTypes),
        costPrice: kostprijs,
        sellingPrice: verkoopprijs,
        grossMargin: Math.round(grossMargin * 10) / 10,
        priorityScore: prio,
        status,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, errors });
}
