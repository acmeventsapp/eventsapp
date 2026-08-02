import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SEED_ADMINS = [
  {
    name: "Super Admin",
    email: "acmugwuagbaarchevents@gmail.com",
    password: "acmevents2026",
    role: "SUPER_ADMIN" as const,
  },
];

async function seed() {
  console.log("Seeding admins...");
  let created = 0;
  let updated = 0;

  for (const admin of SEED_ADMINS) {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    const existing = await prisma.admin.findUnique({ where: { email: admin.email } });

    if (existing) {
      await prisma.admin.update({
        where: { id: existing.id },
        data: {
          name: admin.name,
          passwordHash,
          role: admin.role,
        },
      });
      updated++;
      continue;
    }

    await prisma.admin.create({
      data: {
        name: admin.name,
        email: admin.email,
        passwordHash,
        role: admin.role,
      },
    });
    created++;
  }

  console.log(`Done — ${created} created, ${updated} updated`);
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
