
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const projects = await prisma.projects.findMany({
    include: { entity: true }
  })
  console.log('PROJECTS:', JSON.stringify(projects, null, 2))
  
  const entities = await prisma.entities.findMany()
  console.log('ENTITIES:', JSON.stringify(entities, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
