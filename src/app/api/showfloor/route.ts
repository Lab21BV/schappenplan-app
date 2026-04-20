import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const item = await prisma.showFloor.create({
    data: {
      showroomId: data.showroomId,
      articleId: data.articleId,
      nummer: data.nummer || null,
      lengte: data.lengte ? parseFloat(data.lengte) : null,
      breedte: data.breedte ? parseFloat(data.breedte) : null,
      status: data.status || "Actief",
      notes: data.notes || null,
    },
  });

  return NextResponse.json(item);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const item = await prisma.showFloor.update({
    where: { id: data.id },
    data: {
      ...(data.nummer !== undefined  && { nummer: data.nummer || null }),
      ...(data.lengte  !== undefined  && { lengte:  data.lengte  ? parseFloat(data.lengte)  : null }),
      ...(data.breedte !== undefined  && { breedte: data.breedte ? parseFloat(data.breedte) : null }),
      ...(data.status  !== undefined  && { status:  data.status  || null }),
      ...(data.notes   !== undefined  && { notes:   data.notes   || null }),
    },
  });

  return NextResponse.json(item);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id vereist" }, { status: 400 });

  const { stock } = await req.json();
  const item = await prisma.showFloor.update({ where: { id }, data: { stock: parseInt(stock) || 0 } });
  return NextResponse.json(item);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id vereist" }, { status: 400 });

  await prisma.showFloor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
