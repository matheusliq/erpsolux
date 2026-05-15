export const dynamic = "force-dynamic";
import { getObraDetalhes } from "@/app/actions/clientes";
import { getCategories } from "@/app/actions/categorias";
import { notFound } from "next/navigation";
import { PropostaPDFView } from "@/components/PropostaPDFView";

export default async function PropostaPage({
    params,
}: {
    params: Promise<{ entityId: string; projectId: string }>;
}) {
    const { projectId, entityId } = await params;
    const [obraRes, catRes] = await Promise.all([
        getObraDetalhes(projectId),
        getCategories(),
    ]);

    if (!obraRes.success || !obraRes.data) {
        notFound();
    }
    const project = obraRes.data;

    const categories = (catRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color ?? "#cbd5e1",
        type: c.type,
        is_material: c.is_material,
    }));

    // Serialização Estrita Padrão Solux Deployment
    const serializedProject = {
        id: project.id,
        name: project.name,
        status: project.status,
        contract_value: project.contract_value ? Number(project.contract_value) : null,
        entity: project.entity ? { name: project.entity.name } : null,
        transactions: project.transactions.map((t) => ({
            id: t.id,
            name: t.name,
            amount: Number(t.amount || 0),
            cost_amount: t.cost_amount ? Number(t.cost_amount) : Number(t.amount || 0),
            markup: t.markup ? Number(t.markup) : 1,
            type: t.type,
            status: t.status ?? "Agendado",
        })),
        project_services: project.project_services.map((ps) => ({
            id: ps.id,
            safety_margin_type: ps.safety_margin_type,
            safety_margin_value: ps.safety_margin_value ? Number(ps.safety_margin_value) : null,
            mo_type: (ps as any).mo_type ?? "fixed",
            mo_custom_value: (ps as any).mo_custom_value ? Number((ps as any).mo_custom_value) : null,
            service: {
                id: ps.service.id,
                code: ps.service.code,
                name: ps.service.name,
                mo_sell_value: Number(ps.service.mo_sell_value || 0),
                service_items: ps.service.service_items.map((si) => ({
                    id: si.id,
                    quantity: Number(si.quantity || 1),
                    material: {
                        id: si.material.id,
                        sku: si.material.sku,
                        category: si.material.category,
                        description: si.material.description,
                        unit: si.material.unit,
                        cost_price: Number(si.material.cost_price || 0),
                        markup_factor: Number(si.material.markup_factor || 1),
                        is_resale: si.material.is_resale,
                    },
                })),
            },
        })),
    };

    return (
        <PropostaPDFView 
            project={serializedProject} 
            entityId={entityId} 
            categories={categories} 
        />
    );
}
