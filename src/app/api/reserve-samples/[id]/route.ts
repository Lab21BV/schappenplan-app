import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RESERVE_SAMPLE_STATUSES } from "@/lib/reserveSampleStatuses";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "HOOFDKANTOOR") {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const data = await req.json();

  const patch: Record<string, unknown> = {};

  if (typeof data.status === "string") {
    if (!RESERVE_SAMPLE_STATUSES.includes(data.status)) {
      return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
    }
    patch.status = data.status;
  }
  if (data.aantal !== undefined) {
    patch.aantal = Math.max(0, parseInt(String(data.aantal), 10) || 0);
  }
  if (data.articleNumber !== undefined) patch.articleNumber = String(data.articleNumber).trim();
  if (data.articleName !== undefined) patch.articleName = String(data.articleName).trim();
  if (data.bordStrook !== undefined) patch.bordStrook = data.bordStrook?.trim() || null;
  if (data.afmeting !== undefined) patch.afmeting = data.afmeting?.trim() || null;
  if (data.notities !== undefined) patch.notities = data.notities?.trim() || null;
  if (data.leverancier !== undefined) patch.leverancier = data.leverancier?.trim() || null;

  const sample = await prisma.reserveSample.update({
    where: { id },
    data: patch,
  });
  return NextResponse.json(sample);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "HOOFDKANTOOR") {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  await prisma.reserveSample.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
