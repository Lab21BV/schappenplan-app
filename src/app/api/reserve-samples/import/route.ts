import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { RESERVE_SAMPLE_STATUSES } from "@/lib/reserveSampleStatuses";

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

  const validStatuses = new Set<string>(RESERVE_SAMPLE_STATUSES);

  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const articleNumber = pick(row, "artikelnr", "artikelnummer", "artikel nr", "nr").trim();
    const articleName = pick(row, "artikelnaam", "naam").trim();
    const statusRaw = pick(row, "status").trim();
    const bordStrook = pick(row, "bord / strook", "bord/strook", "bord", "strook", "bord_strook").trim();
    const afmeting = pick(row, "afmeting", "formaat").trim();
    const aantalRaw = pick(row, "aantal", "stuks");
    const notities = pick(row, "notities", "notitie", "opmerking").trim();
    const leverancier = pick(row, "leverancier").trim();

    if (!articleNumber) {
      errors.push(`Rij ${rowNum}: artikelnr ontbreekt`);
      skipped++;
      continue;
    }
    if (!articleName) {
      errors.push(`Rij ${rowNum}: artikelnaam ontbreekt`);
      skipped++;
      continue;
    }

    const status = validStatuses.has(statusRaw) ? statusRaw : "Op voorraad";
    const aantal = aantalRaw
      ? Math.max(0, parseInt(aantalRaw, 10) || 0)
      : 1;

    await prisma.reserveSample.create({
      data: {
        articleNumber,
        articleName,
        status,
        bordStrook: bordStrook || null,
        afmeting: afmeting || null,
        aantal,
        notities: notities || null,
        leverancier: leverancier || null,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, errors });
}
