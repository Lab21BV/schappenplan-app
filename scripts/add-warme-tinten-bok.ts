import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const cat = await prisma.category.upsert({
    where: { id: "cat-pvc-warmbok" },
    update: { name: "Warme Tinten Bok", slug: "warme-tinten-bok", parentId: "cat-pvc", order: 11 },
    create: { id: "cat-pvc-warmbok", name: "Warme Tinten Bok", slug: "warme-tinten-bok", parentId: "cat-pvc", order: 11 },
  });

  const showrooms = await prisma.showroom.findMany({ select: { id: true } });
  for (const sr of showrooms) {
    await prisma.displayConfig.upsert({
      where: { showroomId_categoryId: { showroomId: sr.id, categoryId: cat.id } },
      update: {},
      create: { showroomId: sr.id, categoryId: cat.id, numStroken: 3, numWandborden: 2, numBokken: 2 },
    });
  }

  console.log(`✅ ${cat.name} toegevoegd (${showrooms.length} showrooms)`);
  await prisma.$disconnect();
})();
