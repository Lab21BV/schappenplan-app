import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Lab21";

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 10);

  const result = await prisma.user.updateMany({
    data: { password: hashed },
  });

  const users = await prisma.user.findMany({
    select: { email: true, role: true },
    orderBy: { email: "asc" },
  });

  console.log(`✅ ${result.count} wachtwoorden gereset naar "${PASSWORD}"\n`);
  console.log("📋 Login credentials:");
  console.log("─".repeat(50));
  for (const u of users) {
    console.log(`  ${u.email.padEnd(30)} / ${PASSWORD}   [${u.role}]`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
