import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const item = await prisma.planogramItem.create({
    data: {
      showroomId: data.showroomId,
      articleId: data.articleId,
      categoryId: data.categoryId,
      locatieType: data.locatieType,
      locatieNummer: data.locatieNummer ?? 1,
      positie: data.positie ?? 1,
      displayAfmeting: data.displayAfmeting ?? "100x60",
      notes: data.notes ?? null,
    },
  });

  return NextResponse.json(item);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id vereist" }, { status: 400 });

  const { displayAfmeting } = await req.json();
  const item = await prisma.planogramItem.update({ where: { id }, data: { displayAfmeting } });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id vereist" }, { status: 400 });

  await prisma.planogramItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
