import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RESERVE_SAMPLE_STATUSES } from "@/lib/reserveSampleStatuses";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "HOOFDKANTOOR") {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const samples = await prisma.reserveSample.findMany({
    orderBy: [{ articleName: "asc" }],
  });
  return NextResponse.json(samples);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "HOOFDKANTOOR") {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const data = await req.json();
  if (!data.articleNumber || !data.articleName) {
    return NextResponse.json(
      { error: "Artikelnummer en artikelnaam zijn verplicht" },
      { status: 400 }
    );
  }

  const status = RESERVE_SAMPLE_STATUSES.includes(data.status)
    ? data.status
    : "Op voorraad";

  const sample = await prisma.reserveSample.create({
    data: {
      articleNumber: String(data.articleNumber).trim(),
      articleName: String(data.articleName).trim(),
      status,
      bordStrook: data.bordStrook?.trim() || null,
      afmeting: data.afmeting?.trim() || null,
      aantal: Math.max(0, parseInt(String(data.aantal ?? 1), 10) || 0),
      notities: data.notities?.trim() || null,
      leverancier: data.leverancier?.trim() || null,
    },
  });
  return NextResponse.json(sample);
}
