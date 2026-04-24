import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isHQ = (session.user as any).role === "HOOFDKANTOOR";

  const articles = await prisma.article.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { priorityScore: "desc" },
  });

  if (!isHQ) {
    return NextResponse.json(
      articles.map((a) => ({
        ...a,
        supplierNameReal: undefined,
        costPrice: undefined,
        grossMargin: undefined,
      }))
    );
  }

  return NextResponse.json(articles);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "HOOFDKANTOOR") {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const data = await req.json();

  const article = await prisma.article.create({
    data: {
      articleNumber: data.articleNumber,
      articleName: data.articleName,
      supplierNameAnonymized: data.supplierNameAnonymized,
      supplierNameReal: data.supplierNameReal,
      costPrice: parseFloat(data.costPrice) || 0,
      sellingPrice: parseFloat(data.sellingPrice) || 0,
      grossMargin: parseFloat(data.grossMargin) || 0,
      priorityScore: parseFloat(data.priorityScore) || 0,
      categoryId: data.categoryId,
      displayTypes: data.displayTypes ?? "[]",
      status: data.status ?? "Collectie",
    },
  });

  return NextResponse.json(article);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "HOOFDKANTOOR") {
    return NextResponse.json({ error: "Verboden" }, { status: 403 });
  }

  const data = await req.json();

  const article = await prisma.article.update({
    where: { id: data.id },
    data: {
      articleName: data.articleName,
      supplierNameAnonymized: data.supplierNameAnonymized,
      supplierNameReal: data.supplierNameReal,
      costPrice: parseFloat(data.costPrice) || 0,
      sellingPrice: parseFloat(data.sellingPrice) || 0,
      grossMargin: parseFloat(data.grossMargin) || 0,
      priorityScore: parseFloat(data.priorityScore) || 0,
      categoryId: data.categoryId,
      isActive: data.isActive,
      displayTypes: data.displayTypes ?? "[]",
      status: data.status ?? "Collectie",
    },
  });

  return NextResponse.json(article);
}
