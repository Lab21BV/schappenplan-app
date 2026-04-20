import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

const VALID_TYPES = new Set(["WAND", "BOK", "STROK"]);
const VALID_AFMETINGEN = new Set(["100x60", "120x60", "STROK"]);

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

  const allArticles = await prisma.article.findMany({ select: { id: true, articleNumber: true, categoryId: true } });
  const articleMap = new Map(allArticles.map((a) => [a.articleNumber.trim().toUpperCase(), a]));

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
    const locatieType = String(row["locatie_type"] ?? row["Locatie Type"] ?? "").trim().toUpperCase();
    const locatieNummer = parseInt(String(row["locatie_nummer"] ?? row["Locatie Nummer"] ?? "1"));
    const positie = parseInt(String(row["positie"] ?? row["Positie"] ?? "1"));
    const displayAfmeting = String(row["display_afmeting"] ?? row["Display Afmeting"] ?? "100x60").trim();
    const notes = String(row["notities"] ?? row["Notities"] ?? "").trim() || null;

    if (!articleNumber) { errors.push(`Rij ${rowNr}: artikelnummer ontbreekt`); continue; }
    if (!VALID_TYPES.has(locatieType)) { errors.push(`Rij ${rowNr}: locatie_type "${locatieType}" ongeldig (gebruik WAND, BOK of STROK)`); continue; }
    if (!VALID_AFMETINGEN.has(displayAfmeting)) { errors.push(`Rij ${rowNr}: display_afmeting "${displayAfmeting}" ongeldig (gebruik 100x60, 120x60 of STROK)`); continue; }
    if (isNaN(locatieNummer) || locatieNummer < 1) { errors.push(`Rij ${rowNr}: locatie_nummer ongeldig`); continue; }
    if (isNaN(positie) || positie < 1) { errors.push(`Rij ${rowNr}: positie ongeldig`); continue; }

    const article = articleMap.get(articleNumber);
    if (!article) { errors.push(`Rij ${rowNr}: artikel "${articleNumber}" niet gevonden`); continue; }

    items.push({ articleId: article.id, categoryId: article.categoryId, showroomId, locatieType, locatieNummer, positie, displayAfmeting, notes });
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors, imported: 0 }, { status: 422 });
  }

  await prisma.planogramItem.deleteMany({ where: { showroomId } });
  await prisma.planogramItem.createMany({ data: items });

  return NextResponse.json({ imported: items.length, errors: [] });
}
