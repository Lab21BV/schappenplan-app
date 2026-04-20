import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { showroomId, userId, items } = await req.json();

  if (!showroomId || !items?.length) {
    return NextResponse.json({ error: "Ongeldige gegevens" }, { status: 400 });
  }

  await prisma.inventory.createMany({
    data: items.map((item: any) => ({
      showroomId,
      articleId: item.articleId,
      categoryId: item.categoryId || null,
      locatieType: item.locatieType || null,
      locatieNummer: item.locatieNummer ? parseInt(item.locatieNummer) : null,
      bordNummer: item.bordNummer ? parseInt(item.bordNummer) : null,
      displayAfmeting: item.displayAfmeting || null,
      stock: item.stock,
      notes: item.notes || null,
      createdById: userId,
    })),
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const showroomId = searchParams.get("showroomId");

  const where: any = {};
  if (showroomId) where.showroomId = showroomId;

  const inventories = await prisma.inventory.findMany({
    where,
    include: {
      article: { include: { category: true } },
      category: true,
      showroom: true,
      createdBy: { select: { name: true } },
    },
    orderBy: [{ categoryId: "asc" }, { locatieType: "asc" }, { locatieNummer: "asc" }, { bordNummer: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json(inventories);
}
