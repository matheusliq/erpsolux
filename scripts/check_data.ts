
import prisma from '../lib/prisma';

async function main() {
  try {
    const clients = await prisma.entities.findMany({
      where: { name: { contains: 'Luvep' } }
    });
    console.log('--- Clients found ---');
    console.log(clients.map(c => ({ id: c.id, name: c.name })));

    if (clients.length > 0) {
      const projects = await prisma.projects.findMany({
        where: { entity_id: { in: clients.map(c => c.id) } }
      });
      console.log('--- Projects found ---');
      console.log(projects.map(p => ({ id: p.id, name: p.name, status: p.status })));
    } else {
      console.log('No clients matching "Luvep" found.');
    }

    const materialsCount = await prisma.materials.count();
    console.log('Total Materials:', materialsCount);

    const servicesCount = await prisma.services.count();
    console.log('Total Services:', servicesCount);

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
