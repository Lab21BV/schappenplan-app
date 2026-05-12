import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { parseLocatieStrict } from "@/lib/displayOptions";

const VALID_AFMETINGEN = new Set([
  "100x60", "120x60", "60x40", "STROK", "staal",
  "sample", "kapstaal", "showbaan", "waaier",
  "staal-19x21", "renotrap-21x19", "traprenovatiedisplay",
]);

// "Strook" / "strook" → canonical "STROK"; "Staal" → "staal";
// aliases for the extra afmetingen so import bestand mag NL-labels gebruiken
function normalizeAfmeting(raw: string): string {
  const v = raw.trim();
  if (!v) return "100x60";
  if (/^strook$/i.test(v)) return "STROK";
  if (/^staal$/i.test(v)) return "staal";
  if (/^sample$/i.test(v)) return "sample";
  if (/^kapstaal$/i.test(v)) return "kapstaal";
  if (/^showbaan$/i.test(v)) return "showbaan";
  if (/^waaier$/i.test(v)) return "waaier";
  if (/^(bord\s*)?100\s*[x×]\s*60$/i.test(v)) return "100x60";
  if (/^(bord\s*)?120\s*[x×]\s*60$/i.test(v)) return "120x60";
  if (/^(bord\s*)?60\s*[x×]\s*40$/i.test(v)) return "60x40";
  if (/^staal\s*19\s*[x×]\s*21(\s*cm)?$/i.test(v)) return "staal-19x21";
  if (/^renotrap\s*21\s*[x×]\s*19(\s*cm)?$/i.test(v)) return "renotrap-21x19";
  if (/^traprenovatiedisplay$/i.test(v)) return "traprenovatiedisplay";
  return v;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const showroomId = formData.get("showroomId") as string | null;

  if (!file || !showroomId) {
    return NextResponse.json({ error: "Bestand en showroom zijn vereist" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

  if (rows.length === 0) {
    return NextResponse.json({ error: "Bestand is leeg" }, { status: 400 });
  }

  const [allArticles, allCategories] = await Promise.all([
    prisma.article.findMany({ select: { id: true, articleNumber: true, categoryId: true } }),
    prisma.category.findMany({ select: { id: true, slug: true, name: true } }),
  ]);
  const articleMap = new Map(allArticles.map((a) => [a.articleNumber.trim().toUpperCase(), a]));

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const categoryMap = new Map<string, string>();
  for (const c of allCategories) {
    categoryMap.set(c.id.toLowerCase(), c.id);
    categoryMap.set(c.slug.toLowerCase(), c.id);
    categoryMap.set(norm(c.name), c.id);
  }

  type ImportRow = {
    articleId: string;
    categoryId: string;
    showroomId: string;
    locatieType: string;
    locatieNummer: number;
    positie: number;
    displayAfmeting: string;
    notes: string | null;
  };

  const items: ImportRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNr = i + 2; // 1-indexed + header

    const articleNumber = String(row["artikelnummer"] ?? row["Artikelnummer"] ?? "").trim().toUpperCase();
    const rawLocatieType = String(row["locatie_type"] ?? row["Locatie Type"] ?? "");
    const rawLocatieNummer = String(row["locatie_nummer"] ?? row["Locatie Nummer"] ?? "1");
    const positie = parseInt(String(row["positie"] ?? row["Positie"] ?? "1"));
    const displayAfmeting = normalizeAfmeting(String(row["display_afmeting"] ?? row["Display Afmeting"] ?? "100x60"));
    const notes = String(row["notities"] ?? row["Notities"] ?? "").trim() || null;
    const rawAfdeling = String(
      row["afdeling"] ?? row["Afdeling"] ?? row["categorie"] ?? row["Categorie"] ?? "",
    ).trim();

    if (!articleNumber) { errors.push(`Rij ${rowNr}: artikelnummer ontbreekt`); continue; }
    const locResult = parseLocatieStrict(rawLocatieType, rawLocatieNummer);
    if (!locResult.ok) { errors.push(`Rij ${rowNr}: ${locResult.error}`); continue; }
    const loc = { type: locResult.type, nummer: locResult.nummer };
    if (!VALID_AFMETINGEN.has(displayAfmeting)) { errors.push(`Rij ${rowNr}: display_afmeting "${displayAfmeting}" ongeldig (gebruik 100x60, 120x60, STROK of staal)`); continue; }
    if (isNaN(positie) || positie < 1) { errors.push(`Rij ${rowNr}: positie ongeldig`); continue; }

    const article = articleMap.get(articleNumber);
    if (!article) { errors.push(`Rij ${rowNr}: artikel "${articleNumber}" niet gevonden`); continue; }

    let categoryId = article.categoryId;
    if (rawAfdeling) {
      const resolved =
        categoryMap.get(rawAfdeling.toLowerCase()) ?? categoryMap.get(norm(rawAfdeling));
      if (!resolved) {
        errors.push(`Rij ${rowNr}: afdeling "${rawAfdeling}" niet gevonden (gebruik slug, id of naam)`);
        continue;
      }
      categoryId = resolved;
    }

    items.push({ articleId: article.id, categoryId, showroomId, locatieType: loc.type, locatieNummer: loc.nummer, positie, displayAfmeting, notes });
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors, imported: 0 }, { status: 422 });
  }

  await prisma.planogramItem.deleteMany({ where: { showroomId } });
  await prisma.planogramItem.createMany({ data: items });

  return NextResponse.json({ imported: items.length, errors: [] });
}
