import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteMultipleFromS3 } from "@/lib/s3";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const inv = await prisma.inventory.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  const images = (inv as any).images as string[] | undefined;
  if (images?.length) await deleteMultipleFromS3(images);
  await prisma.inventory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const existing = await prisma.inventory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  const oldImages = (existing as any).images as string[] | undefined;
  const update: Record<string, any> = {};
  if ("stock" in body) update.stock = Number(body.stock);
  if ("notes" in body) update.notes = body.notes;
  if ("isDisplayMaterial" in body) update.isDisplayMaterial = !!body.isDisplayMaterial;
  if ("images" in body) {
    const newImages = body.images as string[];
    update.images = newImages;
    if (oldImages) {
      const removed = oldImages.filter(k => !newImages.includes(k));
      if (removed.length) await deleteMultipleFromS3(removed);
    }
  }
  await prisma.inventory.update({ where: { id }, data: update });
  return NextResponse.json({ ok: true });
}
