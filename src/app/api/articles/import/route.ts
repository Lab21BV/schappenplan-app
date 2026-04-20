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
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

  const categories = await prisma.category.findMany();

  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const artikelnummer = String(row["artikelnummer"] ?? "").trim();
    const artikelnaam = String(row["artikelnaam"] ?? "").trim();
    const leverancier = String(row["leverancier"] ?? "").trim();
    const categorieRaw = String(row["categorie"] ?? "").trim();
    const displayRaw = String(row["display"] ?? "").trim();
    const kostprijs = parseFloat(String(row["kostprijs"] ?? "").replace(",", ".")) || 0;
    const verkoopprijs = parseFloat(String(row["verkoopprijs_incl_btw"] ?? "").replace(",", ".")) || 0;
    const verkoopprijsExBtw = verkoopprijs / 1.21;
    const grossMargin = verkoopprijsExBtw > 0 ? ((verkoopprijsExBtw - kostprijs) / verkoopprijsExBtw) * 100 : 0;
    const prio = Math.min(5, Math.max(1, parseInt(String(row["prio"] ?? "3")) || 3));

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
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, errors });
}
