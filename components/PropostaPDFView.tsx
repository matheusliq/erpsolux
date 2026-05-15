"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Building2, Calculator, Settings, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewMode = "commercial" | "operational";

const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PropostaPDFView({ project, entityId, categories }: { project: any; entityId: string; categories: any[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>("commercial");
    const searchParams = useSearchParams();
    const serviceId = searchParams.get("serviceId");

    const servicesToRender = serviceId 
        ? project.project_services.filter((ps: any) => ps.id === serviceId)
        : project.project_services;

    const handlePrint = () => {
        window.print();
    };

    // Cálculos de Custos e Vendas
    let totalMaterialCusto = 0;
    let totalMaterialVenda = 0;
    let totalMOCusto = 0;
    let totalMOVenda = 0;

    servicesToRender.forEach((ps: any) => {
        // Mão de Obra
        const moVendaService = ps.mo_type === "custom" && ps.mo_custom_value !== null
            ? ps.mo_custom_value
            : (ps.mo_custom_value ?? 0);
        
        // Simulação de custo de MO (estimativa 40% do valor de venda caso não exista na base)
        const moCustoService = moVendaService * 0.40;

        totalMOCusto += moCustoService;
        totalMOVenda += moVendaService;

        // Materiais
        ps.service.service_items.forEach((item: any) => {
            const materialCusto = item.material.cost_price * item.quantity;
            const materialVenda = item.material.is_resale 
                ? materialCusto * item.material.markup_factor 
                : materialCusto;
            
            totalMaterialCusto += materialCusto;
            totalMaterialVenda += materialVenda;
        });
    });

    const totalCusto = totalMaterialCusto + totalMOCusto;
    // Usa o contract_value ou a soma dos itens se o contrato for zero
    const totalVendaFinal = project.contract_value > 0 ? project.contract_value : (totalMaterialVenda + totalMOVenda);
    const margemBruta = totalVendaFinal - totalCusto;
    const margemPercentual = totalVendaFinal > 0 ? (margemBruta / totalVendaFinal) * 100 : 0;

    return (
        <div className="min-h-screen bg-muted/20 pb-20">
            {/* Header / Barra de Ferramentas (Oculto na impressão) */}
            <div className="print:hidden bg-background border-b border-border p-4 sticky top-0 z-50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/clientes/${entityId}/obras/${project.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft size={14} /> Voltar para Obra
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-border hidden md:block"></div>
                    <div className="flex bg-muted p-1 rounded-lg">
                        <Button
                            variant={viewMode === "commercial" ? "default" : "ghost"}
                            size="sm"
                            className="text-xs"
                            onClick={() => setViewMode("commercial")}
                        >
                            <Building2 size={14} className="mr-2" /> Visão Comercial (Cliente)
                        </Button>
                        <Button
                            variant={viewMode === "operational" ? "default" : "ghost"}
                            size="sm"
                            className="text-xs"
                            onClick={() => setViewMode("operational")}
                        >
                            <Calculator size={14} className="mr-2" /> Visão Operacional (Interna)
                        </Button>
                    </div>
                </div>
                <Button onClick={handlePrint} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Printer size={16} /> Extrair PDF
                </Button>
            </div>

            {/* Documento A4 */}
            <div className="max-w-[210mm] mx-auto mt-8 bg-white text-zinc-900 shadow-xl print:shadow-none print:mt-0 p-[20mm] print:p-0 min-h-[297mm]">
                
                {/* Cabeçalho do Documento */}
                <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900">
                            Solux <span className="font-light text-zinc-500">Pinturas</span>
                        </h1>
                        <p className="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-widest">
                            Engenharia de Revestimentos
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold">{project.entity?.name ?? "Cliente"}</p>
                        <p className="text-xs text-zinc-600 mt-1">{project.name}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                </div>

                {viewMode === "commercial" ? (
                    // VISÃO COMERCIAL (Cliente)
                    <div className="space-y-10">
                        <section>
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <Settings size={18} className="text-emerald-600" /> Introdução
                            </h2>
                            <p className="text-sm leading-relaxed text-zinc-700 text-justify">
                                A <strong>Solux Pinturas e Revestimentos</strong> agradece a oportunidade de apresentar esta proposta comercial e técnica. 
                                Nossa missão é tornar o técnico simples e simplificar o técnico, oferecendo engenharia de superfície com foco na previsibilidade, inteligência de mercado e transparência absoluta. Não entregamos apenas aplicações de tintas; entregamos a solução técnica definitiva para o seu ambiente.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-emerald-600" /> Escopo Técnico
                            </h2>
                            <div className="space-y-4">
                                {servicesToRender.length === 0 ? (
                                    <p className="text-sm text-zinc-500 italic">Nenhum serviço cadastrado.</p>
                                ) : (
                                    servicesToRender.map((ps: any, idx: number) => (
                                        <div key={ps.id} className="bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                                            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                                                <span className="bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded text-xs">{idx + 1}</span>
                                                {ps.service.name}
                                            </h3>
                                            <ul className="mt-3 space-y-1">
                                                {ps.service.service_items.map((item: any) => (
                                                    <li key={item.id} className="text-xs text-zinc-600 flex items-center gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                                        {item.material.description} ({item.quantity} {item.material.unit})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4 border-t border-zinc-200 pt-6">Investimento</h2>
                            <div className="bg-zinc-900 text-white p-6 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-zinc-400 mb-1 uppercase tracking-wider">Valor Global do Escopo</p>
                                    <p className="text-3xl font-black tracking-tight">{formatBRL(totalVendaFinal)}</p>
                                </div>
                                <div className="text-right text-xs text-zinc-400 space-y-1">
                                    <p>Inclui mão de obra técnica especializada.</p>
                                    <p>Inclui gestão, RT e garantia estrutural.</p>
                                </div>
                            </div>
                        </section>

                        <section className="text-xs text-zinc-500 bg-zinc-50 p-4 rounded-lg border border-zinc-100 mt-8">
                            <h4 className="font-bold text-zinc-700 mb-2">Condições Comerciais e Garantia</h4>
                            <ul className="list-disc pl-4 space-y-1">
                                <li><strong>Garantia:</strong> 12 meses contra desplacamentos decorrentes de falhas de preparação de superfície.</li>
                                <li><strong>Validade:</strong> Proposta válida por 15 dias corridos.</li>
                                <li>O escopo não abrange reparos em anomalias ocultas não descritas no orçamento.</li>
                            </ul>
                        </section>
                    </div>
                ) : (
                    // VISÃO OPERACIONAL (Interna)
                    <div className="space-y-8">
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center print:hidden">
                            Confidencial - Uso Estritamente Interno
                        </div>
                        <div className="hidden print:flex bg-zinc-100 text-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-widest items-center justify-center">
                            Documento Operacional (Confidencial)
                        </div>

                        <section>
                            <h2 className="text-xl font-bold mb-4">Resumo Executivo de Custos</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 uppercase font-medium">Custo Materiais</p>
                                    <p className="text-lg font-bold text-zinc-900 mt-1">{formatBRL(totalMaterialCusto)}</p>
                                </div>
                                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 uppercase font-medium">Custo MO/Operação</p>
                                    <p className="text-lg font-bold text-zinc-900 mt-1">{formatBRL(totalMOCusto)}</p>
                                </div>
                                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                                    <p className="text-xs text-zinc-500 uppercase font-medium">Venda Total Projetada</p>
                                    <p className="text-lg font-bold text-zinc-900 mt-1">{formatBRL(totalVendaFinal)}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <p className="text-xs text-emerald-600 uppercase font-bold">Margem Bruta Proj.</p>
                                    <p className="text-xl font-black text-emerald-700 mt-1">{formatBRL(margemBruta)}</p>
                                    <p className="text-[10px] text-emerald-600/80 font-mono mt-1">{margemPercentual.toFixed(1)}% de margem</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-4">Composição Analítica por Serviço</h2>
                            <div className="space-y-6">
                                {servicesToRender.map((ps: any, idx: number) => {
                                    let custoMatLocal = 0;
                                    let vendaMatLocal = 0;
                                    ps.service.service_items.forEach((item: any) => {
                                        const c = item.material.cost_price * item.quantity;
                                        custoMatLocal += c;
                                        vendaMatLocal += item.material.is_resale ? c * item.material.markup_factor : c;
                                    });

                                    const moVenda = ps.mo_type === "custom" && ps.mo_custom_value !== null ? ps.mo_custom_value : (ps.mo_custom_value ?? 0);
                                    const margemLocal = (vendaMatLocal + moVenda) - (custoMatLocal + (moVenda * 0.40));

                                    return (
                                        <div key={ps.id} className="border border-zinc-200 rounded-lg overflow-hidden">
                                            <div className="bg-zinc-100 p-3 flex justify-between items-center border-b border-zinc-200">
                                                <h3 className="font-bold text-sm text-zinc-800">{idx + 1}. {ps.service.name}</h3>
                                                <span className="text-xs font-bold text-emerald-600">Margem: {formatBRL(margemLocal)}</span>
                                            </div>
                                            <div className="p-0">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-100">
                                                        <tr>
                                                            <th className="p-2 font-medium">SKU / Insumo</th>
                                                            <th className="p-2 font-medium text-center">Qtd</th>
                                                            <th className="p-2 font-medium text-right">Custo Unit.</th>
                                                            <th className="p-2 font-medium text-right">Custo Total</th>
                                                            <th className="p-2 font-medium text-right">Markup</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                        {ps.service.service_items.map((item: any) => (
                                                            <tr key={item.id} className="text-zinc-700">
                                                                <td className="p-2">
                                                                    <span className="font-mono text-[10px] bg-zinc-100 px-1 py-0.5 rounded mr-2">{item.material.sku}</span>
                                                                    {item.material.description}
                                                                </td>
                                                                <td className="p-2 text-center">{item.quantity} {item.material.unit}</td>
                                                                <td className="p-2 text-right">{formatBRL(item.material.cost_price)}</td>
                                                                <td className="p-2 text-right">{formatBRL(item.material.cost_price * item.quantity)}</td>
                                                                <td className="p-2 text-right font-mono text-[10px]">{item.material.is_resale ? `x${item.material.markup_factor}` : "Sem Mkup"}</td>
                                                            </tr>
                                                        ))}
                                                        {/* Linha de MO */}
                                                        <tr className="bg-zinc-50">
                                                            <td className="p-2 font-medium" colSpan={2}>Mão de Obra e Lançamentos (Venda)</td>
                                                            <td className="p-2 text-right" colSpan={3}>{formatBRL(moVenda)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}

                {/* Rodapé Padrão */}
                <div className="mt-16 pt-8 border-t border-zinc-200 text-center text-[10px] text-zinc-400">
                    <p>Solux Pinturas e Revestimentos EIRELI | CNPJ: XX.XXX.XXX/0001-XX</p>
                    <p>Documento gerado automaticamente pelo ERP Solux.</p>
                </div>
            </div>
        </div>
    );
}
