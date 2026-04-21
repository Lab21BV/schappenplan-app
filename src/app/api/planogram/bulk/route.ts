import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { showroomId, items } = await req.json();

  if (!showroomId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "showroomId en items vereist" }, { status: 400 });
  }

  const created = await prisma.planogramItem.createMany({
    data: items.map((item: any) => ({
      showroomId,
      articleId: item.articleId,
      categoryId: item.categoryId,
      locatieType: item.locatieType,
      locatieNummer: parseInt(item.locatieNummer) || 1,
      positie: parseInt(item.positie) || 1,
      displayAfmeting: item.displayAfmeting ?? "100x60",
      notes: item.notes || null,
    })),
  });

  return NextResponse.json(created);
}
