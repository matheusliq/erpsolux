export const dynamic = "force-dynamic";
import { getObraDetalhes } from "@/app/actions/clientes";
import { getCategories } from "@/app/actions/categorias";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { ObraDetailView } from "@/components/ObraDetailView";

const STATUS_MAP = {
    negotiation: { label: "Negociação", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    active: { label: "Ativa", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    completed: { label: "Concluída", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    paused: { label: "Pausada", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
};

export default async function ObraDetailPage({
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
        console.error("ObraDetailPage: Obra não encontrada ou falha no fetch", obraRes.error);
        notFound();
    }
    const project = obraRes.data;

    // Log para depuração de tipos no servidor
    // console.log(`Iniciando serialização da obra: ${project.name} (${project.id})`);

    const categories = (catRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color ?? "#cbd5e1",
        type: c.type,
        is_material: c.is_material,
    }));

    const st = STATUS_MAP[project.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.negotiation;

    // Serializar dados para o Client Component com checks de segurança
    const serializedProject = {
        id: project.id,
        name: project.name,
        status: project.status,
        contract_value: project.contract_value ? Number(project.contract_value) : null,
        entity: project.entity ? { name: project.entity.name } : null,
        transactions: project.transactions.map((t) => {
            let encodedDate = "";
            try {
                encodedDate = t.due_date ? new Date(t.due_date).toISOString().split("T")[0] : "";
            } catch (e) {
                console.warn(`Data inválida para transação ${t.id}:`, t.due_date);
            }

            return {
                id: t.id,
                name: t.name,
                amount: Number(t.amount || 0),
                cost_amount: t.cost_amount ? Number(t.cost_amount) : Number(t.amount || 0),
                markup: t.markup ? Number(t.markup) : 1,
                type: t.type,
                status: t.status ?? "Agendado",
                due_date: encodedDate,
                project_service_id: t.project_service_id,
                categories: t.categories
                    ? { name: t.categories.name, color: t.categories.color ?? "#cbd5e1" }
                    : null,
            };
        }),
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
        <div className="p-6 md:p-10 min-h-full bg-background text-foreground">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground flex-wrap">
                <Link href="/clientes" className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <ArrowLeft size={12} /> Clientes
                </Link>
                <ChevronRight size={10} />
                <Link href={`/clientes/${entityId}`} className="hover:text-foreground transition-colors">
                    {project.entity?.name ?? "Cliente"}
                </Link>
                <ChevronRight size={10} />
                <span className="text-foreground font-medium">{project.name}</span>
            </div>



            {/* Detail View */}
            <ObraDetailView
                project={serializedProject}
                categories={categories}
            />
        </div>
    );
}
