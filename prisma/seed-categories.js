// seed-categories.js — Run with: node prisma/seed-categories.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const categories = [
  { name: "Domki", slug: "domki", type: "ACCOMMODATION", icon: "home", description: "Domki wypoczynkowe", sortOrder: 1 },
  { name: "Pokoje", slug: "pokoje", type: "ACCOMMODATION", icon: "building", description: "Pokoje w budynku usługowym", sortOrder: 2 },
  { name: "Sale", slug: "sale", type: "VENUE", icon: "presentation", description: "Sale konferencyjne i eventowe", sortOrder: 3 },
  { name: "Restauracja", slug: "restauracja", type: "GASTRONOMY", icon: "utensils", description: "Restauracja z salą", sortOrder: 4 },
  { name: "Sprzęt wodny", slug: "sprzet-wodny", type: "EQUIPMENT", icon: "ship", description: "Kajaki, SUP, rowerki wodne", sortOrder: 5 },
  { name: "Sprzęt lądowy", slug: "sprzet-ladowy", type: "EQUIPMENT", icon: "bike", description: "Rowery", sortOrder: 6 },
  { name: "Atrakcje", slug: "atrakcje", type: "ATTRACTION", icon: "sparkles", description: "Quady, ASG i inne", sortOrder: 7 },
  { name: "Usługi", slug: "uslugi", type: "SERVICE", icon: "concierge-bell", description: "Usługi dodatkowe", sortOrder: 8 },
];

async function main() {
  console.log("Seeding categories...");
  for (const cat of categories) {
    const existing = await prisma.resourceCategory.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      await prisma.resourceCategory.update({ where: { slug: cat.slug }, data: cat });
      console.log(`  Updated: ${cat.name}`);
    } else {
      await prisma.resourceCategory.create({ data: cat });
      console.log(`  Created: ${cat.name}`);
    }
  }
  console.log("Done! Categories seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
