import prisma from "../lib/prisma";

async function main() {
    try {
        console.log("Fetching distinct materials categories...");
        const materials = await prisma.materials.findMany({
            select: { category: true },
            distinct: ['category']
        });
        
        const uniqueCategories = materials.map(m => m.category).filter(c => c && c.trim() !== "");
        console.log(`Found ${uniqueCategories.length} distinct categories.`);
        
        const existing = await prisma.categories.findMany();
        const existingNames = existing.map(e => e.name.toLowerCase());
        
        let added = 0;
        for (const catName of uniqueCategories) {
            if (!existingNames.includes(catName.toLowerCase())) {
                console.log(`Adding missing category: ${catName}`);
                await prisma.categories.create({
                    data: {
                        name: catName,
                        type: "Saída", // Defaulting to Saída (Operacional) as materials are costs by default
                        color: "#64748b"
                    }
                });
                added++;
            }
        }
        console.log(`Successfully added ${added} new categories from materials.`);
    } catch(e) {
        console.error(e);
    }
}
main();
