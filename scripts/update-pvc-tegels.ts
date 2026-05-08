import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const r = await prisma.category.update({
    where: { id: "cat-pvc-tegels" },
    data: { name: "PVC Tegels", slug: "pvc-tegels" },
  });
  console.log(r);
  await prisma.$disconnect();
})();
