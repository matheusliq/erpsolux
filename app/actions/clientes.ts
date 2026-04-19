"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Lista todas as entidades do tipo "Cliente" que possuem pelo menos uma obra,
 * junto com um resumo financeiro agregado de cada uma.
 */
export async function getClientes() {
    try {
        const entities = await prisma.entities.findMany({
            where: {
                // Accept both 'client' (from Settings UI enum) and 'Cliente' (legacy/PT-BR)
                OR: [
                    { type: { equals: "client", mode: "insensitive" } },
                    { type: { equals: "cliente", mode: "insensitive" } },
                    { type: null }, // Entidades sem tipo ainda aparecem
                ],
                projects: { some: {} }, // Apenas entidades que têm obras
            },
            include: {
                projects: {
                    orderBy: { created_at: "desc" },
                    include: {
                        transactions: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        return {
            success: true,
            data: entities.map((e) => {
                const totalContrato = e.projects.reduce(
                    (acc, p) => acc + Number(p.contract_value ?? 0),
                    0
                );
                const totalEntradas = e.projects.flatMap((p) => p.transactions)
                    .filter((t) => t.type === "Entrada")
                    .reduce((acc, t) => acc + Number(t.amount), 0);
                const totalSaidas = e.projects.flatMap((p) => p.transactions)
                    .filter((t) => t.type !== "Entrada")
                    .reduce((acc, t) => acc + Number(t.amount), 0);

                return {
                    id: e.id,
                    name: e.name,
                    type: e.type,
                    document: e.document,
                    phone: e.phone,
                    email: e.email,
                    obrasCount: e.projects.length,
                    obrasAtivas: e.projects.filter((p) => p.status === "active").length,
                    totalContrato,
                    totalEntradas,
                    totalSaidas,
                    margemBruta: totalEntradas - totalSaidas,
                };
            }),
        };
    } catch (error) {
        console.error("getClientes error:", error);
        return { success: false, error: "Falha ao buscar clientes.", data: [] };
    }
}

/**
 * Busca um cliente específico com suas obras completas (projetos + serviços + materiais + transações)
 */
export async function getClienteComObras(entityId: string) {
    try {
        const entity = await prisma.entities.findUnique({
            where: { id: entityId },
            include: {
                projects: {
                    orderBy: { created_at: "desc" },
                    include: {
                        transactions: {
                            include: {
                                categories: true,
                            },
                            orderBy: { due_date: "desc" },
                        },
                        project_services: {
                            include: {
                                service: {
                                    include: {
                                        service_items: {
                                            include: {
                                                material: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!entity) return { success: false, error: "Cliente não encontrado.", data: null };

        return { success: true, data: entity };
    } catch (error) {
        console.error("getClienteComObras error:", error);
        return { success: false, error: "Falha ao buscar dados do cliente.", data: null };
    }
}

/**
 * Busca uma obra específica com todos os dados para a tela de detalhes
 */
export async function getObraDetalhes(projectId: string) {
    try {
        const project = await prisma.projects.findUnique({
            where: { id: projectId },
            include: {
                entity: true,
                transactions: {
                    include: { categories: true },
                    orderBy: { due_date: "desc" },
                },
                project_services: {
                    include: {
                        service: {
                            include: {
                                service_items: {
                                    include: { material: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!project) return { success: false, error: "Obra não encontrada.", data: null };
        return { success: true, data: project };
    } catch (error) {
        console.error("getObraDetalhes error:", error);
        return { success: false, error: "Falha ao buscar detalhes da obra.", data: null };
    }
}

/**
 * Atualiza a margem de segurança de um project_service específico
 */
export async function updateSafetyMargin(
    projectServiceId: string,
    type: "percentage" | "fixed",
    value: number
) {
    try {
        await prisma.project_services.update({
            where: { id: projectServiceId },
            data: {
                safety_margin_type: type,
                safety_margin_value: value,
            },
        });
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("updateSafetyMargin error:", error);
        return { success: false, error: "Falha ao atualizar margem de segurança." };
    }
}

/**
 * Cria uma nova obra vinculada a um cliente (entity)
 */
export async function createProject(input: {
    entity_id: string;
    name: string;
    description?: string;
    status?: "negotiation" | "active" | "completed" | "paused";
    contract_value?: number;
    start_date?: string;
    deadline?: string;
}) {
    try {
        const created = await prisma.projects.create({
            data: {
                name: input.name,
                description: input.description || null,
                status: input.status ?? "negotiation",
                contract_value: input.contract_value ?? 0,
                start_date: input.start_date ? new Date(input.start_date) : null,
                deadline: input.deadline ? new Date(input.deadline) : null,
                entity_id: input.entity_id,
                client_name: undefined, // Populated via entity relation
            },
        });
        revalidatePath("/clientes");
        revalidatePath(`/clientes/${input.entity_id}`);
        return { success: true, data: { id: created.id, name: created.name } };
    } catch (error: any) {
        console.error("createProject error:", error);
        return { success: false, error: "Falha ao criar obra." };
    }
}

