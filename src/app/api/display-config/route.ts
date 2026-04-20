import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();

  const config = await prisma.displayConfig.upsert({
    where: {
      showroomId_categoryId: {
        showroomId: data.showroomId,
        categoryId: data.categoryId,
      },
    },
    update: {
      numStroken: data.numStroken,
      numWandborden: data.numWandborden,
      numBokken: data.numBokken,
    },
    create: {
      showroomId: data.showroomId,
      categoryId: data.categoryId,
      numStroken: data.numStroken,
      numWandborden: data.numWandborden,
      numBokken: data.numBokken,
    },
  });

  return NextResponse.json(config);
}
