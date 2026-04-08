// Run with: node seed-categories.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Domki", slug: "domki", description: "Domki letniskowe do wynajmu", sortOrder: 1 },
    { name: "Pokoje", slug: "pokoje", description: "Pokoje w budynku usługowym", sortOrder: 2 },
    { name: "Sala eventowa", slug: "sala-eventowa", description: "Sala konferencyjna i eventowa", sortOrder: 3 },
    { name: "Restauracja", slug: "restauracja", description: "Sala restauracyjna / bankietowa", sortOrder: 4 },
    { name: "Sprzęt wodny", slug: "sprzet-wodny", description: "Kajaki, rowery wodne itp.", sortOrder: 5 },
    { name: "Atrakcje", slug: "atrakcje", description: "Plac zabaw, sauna, grill itp.", sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.resourceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
    console.log("✅ " + cat.name);
  }

  console.log("\nKategorie zasobów utworzone!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
