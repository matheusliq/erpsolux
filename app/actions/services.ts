"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Atualiza dados de um serviço (nome, MO, Logística) ──────────────────────
export async function updateService(
    serviceId: string,
    data: {
        name?: string;
        mo_value?: number;
        mo_sell_value?: number;
    }
) {
    try {
        const updated = await prisma.services.update({
            where: { id: serviceId },
            data: { ...data, updated_at: new Date() },
        });
        revalidatePath("/clientes");
        return { 
            success: true, 
            data: {
                ...updated,
                mo_value: Number(updated.mo_value || 0),
                mo_sell_value: Number(updated.mo_sell_value || 0)
            } 
        };
    } catch (error) {
        console.error("updateService error:", error);
        return { success: false, error: "Falha ao atualizar serviço." };
    }
}

// ─── Atualiza a quantidade de um item de serviço (service_items) ──────────────
export async function updateServiceItemQty(itemId: string, quantity: number) {
    try {
        await prisma.service_items.update({
            where: { id: itemId },
            data: { quantity },
        });
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("updateServiceItemQty error:", error);
        return { success: false, error: "Falha ao atualizar quantidade." };
    }
}

// ─── Remove um item de serviço (material) ────────────────────────────────────
export async function deleteServiceItem(itemId: string) {
    try {
        await prisma.service_items.delete({
            where: { id: itemId },
        });
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("deleteServiceItem error:", error);
        return { success: false, error: "Falha ao remover item." };
    }
}

// ─── Atualiza MO customizada de um project_service ───────────────────────────
export async function updateProjectServiceMO(
    projectServiceId: string,
    data: {
        mo_type: "fixed" | "markup";
        mo_custom_value: number;
    }
) {
    try {
        await prisma.project_services.update({
            where: { id: projectServiceId },
            data: {
                mo_type: data.mo_type,
                mo_custom_value: data.mo_custom_value,
            },
        });
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("updateProjectServiceMO error:", error);
        return { success: false, error: "Falha ao atualizar MO." };
    }
}

// ─── Remove um serviço de uma obra (deleta vínculo project_services) ──────────
export async function removeServiceFromProject(projectServiceId: string) {
    try {
        // Verifica se há transações vinculadas
        const txCount = await prisma.transactions.count({
            where: { project_service_id: projectServiceId },
        });
        if (txCount > 0) {
            // Desvincula as transações primeiro (mantém histórico)
            await prisma.transactions.updateMany({
                where: { project_service_id: projectServiceId },
                data: { project_service_id: null },
            });
        }
        await prisma.project_services.delete({ where: { id: projectServiceId } });
        revalidatePath("/clientes");
        return { success: true };
    } catch (error: any) {
        console.error("removeServiceFromProject error:", error);
        return { success: false, error: "Falha ao remover serviço da obra." };
    }
}

// ─── Adiciona um serviço existente do catálogo a uma obra ────────────────────
export async function addServiceToProject(projectId: string, serviceId: string) {
    try {
        const created = await prisma.project_services.create({
            data: {
                project_id: projectId,
                service_id: serviceId,
            },
            include: {
                service: {
                    include: {
                        service_items: { include: { material: true } },
                    },
                },
            },
        });
        revalidatePath("/clientes");
        return { success: true, data: created };
    } catch (error: any) {
        if (error.code === "P2002") {
            return { success: false, error: "Este serviço já está vinculado a esta obra." };
        }
        console.error("addServiceToProject error:", error);
        return { success: false, error: "Falha ao adicionar serviço." };
    }
}

// ─── Adiciona material a um serviço como service_item (Revenda como Material) ──
export async function addMaterialToService(serviceId: string, materialId: string, quantity: number = 1) {
    try {
        // Upsert: se já existir o par (service_id, material_id), apenas atualiza qty
        const existing = await prisma.service_items.findFirst({
            where: { service_id: serviceId, material_id: materialId },
        });

        if (existing) {
            await prisma.service_items.update({
                where: { id: existing.id },
                data: { quantity: Number(existing.quantity) + quantity },
            });
        } else {
            await prisma.service_items.create({
                data: { service_id: serviceId, material_id: materialId, quantity },
            });
        }
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("addMaterialToService error:", error);
        return { success: false, error: "Falha ao adicionar material ao serviço." };
    }
}

// ─── Busca serviços do catálogo por nome ou código ───────────────────────────
export async function searchServices(query: string) {
    try {
        const data = await prisma.services.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { code: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 10,
        });
        return {
            success: true,
            data: data.map(s => ({
                id: s.id,
                code: s.code,
                name: s.name,
                mo_sell_value: Number(s.mo_sell_value),
            })),
        };
    } catch (error) {
        console.error("searchServices error:", error);
        return { success: false, error: "Falha na busca de serviços.", data: [] };
    }
}

// ─── Cria um serviço do zero e vincula diretamente a uma obra (On-the-Fly) ─────
export async function createAndLinkServiceToProject(projectId: string, serviceName: string) {
    try {
        const uniqueCode = "S-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // 1. Cria o serviço global
        const newService = await prisma.services.create({
            data: {
                name: serviceName,
                code: uniqueCode,
                mo_sell_value: 0,
                mo_value: 0
            }
        });

        // 2. Vincula à obra
        const linked = await prisma.project_services.create({
            data: {
                project_id: projectId,
                service_id: newService.id,
            },
            include: {
                service: {
                    include: {
                        service_items: { include: { material: true } },
                    },
                },
            },
        });

        revalidatePath("/clientes");
        return { success: true, data: JSON.parse(JSON.stringify(linked)) };
    } catch (error) {
        console.error("createAndLinkServiceToProject error:", error);
        return { success: false, error: "Falha ao criar e adicionar o serviço." };
    }
}
