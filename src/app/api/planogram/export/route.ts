import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;

  const { searchParams } = new URL(req.url);
  const showroomId = searchParams.get("showroomId");

  if (!showroomId) return NextResponse.json({ error: "showroomId vereist" }, { status: 400 });

  if (user.role !== "HOOFDKANTOOR" && user.showroomId !== showroomId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.planogramItem.findMany({
    where: { showroomId },
    include: { article: { select: { articleNumber: true } } },
    orderBy: [{ locatieType: "asc" }, { locatieNummer: "asc" }, { positie: "asc" }],
  });

  const header = "artikelnummer;locatie_type;locatie_nummer;positie;display_afmeting;notities";
  const rows = items.map((item) =>
    [
      item.article.articleNumber,
      item.locatieType,
      item.locatieNummer,
      item.positie,
      item.displayAfmeting,
      item.notes ?? "",
    ].join(";")
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="schappenplan_export.csv"`,
    },
  });
}
