import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SOURCE_ID = "showroom-amersfoort";

const SHOWROOMS = [
  { id: "showroom-amersfoort",  name: "Amersfoort",  location: "Amersfoort",                email: "amersfoort@lab21.nl" },
  { id: "showroom-amsterdam",   name: "Amsterdam",   location: "Amsterdam",                 email: "amsterdam@lab21.nl" },
  { id: "showroom-oostzaan",    name: "Oostzaan",    location: "Oostzaan",                  email: "oostzaan@lab21.nl" },
  { id: "showroom-utrecht",     name: "Utrecht",     location: "Utrecht",                   email: "utrecht@lab21.nl" },
  { id: "showroom-leiden",      name: "Leiden",      location: "Leiden",                    email: "leiden@lab21.nl" },
  { id: "showroom-delft",       name: "Delft",       location: "Delft",                     email: "delft@lab21.nl" },
  { id: "showroom-capelle",     name: "Capelle",     location: "Capelle aan den IJssel",    email: "capelle@lab21.nl" },
  { id: "showroom-breda",       name: "Breda",       location: "Breda",                     email: "breda@lab21.nl" },
  { id: "showroom-tilburg",     name: "Tilburg",     location: "Tilburg",                   email: "tilburg@lab21.nl" },
  { id: "showroom-eindhoven",   name: "Eindhoven",   location: "Eindhoven",                 email: "eindhoven@lab21.nl" },
  { id: "showroom-denbosch",    name: "Den Bosch",   location: "'s-Hertogenbosch",          email: "denbosch@lab21.nl" },
  { id: "showroom-enschede",    name: "Enschede",    location: "Enschede",                  email: "enschede@lab21.nl" },
  { id: "showroom-leeuwarden",  name: "Leeuwarden",  location: "Leeuwarden",                email: "leeuwarden@lab21.nl" },
  { id: "showroom-groningen",   name: "Groningen",   location: "Groningen",                 email: "groningen@lab21.nl" },
  { id: "showroom-veenendaal",  name: "Veenendaal",  location: "Veenendaal",                email: "veenendaal@lab21.nl" },
];

async function main() {
  const hashedPassword = await bcrypt.hash("verkoper123", 10);

  // Fetch source data from Amersfoort
  const sourcePlanogram = await prisma.planogramItem.findMany({ where: { showroomId: SOURCE_ID } });
  const sourceConfigs = await prisma.displayConfig.findMany({ where: { showroomId: SOURCE_ID } });

  console.log(`📋 Amersfoort planogram: ${sourcePlanogram.length} items, ${sourceConfigs.length} display configs`);

  for (const sr of SHOWROOMS) {
    // 1. Upsert showroom
    await prisma.showroom.upsert({
      where: { id: sr.id },
      update: { name: sr.name, location: sr.location },
      create: { id: sr.id, name: sr.name, location: sr.location },
    });

    // 2. Upsert VERKOPER user (skip if email already exists)
    const existingUser = await prisma.user.findUnique({ where: { email: sr.email } });
    if (!existingUser) {
      await prisma.user.create({
        data: {
          name: `${sr.name} Showroom`,
          email: sr.email,
          password: hashedPassword,
          role: "VERKOPER",
          showroomId: sr.id,
        },
      });
    }

    // 3. Copy planogram from Amersfoort (skip source itself)
    if (sr.id !== SOURCE_ID) {
      await prisma.planogramItem.deleteMany({ where: { showroomId: sr.id } });
      if (sourcePlanogram.length > 0) {
        await prisma.planogramItem.createMany({
          data: sourcePlanogram.map(({ id: _id, showroomId: _sr, createdAt: _ca, ...rest }) => ({
            ...rest,
            showroomId: sr.id,
          })),
        });
      }

      // 4. Copy display configs from Amersfoort
      for (const cfg of sourceConfigs) {
        await prisma.displayConfig.upsert({
          where: { showroomId_categoryId: { showroomId: sr.id, categoryId: cfg.categoryId } },
          update: { numStroken: cfg.numStroken, numWandborden: cfg.numWandborden, numBokken: cfg.numBokken },
          create: {
            showroomId: sr.id,
            categoryId: cfg.categoryId,
            numStroken: cfg.numStroken,
            numWandborden: cfg.numWandborden,
            numBokken: cfg.numBokken,
          },
        });
      }
    }

    console.log(`✅ ${sr.name.padEnd(14)} ${existingUser ? "(user existed)" : "user aangemaakt"} · ${sr.id !== SOURCE_ID ? `${sourcePlanogram.length} planogram items gekopieerd` : "brondata ongewijzigd"}`);
  }

  console.log("\n📋 Login credentials:");
  console.log("─".repeat(50));
  for (const sr of SHOWROOMS) {
    console.log(`  ${sr.email.padEnd(30)} / verkoper123`);
  }
  console.log("\n✅ Setup voltooid.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
