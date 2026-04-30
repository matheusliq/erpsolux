export const dynamic = "force-dynamic";
import { getClienteComObras } from "@/app/actions/clientes";
import { notFound } from "next/navigation";
import { ClienteHubClient } from "@/components/ClienteHubClient";

export default async function ClienteHubPage({ params }: { params: Promise<{ entityId: string }> }) {
    const { entityId } = await params;
    const result = await getClienteComObras(entityId);
    if (!result.success || !result.data) notFound();

    const cliente = result.data;

    // Serializar para Props do Client Component
    const clienteData = {
        id: cliente.id,
        name: cliente.name,
        type: cliente.type,
        document: cliente.document,
        phone: cliente.phone,
        email: cliente.email,
    };

    const obrasData = cliente.projects.map((p) => {
        const entradas = p.transactions
            .filter(t => t.type === "Entrada")
            .reduce((a, t) => a + Number(t.amount), 0);
        const saidas = p.transactions
            .filter(t => t.type !== "Entrada")
            .reduce((a, t) => a + Number(t.amount), 0);
        const margem = entradas - saidas;
        const totalServicos = p.project_services.reduce((acc, ps) => {
            const mo = Number(ps.service.mo_sell_value);
            const materiais = ps.service.service_items.reduce(
                (s, si) => s + Number(si.material.cost_price) * Number(si.material.markup_factor) * Number(si.quantity), 0
            );
            return acc + mo + materiais;
        }, 0);

        const totalCustoEstimado = p.project_services.reduce((acc, ps) => {
            const moCost = Number(ps.service.mo_cost_value || 0);
            const materiaisCost = ps.service.service_items.reduce(
                (s, si) => s + Number(si.material.cost_price) * Number(si.quantity), 0
            );
            return acc + moCost + materiaisCost;
        }, 0);

        return {
            id: p.id,
            name: p.name,
            status: p.status ?? "Em Negociação",
            contract_value: p.contract_value ? Number(p.contract_value) : null,
            entradas,
            saidas,
            margem,
            totalServicos,
            totalCustoEstimado,
            project_services: p.project_services.map(ps => {
                const mo = Number(ps.service.mo_sell_value);
                const materiais = ps.service.service_items.reduce(
                    (s, si) => s + Number(si.material.cost_price) * Number(si.material.markup_factor) * Number(si.quantity), 0
                );
                return {
                    id: ps.id,
                    totalServico: mo + materiais,
                    service: {
                        code: ps.service.code,
                        name: ps.service.name,
                        mo_sell_value: mo,
                    },
                };
            }),
            transactions: p.transactions.map(t => ({
                id: t.id,
                name: t.name,
                amount: Number(t.amount),
                type: t.type,
                status: t.status ?? "Agendado",
                due_date: t.due_date instanceof Date
                    ? t.due_date.toISOString().split("T")[0]
                    : String(t.due_date),
                categories: t.categories
                    ? { name: t.categories.name, color: t.categories.color ?? "#cbd5e1" }
                    : null,
            })),
        };
    });

    return <ClienteHubClient cliente={clienteData} obras={obrasData} />;
}
