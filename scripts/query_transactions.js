const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.projects.findFirst({
    where: { name: { contains: "Reparos Gerais Luvep" } },
    include: {
      project_services: {
        include: {
          service: true,
        }
      },
      transactions: true
    }
  });

  if (!project) {
    console.log("Projeto não encontrado.");
    return;
  }

  console.log(`Lançamentos para obra: ${project.name}`);
  project.transactions.forEach(t => {
    let serviceName = "NENHUM SERVIÇO (Obra no geral)";
    if (t.project_service_id) {
        const ps = project.project_services.find(s => s.id === t.project_service_id);
        if (ps) {
            serviceName = ps.service.name;
        } else {
            serviceName = "SERVIÇO NÃO ENCONTRADO/EXCLUÍDO";
        }
    }
    console.log(`- ${t.name} | Tipo: ${t.type} | Receita: R$ ${t.amount} | Custo Real: R$ ${t.cost_amount || 0} | Status: ${t.status} | Serviço: ${serviceName}`);
  });
}

main().finally(() => prisma.$disconnect());
