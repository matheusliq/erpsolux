"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Mapa de prefixos SKU por categoria (extensível)
const SKU_PREFIX_MAP: Record<string, string> = {
    "TINTA": "TIN",
    "TINTAS": "TIN",
    "TINTAS ACR.": "TIN",
    "ESMALTE": "ESM",
    "ARGAMASSA": "ARG",
    "CIMENTO": "CIM",
    "LIXA": "LIX",
    "FITA": "FIT",
    "PINCEL": "PCL",
    "ROLO": "ROL",
    "ESTOPA": "EST",
    "TRAPO": "TRP",
    "SUPORTE": "SUP",
    "CAÇAMBA": "CAC",
    "LOGÍSTICA": "LOG",
    "EPI": "EPI",
    "DEFAULT": "MAT",
};

/**
 * Gera automaticamente um SKU sequencial de 5 dígitos para um novo material
 * Formato: "TIN-00042"
 */
async function generateSku(category: string): Promise<string> {
    const rawCategory = category.toUpperCase().trim();
    let prefix = SKU_PREFIX_MAP["DEFAULT"];

    for (const [key, value] of Object.entries(SKU_PREFIX_MAP)) {
        if (rawCategory.includes(key)) {
            prefix = value;
            break;
        }
    }

    // Conta quantos SKUs com esse prefixo já existem
    const count = await prisma.materials.count({
        where: { sku: { startsWith: prefix + "-" } },
    });

    const seq = String(count + 1).padStart(5, "0");
    return `${prefix}-${seq}`;
}

export async function getMateriais() {
    try {
        const data = await prisma.materials.findMany({
            orderBy: [{ category: "asc" }, { description: "asc" }],
        });
        return {
            success: true,
            data: data.map((m) => ({
                ...m,
                cost_price: Number(m.cost_price),
                markup_factor: Number(m.markup_factor),
            })),
        };
    } catch (error) {
        console.error("getMateriais error:", error);
        return { success: false, error: "Falha ao buscar materiais.", data: [] };
    }
}

// ─── Busca materiais por texto (autocomplete de revenda) ─────────────────────
export async function searchMaterials(query: string) {
    try {
        const data = await prisma.materials.findMany({
            where: {
                OR: [
                    { description: { contains: query, mode: "insensitive" } },
                    { sku: { contains: query, mode: "insensitive" } },
                    { category: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 12,
            orderBy: { description: "asc" },
        });
        return {
            success: true,
            data: data.map(m => ({
                id: m.id,
                sku: m.sku,
                description: m.description,
                category: m.category,
                unit: m.unit,
                cost_price: Number(m.cost_price),
                markup_factor: Number(m.markup_factor),
                sell_price: Number(m.cost_price) * Number(m.markup_factor),
                is_resale: m.is_resale,
            })),
        };
    } catch (error) {
        console.error("searchMaterials error:", error);
        return { success: false, error: "Falha na busca.", data: [] };
    }
}


export async function createMaterial(input: {
    category: string;
    description: string;
    unit: string;
    cost_price: number;
    markup_factor?: number;
    is_resale?: boolean;
}) {
    try {
        const sku = await generateSku(input.category);
        const created = await prisma.materials.create({
            data: {
                sku,
                category: input.category,
                description: input.description,
                unit: input.unit,
                cost_price: input.cost_price,
                markup_factor: input.markup_factor ?? 1.8,
                is_resale: input.is_resale ?? true,
            },
        });
        revalidatePath("/materiais");
        return {
            success: true,
            data: {
                ...created,
                cost_price: Number(created.cost_price),
                markup_factor: Number(created.markup_factor),
            },
        };
    } catch (error: any) {
        if (error.code === "P2002") {
            return { success: false, error: "Já existe um material com esta descrição ou SKU." };
        }
        console.error("createMaterial error:", error);
        return { success: false, error: "Falha ao criar material." };
    }
}

export async function updateMaterial(id: string, data: {
    cost_price?: number;
    markup_factor?: number;
    is_resale?: boolean;
    unit?: string;
}) {
    try {
        await prisma.materials.update({
            where: { id },
            data: { ...data, updated_at: new Date() },
        });
        revalidatePath("/materiais");
        revalidatePath("/clientes");
        return { success: true };
    } catch (error) {
        console.error("updateMaterial error:", error);
        return { success: false, error: "Falha ao atualizar material." };
    }
}

export async function deleteMaterial(id: string) {
    try {
        await prisma.materials.delete({ where: { id } });
        revalidatePath("/materiais");
        return { success: true };
    } catch (error: any) {
        if (error.code === "P2003") {
            return { success: false, error: "Não é possível excluir: material está vinculado a composições de serviço." };
        }
        console.error("deleteMaterial error:", error);
        return { success: false, error: "Falha ao excluir material." };
    }
}
