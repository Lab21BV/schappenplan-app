import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role: string; showroomId: string | null };

  const data = await req.json();

  const showroomId =
    user.role === "HOOFDKANTOOR" ? data.showroomId : user.showroomId;
  if (!showroomId) return NextResponse.json({ error: "Geen showroom" }, { status: 400 });

  if (!data.itemDescription || !data.customerName || !data.promisedReturnAt) {
    return NextResponse.json({ error: "itemDescription, customerName en promisedReturnAt zijn verplicht" }, { status: 400 });
  }

  const loan = await prisma.loan.create({
    data: {
      showroomId,
      userId: user.id,
      articleId: data.articleId || null,
      itemDescription: String(data.itemDescription).trim(),
      customerName: String(data.customerName).trim(),
      customerEmail: data.customerEmail?.trim() || null,
      customerPhone: data.customerPhone?.trim() || null,
      customerAddress: data.customerAddress?.trim() || null,
      borrowedAt: data.borrowedAt ? new Date(data.borrowedAt) : new Date(),
      promisedReturnAt: new Date(data.promisedReturnAt),
      notes: data.notes?.trim() || null,
    },
  });

  return NextResponse.json(loan);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role: string; showroomId: string | null };

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id vereist" }, { status: 400 });

  const existing = await prisma.loan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  if (user.role !== "HOOFDKANTOOR" && existing.showroomId !== user.showroomId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();

  const loan = await prisma.loan.update({
    where: { id },
    data: {
      ...(data.itemDescription !== undefined && { itemDescription: String(data.itemDescription).trim() }),
      ...(data.customerName !== undefined && { customerName: String(data.customerName).trim() }),
      ...(data.customerEmail !== undefined && { customerEmail: data.customerEmail?.trim() || null }),
      ...(data.customerPhone !== undefined && { customerPhone: data.customerPhone?.trim() || null }),
      ...(data.customerAddress !== undefined && { customerAddress: data.customerAddress?.trim() || null }),
      ...(data.promisedReturnAt !== undefined && { promisedReturnAt: new Date(data.promisedReturnAt) }),
      ...(data.borrowedAt !== undefined && { borrowedAt: new Date(data.borrowedAt) }),
      ...(data.returnedAt !== undefined && {
        returnedAt: data.returnedAt ? new Date(data.returnedAt) : null,
      }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      ...(data.articleId !== undefined && { articleId: data.articleId || null }),
    },
  });

  return NextResponse.json(loan);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role: string; showroomId: string | null };

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id vereist" }, { status: 400 });

  const existing = await prisma.loan.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  if (user.role !== "HOOFDKANTOOR" && existing.showroomId !== user.showroomId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.loan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
