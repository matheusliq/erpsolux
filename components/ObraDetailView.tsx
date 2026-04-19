"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Trash2, Pencil, Check, X, ShieldCheck,
    Package, Receipt, TrendingUp, DollarSign, Percent, Plus,
    ArrowLeft, ShoppingCart, Wrench, Search, Loader2, Zap, ChevronDown
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { updateSafetyMargin } from "@/app/actions/clientes";
import { updateMaterial, createMaterial, searchMaterials } from "@/app/actions/materiais";
import { deleteTransaction, updateTransaction, createTransaction } from "@/app/actions/transactions";
import {
    updateService, updateServiceItemQty, updateProjectServiceMO,
    removeServiceFromProject, addServiceToProject, searchServices, deleteServiceItem, addMaterialToService, createAndLinkServiceToProject
} from "@/app/actions/services";
import { updateProject } from "@/app/actions/projetos";

// ─── Types ────────────────────────────────────────────────────────────────────
type Material = {
    id: string; sku: string; category: string; description: string;
    unit: string; cost_price: number; markup_factor: number; is_resale: boolean;
};
type ServiceItem = { id: string; quantity: number; material: Material; };
type Service = {
    id: string; code: string; name: string;
    mo_sell_value: number;
    service_items: ServiceItem[];
};
type ProjectService = {
    id: string; service: Service;
    safety_margin_type: string | null; safety_margin_value: number | null;
    mo_type: string | null; mo_custom_value: number | null;
};
type Transaction = {
    id: string; name: string; amount: number; type: string;
    cost_amount?: number; markup?: number;
    status: string; due_date: string;
    categories: { name: string; color: string } | null;
};
type Category = { id: string; name: string; color: string; type?: string; is_material?: boolean };

export type Project = {
    id: string; name: string; status: string | null; contract_value: number | null;
    entity: { name: string } | null;
    project_services: ProjectService[];
    transactions: Transaction[];
};

const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt2 = (v: number) => v.toFixed(2).replace(".", ",");

// ─── Money Input (máscara R$ direita-para-esquerda) ──────────────────────────
function MoneyInput({
    value, onChange, placeholder = "R$ 0,00", className = "", id
}: {
    value: number; onChange: (v: number) => void;
    placeholder?: string; className?: string; id?: string;
}) {
    const [raw, setRaw] = useState(Math.round(value * 100).toString());

    useEffect(() => {
        setRaw(Math.round(value * 100).toString());
    }, [value]);

    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (/^\d$/.test(e.key)) {
            e.preventDefault();
            const next = (raw + e.key).replace(/^0+/, "") || "0";
            setRaw(next);
            onChange(parseInt(next, 10) / 100);
        } else if (e.key === "Backspace") {
            e.preventDefault();
            const next = raw.slice(0, -1) || "0";
            setRaw(next);
            onChange(parseInt(next, 10) / 100);
        }
    };

    const display = `R$ ${(parseInt(raw || "0", 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <Input
            id={id}
            value={display}
            readOnly={false}
            onKeyDown={handleKey}
            onChange={() => {}}
            placeholder={placeholder}
            className={`font-mono cursor-text ${className}`}
        />
    );
}

// ─── Inline Editable Cell (números) ──────────────────────────────────────────
function EditableCell({
    value, onSave, className = "", isQty = false
}: { value: number; onSave: (v: number) => void; className?: string; isQty?: boolean }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(fmt2(value));

    const commit = () => {
        const parsed = parseFloat(draft.replace(",", "."));
        if (!isNaN(parsed) && parsed !== value) onSave(parsed);
        setEditing(false);
    };

    if (editing) return (
        <Input value={draft} onChange={(e) => setDraft(e.target.value)}
            onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className={`h-7 ${isQty ? "w-16" : "w-24"} text-right font-mono text-xs px-2`} autoFocus />
    );
    return (
        <button onClick={() => { setEditing(true); setDraft(fmt2(value)); }}
            className={`group flex items-center gap-1 hover:text-primary transition-colors ${className}`}>
            <span>{isQty ? draft : formatBRL(value)}</span>
            <Pencil size={9} className="opacity-0 group-hover:opacity-60 transition-opacity" />
        </button>
    );
}

// ─── Calcula MO efetiva de um ProjectService ─────────────────────────────────
function calcMO(ps: ProjectService, matCusto: number, operCusto: number): { moVenda: number; moCusto: number } {
    // O custo de MO base do catálogo é ignorado. Todo custo real operacional deve vir da aba Operacional.
    const moCusto = 0;
    
    if (ps.mo_type === "markup" && ps.mo_custom_value) {
        const moVenda = (matCusto + operCusto) * ps.mo_custom_value;
        return { moVenda, moCusto };
    }
    // fixed: mo_custom_value é o valor fixo de venda da MO, ou fallback para mo_sell_value
    const moVenda = ps.mo_custom_value ?? ps.service.mo_sell_value;
    return { moVenda, moCusto };
}

// ─── Calcula totais de um ProjectService ─────────────────────────────────────
function calcServiceTotals(ps: ProjectService, operCustos: { custo: number; venda: number }) {
    const matCusto = ps.service.service_items.reduce((a, si) => a + si.material.cost_price * si.quantity, 0);
    const matVenda = ps.service.service_items.reduce((a, si) => a + si.material.cost_price * si.material.markup_factor * si.quantity, 0);
    const { moVenda, moCusto } = calcMO(ps, matCusto, operCustos.custo);

    const custoTotal = matCusto + moCusto + operCustos.custo;
    const vendaBase = matVenda + moVenda + operCustos.venda;

    let safety = 0;
    if (ps.safety_margin_value && ps.safety_margin_type === "percentage") {
        safety = vendaBase * (ps.safety_margin_value / 100);
    } else if (ps.safety_margin_value) {
        safety = Number(ps.safety_margin_value);
    }

    const vendaTotal = vendaBase + safety;
    const margem = vendaTotal - custoTotal;
    const markup = custoTotal > 0 ? vendaTotal / custoTotal : 0;

    return { matCusto, matVenda, moVenda, moCusto, custoTotal, vendaTotal, margem, markup, vendaBase, safety };
}

// ─── KPI Strip (pode receber totais de 1 ou N serviços) ──────────────────────
function KpiStrip({ label, custoTotal, vendaTotal, margem, markup }: {
    label?: string; custoTotal: number; vendaTotal: number; margem: number; markup: number;
}) {
    const margemPct = vendaTotal > 0 ? ((margem / vendaTotal) * 100).toFixed(1) : "0.0";

    const kpis = [
        { label: "Custo Total (COGS)", value: formatBRL(custoTotal), Icon: Package, color: "text-rose-400" },
        { label: "Venda Total", value: formatBRL(vendaTotal), Icon: DollarSign, color: "text-foreground" },
        { label: "Margem Bruta", value: `${formatBRL(margem)} (${margemPct}%)`, Icon: TrendingUp, color: margem >= 0 ? "text-emerald-400" : "text-rose-400" },
        { label: "Markup Médio", value: `${markup.toFixed(2)}x`, Icon: Percent, color: "text-primary" },
    ];

    return (
        <div className="space-y-2 mb-6">
            {label && <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{label}</p>}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {kpis.map((k) => (
                    <div key={k.label} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <k.Icon size={13} className="text-muted-foreground" />
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</p>
                        </div>
                        <p className={`text-lg font-black ${k.color}`}>{k.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── MO Panel ─────────────────────────────────────────────────────────────────
function MOPanel({ ps, operCustos, onRefresh }: {
    ps: ProjectService; operCustos: number; onRefresh: () => void;
}) {
    const [moType, setMoType] = useState<"fixed" | "markup">(
        (ps.mo_type as "fixed" | "markup") ?? "fixed"
    );
    const [moVal, setMoVal] = useState(ps.mo_custom_value ?? ps.service.mo_sell_value);
    const [, startTransition] = useTransition();

    const matCusto = ps.service.service_items.reduce((a, si) => a + si.material.cost_price * si.quantity, 0);
    const preview = moType === "markup"
        ? (matCusto + operCustos) * moVal
        : moVal;

    const save = () => {
        startTransition(async () => {
            await updateProjectServiceMO(ps.id, { mo_type: moType, mo_custom_value: moVal });
            onRefresh();
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
                <Wrench size={14} className="text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Mão de Obra (MO):</span>
                <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
                    <button onClick={() => setMoType("fixed")}
                        className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${moType === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                        Valor Fixo
                    </button>
                    <button onClick={() => setMoType("markup")}
                        className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${moType === "markup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                        Markup s/ Custos
                    </button>
                </div>
                <div className="flex items-center gap-2 flex-1">
                    {moType === "fixed" ? (
                        <MoneyInput value={moVal} onChange={setMoVal} className="h-8 w-36 text-xs" />
                    ) : (
                        <div className="flex items-center gap-1">
                            <Input
                                value={String(moVal).replace(".", ",")}
                                onChange={e => {
                                    const raw = e.target.value.replace(",", ".");
                                    const parsed = parseFloat(raw);
                                    if (!isNaN(parsed)) setMoVal(parsed);
                                    else if (raw === "" || raw === ".") setMoVal(0);
                                }}
                                onBlur={e => {
                                    const v = parseFloat(e.target.value.replace(",", "."));
                                    setMoVal(isNaN(v) ? 0 : v);
                                }}
                                className="h-8 w-20 text-right font-mono text-xs"
                                placeholder="Ex: 1,5"
                            />
                            <span className="text-xs text-muted-foreground">× custos</span>
                        </div>
                    )}
                    <Button onClick={save} size="sm" variant="outline" className="h-8 text-xs gap-1">
                        <Check size={11} /> Aplicar
                    </Button>
                </div>
                <span className="text-xs text-muted-foreground ml-auto">
                    {moType === "fixed"
                        ? `MO = ${formatBRL(preview)} fixo`
                        : `${formatBRL(matCusto + operCustos)} × ${moVal} = ${formatBRL(preview)}`}
                </span>
            </div>
        </div>
    );
}

// ─── Safety Margin Panel ──────────────────────────────────────────────────────
function SafetyMarginPanel({ ps, vendaBase, onRefresh }: {
    ps: ProjectService; vendaBase: number; onRefresh: () => void;
}) {
    const [marginType, setMarginType] = useState<"percentage" | "fixed">(
        (ps.safety_margin_type as "percentage" | "fixed") ?? "percentage"
    );
    const [marginVal, setMarginVal] = useState(String(ps.safety_margin_value ?? 0));
    const [, startTransition] = useTransition();

    const saveSafetyMargin = () => {
        const val = parseFloat(marginVal.replace(",", "."));
        if (isNaN(val)) return;
        startTransition(async () => {
            await updateSafetyMargin(ps.id, marginType, val);
            onRefresh();
        });
    };

    const previewSafety = marginType === "percentage"
        ? vendaBase * (parseFloat(marginVal || "0") / 100)
        : parseFloat(marginVal || "0");

    return (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-center">
            <ShieldCheck size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-muted-foreground">Margem de Segurança:</span>
            <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
                <button onClick={() => setMarginType("percentage")}
                    className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${marginType === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>%</button>
                <button onClick={() => setMarginType("fixed")}
                    className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${marginType === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>R$</button>
            </div>
            <Input value={marginVal} onChange={(e) => setMarginVal(e.target.value)}
                placeholder={marginType === "percentage" ? "Ex: 10" : "Ex: 200"}
                className="h-8 w-24 text-right font-mono text-xs" />
            <Button onClick={saveSafetyMargin} size="sm" variant="outline" className="h-8 text-xs gap-1">
                <Check size={11} /> Aplicar
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
                {marginType === "percentage"
                    ? `+${marginVal || 0}% s/ total base = ${formatBRL(previewSafety)}`
                    : `+${formatBRL(parseFloat(marginVal || "0"))} fixo`}
            </span>
            <span className="text-[10px] text-muted-foreground w-full">
                Base = Mat + Log + MO = {formatBRL(vendaBase)} → c/ margem: {formatBRL(vendaBase + previewSafety)}
            </span>
        </div>
    );
}

// ─── Materials Tab ──────────────────────────────────────────────────────────
function MaterialsTab({ projectService, operCustos, onRefresh }: {
    projectService: ProjectService; operCustos: { custo: number; venda: number }; onRefresh: () => void;
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkMode, setBulkMode] = useState<"pct" | "fixed">("pct");
    const [bulkVal, setBulkVal] = useState("");
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [, startTransition] = useTransition();
    const { service: s } = projectService;

    const totals = calcServiceTotals(projectService, operCustos);

    const items = s.service_items.filter((si) =>
        si.material.description.toLowerCase().includes(search.toLowerCase()) ||
        si.material.sku.toLowerCase().includes(search.toLowerCase())
    );

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };
    const toggleAll = () =>
        setSelected(selected.size === items.length ? new Set() : new Set(items.map((i) => i.id)));

    const applyBulk = () => {
        if (!bulkVal || selected.size === 0) return;
        const num = parseFloat(bulkVal.replace(",", "."));
        if (isNaN(num) || num <= 0) return;
        const selectedItems = items.filter((i) => selected.has(i.id));
        startTransition(async () => {
            for (const item of selectedItems) {
                let newMarkup: number;
                // REGRA: markup é sempre um MULTIPLICADOR sobre o cost_price BASE.
                // "pct" = define o multiplicador diretamente (ex: 1.5 = venda é 1.5x o custo)
                // "fixed" = acrescenta R$ ao preço final (calcula novo multiplicador a partir do custo base)
                if (bulkMode === "pct") {
                    // Substituição direta: ignora markup anterior, aplica novo sobre custo raiz
                    newMarkup = num;
                } else {
                    // Incremento fixo: custo_base + R$ extra => novo_markup = (custo + extra) / custo
                    const newVenda = item.material.cost_price + num;
                    newMarkup = item.material.cost_price > 0 ? newVenda / item.material.cost_price : 1;
                }
                await updateMaterial(item.material.id, { markup_factor: Math.max(1, newMarkup) });
            }
            setSelected(new Set());
            setBulkVal("");
            onRefresh();
        });
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-center">
                <Input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por SKU ou nome..." className="h-8 text-xs w-56" />
                {selected.size > 0 && (
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5 animate-in slide-in-from-bottom-2">
                        <span className="text-xs text-primary font-semibold">{selected.size} sel.</span>
                        <div className="flex bg-muted rounded-md p-0.5 gap-0.5">
                            <button onClick={() => setBulkMode("pct")} 
                                title="Define o multiplicador diretamente sobre o custo (ex: 1.5 = Venda é 1.5× o custo)"
                                className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${bulkMode === "pct" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>MKx</button>
                            <button onClick={() => setBulkMode("fixed")}
                                title="Acrescenta R$ sobre o custo base (ex: 50 = Custo + R$50)"
                                className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${bulkMode === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>R$+</button>
                        </div>
                        <Input value={bulkVal} onChange={(e) => setBulkVal(e.target.value)}
                            placeholder={bulkMode === "pct" ? "Ex: 1.5" : "+100"}
                            className="h-6 w-16 text-xs text-right font-mono px-1.5" />
                        <Button onClick={applyBulk} size="sm" className="h-6 text-[10px] px-3">Aplicar</Button>
                        <button onClick={() => setSelected(new Set())}><X size={12} className="text-muted-foreground" /></button>
                    </div>
                )}
                <p className="text-xs text-muted-foreground ml-auto">{s.service_items.length} itens</p>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="p-3 w-8"><Checkbox checked={selected.size === items.length && items.length > 0} onCheckedChange={toggleAll} /></th>
                                <th className="p-3 text-left font-semibold text-muted-foreground">SKU</th>
                                <th className="p-3 text-left font-semibold text-muted-foreground">Descrição</th>
                                <th className="p-3 text-center font-semibold text-muted-foreground">Categoria</th>
                                <th className="p-3 text-center font-semibold text-muted-foreground">Qtd ✏️</th>
                                <th className="p-3 text-right font-semibold text-muted-foreground">Custo Unt.</th>
                                <th className="p-3 text-right font-semibold text-muted-foreground">Venda Unt.</th>
                                <th className="p-3 text-right font-semibold text-emerald-400">Margem Unt.</th>
                                <th className="p-3 text-right font-semibold text-primary">Markup</th>
                                <th className="p-3 text-right font-semibold text-muted-foreground">Tot. Custo</th>
                                <th className="p-3 text-right font-semibold text-muted-foreground">Tot. Venda</th>
                                <th className="p-3 text-right font-semibold text-emerald-400">Tot. Margem</th>
                                <th className="p-3 w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((si) => {
                                const vendaUnt = si.material.cost_price * si.material.markup_factor;
                                const margemUnt = vendaUnt - si.material.cost_price;
                                const markupUnt = si.material.markup_factor;
                                const totalC = si.material.cost_price * si.quantity;
                                const totalV = vendaUnt * si.quantity;
                                const totalM = totalV - totalC;
                                const isResale = si.material.is_resale;
                                return (
                                    <tr key={si.id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="p-3"><Checkbox checked={selected.has(si.id)} onCheckedChange={() => toggleSelect(si.id)} /></td>
                                        <td className="p-3"><span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">{si.material.sku}</span></td>
                                        <td className="p-3 font-medium">{si.material.description}</td>
                                        <td className="p-3 text-center text-muted-foreground">{si.material.category}</td>
                                        {/* Qtd editável */}
                                        <td className="p-3 text-center">
                                            <EditableCell isQty value={si.quantity} onSave={(v) => {
                                                startTransition(async () => {
                                                    await updateServiceItemQty(si.id, v);
                                                    onRefresh();
                                                });
                                            }} />
                                        </td>
                                        <td className="p-3 text-right">
                                            <EditableCell value={si.material.cost_price} onSave={(v) => {
                                                startTransition(async () => { await updateMaterial(si.material.id, { cost_price: v }); onRefresh(); });
                                            }} />
                                        </td>
                                        <td className="p-3 text-right">
                                            <EditableCell value={vendaUnt} className={isResale ? "text-primary" : "text-muted-foreground"}
                                                onSave={(novaVenda) => {
                                                    const mk = si.material.cost_price > 0 ? novaVenda / si.material.cost_price : 1;
                                                    startTransition(async () => { await updateMaterial(si.material.id, { markup_factor: mk }); onRefresh(); });
                                                }} />
                                        </td>
                                        <td className="p-3 text-right font-semibold font-mono">
                                            {isResale ? <span className="text-emerald-400">{formatBRL(margemUnt)}</span> : <span className="text-muted-foreground text-[10px]">Absorvido</span>}
                                        </td>
                                        {/* Markup editável diretamente */}
                                        <td className="p-3 text-right">
                                            <EditableCell value={markupUnt} className="text-primary text-[10px]"
                                                onSave={(novoMk) => {
                                                    startTransition(async () => { await updateMaterial(si.material.id, { markup_factor: novoMk }); onRefresh(); });
                                                }} />
                                            <span className="text-muted-foreground text-[9px] ml-0.5">x</span>
                                        </td>
                                        <td className="p-3 text-right text-muted-foreground font-mono">{formatBRL(totalC)}</td>
                                        <td className="p-3 text-right font-mono">{isResale ? formatBRL(totalV) : "—"}</td>
                                        <td className="p-3 text-right font-bold font-mono">
                                            {isResale ? <span className="text-emerald-400">{formatBRL(totalM)}</span> : <span className="text-muted-foreground text-[10px]">—</span>}
                                        </td>
                                        <td className="p-3">
                                            <button onClick={() => setDeleteId(si.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 p-1 rounded transition-all">
                                                <Trash2 size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-muted/30 border-t-2 border-border">
                            <tr>
                                <td colSpan={9} className="p-3 text-right text-xs font-bold text-muted-foreground">TOTAIS</td>
                                <td className="p-3 text-right text-xs font-bold font-mono text-rose-400">{formatBRL(totals.matCusto)}</td>
                                <td className="p-3 text-right text-xs font-bold font-mono">{formatBRL(totals.matVenda)}</td>
                                <td className="p-3 text-right text-xs font-bold font-mono text-emerald-400">{formatBRL(totals.matVenda - totals.matCusto)}</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>Remover este item de serviço? Esta ação não pode ser desfeita.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => {
                            if (!deleteId) return;
                            startTransition(async () => {
                                await deleteServiceItem(deleteId);
                                setDeleteId(null);
                                onRefresh();
                            });
                        }}>Excluir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────
function ExpensesTab({
    transactions, projectServiceId, projectService, operCustos, onRefresh
}: { 
    transactions: Transaction[]; 
    projectServiceId: string; 
    projectService: ProjectService;
    operCustos: { custo: number; venda: number };
    onRefresh: () => void; 
}) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const [draftCost, setDraftCost] = useState("");
    const [draftMarkup, setDraftMarkup] = useState("");
    const [draftName, setDraftName] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [, startTransition] = useTransition();

    // Filtro ESTRITO: apenas custos deste serviço específico
    const custos = transactions.filter(t => 
        (t.type === "Sa_da" || t.type === "Saída") && 
        (t as any).project_service_id === projectServiceId
    );
    const totalCusto = custos.reduce((a, t) => a + (t.cost_amount || t.amount), 0);
    const totalVendaMO = custos.reduce((a, t) => a + t.amount, 0);

    const totals = calcServiceTotals(projectService, operCustos);

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };
    
    const toggleAll = () =>
        setSelected(selected.size === custos.length ? new Set() : new Set(custos.map((c) => c.id)));

    const deleteSelected = () => {
        if (selected.size === 0) return;
        startTransition(async () => {
            for (const id of Array.from(selected)) {
                await deleteTransaction(id);
            }
            setSelected(new Set());
            onRefresh();
        });
    };

    const commitEdit = (t: Transaction) => {
        const cost = parseFloat(draftCost.replace(",", "."));
        const markup = parseFloat(draftMarkup.replace(",", "."));
        
        const updates: any = {};
        let newAmount = t.amount;

        if (!isNaN(cost)) updates.cost_amount = cost;
        if (!isNaN(markup)) updates.markup = markup;

        // Se pelo menos um dos valores numéricos mudou:
        if (!isNaN(cost) || !isNaN(markup)) {
            const finalCost = !isNaN(cost) ? cost : (t.cost_amount || t.amount);
            const finalMarkup = !isNaN(markup) ? markup : (t.markup || 1);
            newAmount = finalCost * finalMarkup;
            updates.amount = newAmount;
        }

        if (draftName.trim() && draftName.trim() !== t.name) updates.name = draftName.trim();
        if (Object.keys(updates).length === 0) { setEditing(null); return; }
        
        startTransition(async () => {
            await updateTransaction(t.id, updates);
            setEditing(null); onRefresh();
        });
    };

    return (
        <div className="space-y-4">
            {/* MO e Margem de Segurança vivem agora na aba Operacional */}
            <MOPanel ps={projectService} operCustos={operCustos.custo} onRefresh={onRefresh} />
            <SafetyMarginPanel ps={projectService} vendaBase={totals.vendaBase} onRefresh={onRefresh} />

            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Custos diretos deste serviço (diárias, logística, refeições, materiais extras, etc.)
                </p>
                {custos.length > 0 && (
                    <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Custo: {formatBRL(totalCusto)}</span>
                        <span className="text-sm font-bold font-mono text-emerald-400 block">Venda p/ Cliente: {formatBRL(totalVendaMO)}</span>
                    </div>
                )}
            </div>

            {/* Toolbar Operacional */}
            {selected.size > 0 && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-1.5 animate-in slide-in-from-bottom-2">
                    <span className="text-xs text-rose-500 font-semibold">{selected.size} sel.</span>
                    <Button onClick={deleteSelected} size="sm" variant="destructive" className="h-6 text-[10px] px-3 ml-2">Excluir Selecionados</Button>
                    <button onClick={() => setSelected(new Set())}><X size={12} className="text-muted-foreground ml-2" /></button>
                </div>
            )}

            <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="p-3 w-8"><Checkbox checked={selected.size === custos.length && custos.length > 0} onCheckedChange={toggleAll} /></th>
                            <th className="p-3 text-left font-semibold text-muted-foreground">Descrição</th>
                            <th className="p-3 text-center font-semibold text-muted-foreground">Categoria</th>
                            <th className="p-3 text-center font-semibold text-muted-foreground">Status</th>
                            <th className="p-3 text-right font-semibold text-rose-400">Custo</th>
                            <th className="p-3 text-right font-semibold text-primary">Markup</th>
                            <th className="p-3 text-right font-semibold text-emerald-400">Venda</th>
                            <th className="p-3 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {custos.length === 0 && (
                            <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                                Nenhum custo operacional lançado neste serviço.
                            </td></tr>
                        )}
                        {custos.map((t) => {
                            const isEdit = editing === t.id;
                            const costReal = t.cost_amount || t.amount;
                            const mkVal = t.markup || 1;
                            const lucro = t.amount - costReal;

                            return (
                                <tr key={t.id} className="group hover:bg-muted/20 transition-colors">
                                    <td className="p-3"><Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} /></td>
                                    <td className="p-3">
                                        {isEdit ? <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} className="h-7 text-xs w-40" autoFocus /> : <span className="font-medium">{t.name}</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        {t.categories
                                            ? <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${t.categories.color}20`, color: t.categories.color }}>{t.categories.name}</span>
                                            : <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${t.status === "Pago" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : t.status === "Atrasado" ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-blue-400 bg-blue-500/10 border-blue-500/20"}`}>{t.status}</span>
                                    </td>
                                    <td className="p-3 text-right">
                                        {isEdit ? <Input value={draftCost} onChange={(e) => setDraftCost(e.target.value)} className="h-7 w-20 text-right font-mono text-xs" /> : <span className="font-bold font-mono text-rose-400">-{formatBRL(costReal)}</span>}
                                    </td>
                                    <td className="p-3 text-right">
                                        {isEdit ? <Input value={draftMarkup} onChange={(e) => setDraftMarkup(e.target.value)} className="h-7 w-16 text-right font-mono text-xs text-primary" /> : <span className="font-mono text-primary text-[10px]">{mkVal}x</span>}
                                    </td>
                                    <td className="p-3 text-right">
                                         <span className="font-bold font-mono text-emerald-400">{formatBRL(t.amount)}</span>
                                         {lucro > 0 && <span className="block text-[9px] text-muted-foreground">(+{formatBRL(lucro)})</span>}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isEdit ? (
                                                <>
                                                    <button onClick={() => commitEdit(t)} className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10"><Check size={12} /></button>
                                                    <button onClick={() => setEditing(null)} className="p-1 rounded text-muted-foreground hover:bg-muted"><X size={12} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setEditing(t.id); setDraftCost(String(costReal)); setDraftMarkup(String(mkVal)); setDraftName(t.name); }} className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10"><Pencil size={11} /></button>
                                                    <button onClick={() => setDeleteId(t.id)} className="p-1 rounded text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"><Trash2 size={11} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>Excluir este lançamento permanentemente?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => {
                            if (!deleteId) return;
                            startTransition(async () => { await deleteTransaction(deleteId); setDeleteId(null); onRefresh(); });
                        }}>Excluir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Material Autocomplete ─────────────────────────────────────────────────────
type MatResult = { id: string; sku: string; description: string; category: string; unit: string; cost_price: number; markup_factor: number; sell_price: number; is_resale: boolean; };

function MaterialCombobox({
    value, onChange, onNewProduct
}: {
    value: string; onChange: (name: string, mat?: MatResult) => void; onNewProduct: () => void;
}) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<MatResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!query || query.length < 2) { setResults([]); setOpen(false); return; }
        setLoading(true);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(async () => {
            const res = await searchMaterials(query);
            setResults(res.data ?? []);
            setOpen(true);
            setLoading(false);
        }, 300);
    }, [query]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const select = (mat: MatResult) => {
        setQuery(mat.description);
        setOpen(false);
        onChange(mat.description, mat);
    };

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                {loading && <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />}
                <Input value={query} onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
                    placeholder="Buscar produto cadastrado..." className="text-sm pl-8" />
            </div>
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
                    {results.length === 0 ? (
                        <div className="p-3 space-y-2">
                            <p className="text-xs text-muted-foreground text-center">Nenhum produto encontrado.</p>
                            <button onClick={() => { setOpen(false); onNewProduct(); }}
                                className="w-full flex items-center justify-center gap-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors font-semibold">
                                <Plus size={12} /> Cadastrar "{query}" como novo produto
                            </button>
                        </div>
                    ) : (
                        <ul className="max-h-52 overflow-y-auto divide-y divide-border">
                            {results.map(m => (
                                <li key={m.id}>
                                    <button onClick={() => select(m)}
                                        className="w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left">
                                        <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 shrink-0 mt-0.5">{m.sku}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{m.description}</p>
                                            <p className="text-[10px] text-muted-foreground">{m.category} · Custo: {formatBRL(m.cost_price)} → Venda: {formatBRL(m.sell_price)}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                            <li>
                                <button onClick={() => { setOpen(false); onNewProduct(); }}
                                    className="w-full flex items-center justify-center gap-1.5 text-xs text-primary hover:bg-primary/10 px-3 py-2 transition-colors font-semibold">
                                    <Plus size={12} /> Cadastrar novo produto
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── New Material Inline Form ──────────────────────────────────────────────────
function NewMaterialForm({ namePreset, onCreated, onCancel }: {
    namePreset?: string; onCreated: (mat: MatResult) => void; onCancel: () => void;
}) {
    const [form, setForm] = useState({ description: namePreset ?? "", category: "", unit: "un", cost_price: 0, markup_factor: 1.8 });
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

    const handleCreate = () => {
        if (!form.description.trim() || !form.category.trim()) { setError("Informe descrição e categoria."); return; }
        setError(null);
        startTransition(async () => {
            const res = await createMaterial({
                category: form.category,
                description: form.description,
                unit: form.unit,
                cost_price: form.cost_price,
                markup_factor: form.markup_factor,
                is_resale: true,
            });
            if (res.success && res.data) {
                const d = res.data as any;
                onCreated({
                    id: d.id, sku: d.sku, description: d.description, category: d.category,
                    unit: d.unit, cost_price: d.cost_price, markup_factor: d.markup_factor,
                    sell_price: d.cost_price * d.markup_factor, is_resale: true,
                });
            } else {
                setError(res.error ?? "Erro ao criar produto.");
            }
        });
    };

    return (
        <div className="border border-primary/30 bg-primary/5 rounded-xl p-3 space-y-2 animate-in slide-in-from-bottom-2">
            <p className="text-xs font-semibold text-primary flex items-center gap-1.5"><Zap size={11} /> Novo Produto</p>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Descrição *</label>
                    <Input value={form.description} onChange={e => set("description", e.target.value)} className="text-xs h-8" />
                </div>
                <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Categoria *</label>
                    <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="Ex: PINCEL" className="text-xs h-8" />
                </div>
                <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Unidade</label>
                    <Input value={form.unit} onChange={e => set("unit", e.target.value)} className="text-xs h-8" />
                </div>
                <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Custo (R$)</label>
                    <MoneyInput value={form.cost_price} onChange={(v) => set("cost_price", v)} className="h-8 text-xs" />
                </div>
            </div>
            {error && <p className="text-[11px] text-rose-400">{error}</p>}
            <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={isPending} className="h-7 text-xs gap-1">
                    {isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Cadastrar
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">Cancelar</Button>
            </div>
        </div>
    );
}

// ─── New Transaction Modal (Pro) ──────────────────────────────────────────────
function NewTransactionModal({
    projectId, projectServiceId, serviceId, projectServices, categories, open, onClose, onSuccess
}: {
    projectId: string;
    projectServiceId?: string;
    serviceId?: string;
    projectServices?: { id: string, service: { name: string } }[];
    categories: Category[];
    open: boolean; onClose: () => void; onSuccess: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [isResale, setIsResale] = useState(false);
    const [showNewMat, setShowNewMat] = useState(false);
    const [selectedMat, setSelectedMat] = useState<MatResult | null>(null);
    const [form, setForm] = useState({
        name: "", amount: 0, type: "saida",
        status: "Agendado", due_date: new Date().toISOString().split("T")[0], category_id: "",
        service_id: "",
    });
    const [error, setError] = useState<string | null>(null);

    const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

    const catGerais = categories.filter(c => c.type === "Entrada" || !c.type);
    // Filtro cirúrgico: Se for revenda, mostra só categorias de materiais. Se for custo, mostra só operacionais.
    const catSaidas = categories.filter(c => (c.type === "Sa_da" || c.type === "Saída") && (isResale ? c.is_material : !c.is_material));

    // Quando seleciona um material, preenche o valor com o preço de venda sugerido
    const handleMatSelect = (name: string, mat?: MatResult) => {
        set("name", name);
        if (mat) {
            setSelectedMat(mat);
            const matchingCat = categories.find(c => c.name.toLowerCase() === mat.category?.toLowerCase());
            
            setForm(f => ({ 
                ...f, 
                name, 
                amount: mat.sell_price,
                ...(matchingCat ? { category_id: matchingCat.id } : {})
            }));
        }
    };

    const handleSubmit = () => {
        if (!form.name.trim() || form.amount <= 0 || !form.due_date) {
            setError("Preencha nome/produto, valor e data."); return;
        }
        setError(null);
        startTransition(async () => {
            if (isResale && selectedMat) {
                // Tenta usar o serviceId passado ou o selecionado no form
                const targetServiceId = projectServiceId || form.service_id;
                
                // Se for revenda, precisamos do ID real do CATALOGO (serviceId), não do vínculo (projectServiceId)
                // O targetService que vem do form ou do prop resolvemos aqui
                const catalogServiceId = serviceId || (targetServiceId ? (projectServices as any)?.find((ps: any) => ps.id === targetServiceId)?.service.id : null);

                if (!catalogServiceId) {
                    setError("Selecione um serviço para vincular o produto de revenda.");
                    return;
                }

                // REVENDA → adiciona como service_item (material da obra) no serviço focado
                const res = await addMaterialToService(catalogServiceId, selectedMat.id, 1);
                if (res.success) {
                    setForm({ name: "", amount: 0, type: "saida", status: "Agendado", due_date: new Date().toISOString().split("T")[0], category_id: "", service_id: "" });
                    setIsResale(false); setSelectedMat(null); setShowNewMat(false);
                    onSuccess(); onClose();
                } else { setError(res.error ?? "Erro ao adicionar produto de revenda."); }
            } else if (isResale && selectedMat && !serviceId) {
                setError("Selecione um serviço para vincular o produto de revenda.");
            } else {
                // CUSTO DE OBRA → transação financeira normal
                const res = await createTransaction({
                    name: form.name.trim(),
                    amount: form.amount,
                    type: form.type,
                    status: form.status,
                    due_date: form.due_date,
                    category_id: form.category_id || undefined,
                    project_id: projectId,
                    project_service_id: projectServiceId || (form.service_id ? form.service_id : undefined),
                    material_id: selectedMat?.id,
                    is_resale: false,
                });
                if (res.success) {
                    setForm({ name: "", amount: 0, type: "saida", status: "Agendado", due_date: new Date().toISOString().split("T")[0], category_id: "", service_id: "" });
                    setIsResale(false); setSelectedMat(null); setShowNewMat(false);
                    onSuccess(); onClose();
                } else { setError(res.error ?? "Erro ao criar lançamento."); }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus size={16} className="text-primary" /> Novo Lançamento
                    </DialogTitle>
                    <DialogDescription>
                        {projectServiceId ? "Custo vinculado a este serviço." : "Lançamento vinculado a esta obra."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {/* Toggle Custo / Revenda */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                        <div className="flex bg-background border border-border rounded-lg p-0.5 gap-0.5">
                            <button onClick={() => { setIsResale(false); set("type", "saida"); }}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${!isResale ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "text-muted-foreground"}`}>
                                <Wrench size={11} /> Custo de Obra
                            </button>
                            <button onClick={() => { setIsResale(true); set("type", "entrada"); }}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${isResale ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground"}`}>
                                <ShoppingCart size={11} /> Revenda
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            {isResale ? "Item vendido ao cliente (busca produto cadastrado)" : "Custo direto da obra"}
                        </p>
                    </div>

                    {/* Campo de Nome / Produto */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                            {isResale ? "Material / Produto *" : "Descrição *"}
                        </label>
                        {isResale ? (
                            <MaterialCombobox
                                value={form.name}
                                onChange={handleMatSelect}
                                onNewProduct={() => setShowNewMat(true)}
                            />
                        ) : (
                            <Input value={form.name} onChange={e => set("name", e.target.value)}
                                placeholder="Ex: Diária Markin, Marmita, Uber..." className="text-sm" />
                        )}
                    </div>

                    {/* Inline novo material */}
                    {showNewMat && (
                        <NewMaterialForm
                            namePreset={form.name}
                            onCreated={(mat) => {
                                setSelectedMat(mat);
                                setForm(f => ({ ...f, name: mat.description, amount: mat.sell_price }));
                                setShowNewMat(false);
                            }}
                            onCancel={() => setShowNewMat(false)}
                        />
                    )}

                    {/* Valor + Status */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                                Valor (R$) *
                                {selectedMat && <span className="text-primary ml-1 text-[10px]">← sugerido</span>}
                            </label>
                            <MoneyInput value={form.amount} onChange={(v) => set("amount", v)} className="text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                            <select value={form.status} onChange={e => set("status", e.target.value)}
                                className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary/40">
                                <option value="Agendado">Agendado</option>
                                <option value="Pago">Pago</option>
                                <option value="Atrasado">Atrasado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    {/* Data */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Data *</label>
                        <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} className="text-sm" />
                    </div>

                    {/* Tipo de custo (apenas se não é revenda) */}
                    {!isResale && (
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                            <div className="flex gap-2">
                                <button onClick={() => set("type", "saida")}
                                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${form.type === "saida" ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "border-border text-muted-foreground"}`}>
                                    Saída (Custo)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Categoria */}
                    {categories.length > 0 && (
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                            <select value={form.category_id} onChange={e => set("category_id", e.target.value)}
                                className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary/40">
                                <option value="">Sem categoria</option>
                                <optgroup label="Entradas / Receitas">
                                    {catGerais.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </optgroup>
                                <optgroup label="Saídas / Operacional">
                                    {catSaidas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </optgroup>
                            </select>
                        </div>
                    )}

                    {/* Vínculo de Serviço (Para lançamento global) */}
                    {!projectServiceId && projectServices && projectServices.length > 0 && form.type === "saida" && (
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Vincular a um Serviço (Opcional)</label>
                            <select value={form.service_id} onChange={e => set("service_id", e.target.value)}
                                className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary/40">
                                <option value="">Geral da Obra (Sem vínculo)</option>
                                {projectServices.map(ps => <option key={ps.id} value={ps.id}>{ps.service.name}</option>)}
                            </select>
                        </div>
                    )}


                    {error && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isPending} className="gap-1.5">
                        <Plus size={12} /> {isPending ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Project Header Editor ───────────────────────────────────────────────────────
function ProjectHeaderEditor({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
    const [editing, setEditing] = useState(false);
    const [draftName, setDraftName] = useState(project.name);
    const [draftStatus, setDraftStatus] = useState(project.status || "Ativa");
    const [, startTransition] = useTransition();

    const commit = () => {
        if ((draftName.trim() && draftName !== project.name) || draftStatus !== project.status) {
            startTransition(async () => { 
                await updateProject(project.id, { name: draftName.trim(), status: draftStatus }); 
                onRefresh(); 
            });
        }
        setEditing(false);
    };

    if (editing) return (
        <div className="flex items-center gap-3 mb-1">
            <Input value={draftName} onChange={e => setDraftName(e.target.value)}
                onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
                className="h-9 text-xl font-bold w-80 shadow-inner" autoFocus />
            
            <select value={draftStatus} onChange={e => setDraftStatus(e.target.value)} onBlur={commit}
                className="h-9 text-xs font-bold bg-muted border border-border rounded-md px-3 focus:outline-none uppercase">
                <option value="Negociação">Negociação</option>
                <option value="Ativa">Ativa</option>
                <option value="Pausada">Pausada</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
            </select>

            <button onClick={commit} className="p-1.5 rounded-md hover:bg-emerald-500/20 text-emerald-500 transition-colors"><Check size={16} /></button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"><X size={16} /></button>
        </div>
    );

    return (
        <button onClick={() => { setEditing(true); setDraftName(project.name); setDraftStatus(project.status || "Ativa"); }}
            className="group flex items-center gap-3 mb-1 hover:opacity-80 transition-opacity text-left">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.status && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-muted text-muted-foreground uppercase">
                    {project.status}
                </span>
            )}
            <Pencil size={14} className="opacity-0 group-hover:opacity-70 transition-opacity text-muted-foreground" />
        </button>
    );
}

// ─── Service Name Editor ───────────────────────────────────────────────────────
function ServiceNameEditor({ service, onRefresh }: { service: Service; onRefresh: () => void }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(service.name);
    const [, startTransition] = useTransition();

    const commit = () => {
        if (draft.trim() && draft !== service.name) {
            startTransition(async () => { await updateService(service.id, { name: draft.trim() }); onRefresh(); });
        }
        setEditing(false);
    };

    if (editing) return (
        <div className="flex items-center gap-2">
            <Input value={draft} onChange={e => setDraft(e.target.value)}
                onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
                className="h-7 text-sm font-bold w-72" autoFocus />
            <button onClick={commit} className="p-1 text-emerald-400"><Check size={14} /></button>
            <button onClick={() => setEditing(false)} className="p-1 text-muted-foreground"><X size={14} /></button>
        </div>
    );

    return (
        <button onClick={() => { setEditing(true); setDraft(service.name); }}
            className="group flex items-center gap-2 hover:text-primary transition-colors">
            <h3 className="font-bold text-sm">{service.name}</h3>
            <Pencil size={11} className="opacity-0 group-hover:opacity-70 transition-opacity text-muted-foreground" />
        </button>
    );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export function ObraDetailView({ project, categories }: {
    project: Project;
    categories: { id: string; name: string; color: string; type?: string }[];
}) {
    const router = useRouter();
    const refresh = () => router.refresh();
    const [modalOpen, setModalOpen] = useState(false);
    const [focusedServiceId, setFocusedServiceId] = useState<string | null>(null);
    const [modalServiceId, setModalServiceId] = useState<string | undefined>(undefined);
    const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
    const [addServiceOpen, setAddServiceOpen] = useState(false);
    const [serviceName, setServiceName] = useState("");
    const [, startTransition] = useTransition();

    const focusedService = focusedServiceId
        ? project.project_services.find((ps) => ps.id === focusedServiceId) ?? null
        : null;

    const openModalForService = (psId: string) => { setModalServiceId(psId); setModalOpen(true); };

    // Resolve o service.id real do catálogo a partir do project_service_id do modal
    // Necessário para adicionar materiais de revenda no service_items correto
    const resolvedServiceId = modalServiceId
        ? project.project_services.find(ps => ps.id === modalServiceId)?.service.id
        : focusedService?.service.id;

    const servicesToRender = focusedServiceId
        ? project.project_services.filter((ps) => ps.id === focusedServiceId)
        : project.project_services;

    // Calcula KPIs da obra toda (apenas quando não está em focus mode)
    const allTotals = project.project_services.reduce((acc, ps) => {
        const transCtx = project.transactions.filter(t => (t.type === "Sa_da" || t.type === "Saída") && (t as any).project_service_id === ps.id);
        const operCusto = transCtx.reduce((a, t) => a + (t.cost_amount || t.amount), 0);
        const operVenda = transCtx.reduce((a, t) => a + t.amount, 0);
        const t = calcServiceTotals(ps, { custo: operCusto, venda: operVenda });
        return { custo: acc.custo + t.custoTotal, venda: acc.venda + t.vendaTotal };
    }, { custo: 0, venda: 0 });

    // KPIs do serviço focado
    const focusedTotals = focusedService ? (() => {
        const transCtx = project.transactions.filter(t => (t.type === "Sa_da" || t.type === "Saída") && (t as any).project_service_id === focusedService.id);
        const operCusto = transCtx.reduce((a, t) => a + (t.cost_amount || t.amount), 0);
        const operVenda = transCtx.reduce((a, t) => a + t.amount, 0);
        return calcServiceTotals(focusedService, { custo: operCusto, venda: operVenda });
    })() : null;


    return (
        <div className="space-y-6">
            {/* Dynamic Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div>
                    {focusedService ? (
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {focusedService.service.name}
                            </h1>
                            {project.status && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-muted text-muted-foreground uppercase">
                                    {project.status}
                                </span>
                            )}
                        </div>
                    ) : (
                        <ProjectHeaderEditor project={project} onRefresh={refresh} />
                    )}
                    {!focusedService && project.entity && (
                        <p className="text-sm text-muted-foreground">
                            Cliente: <span className="text-foreground font-medium">{project.entity.name}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Header de ação */}
            <div className="flex items-center justify-start gap-3 flex-wrap">
                {focusedServiceId ? (
                    <button onClick={() => setFocusedServiceId(null)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={12} /> Voltar para todos os serviços
                    </button>
                ) : (
                    <button onClick={() => setAddServiceOpen(true)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/40 rounded-lg px-3 py-1.5 transition-all">
                        <Plus size={11} /> Adicionar Serviço à Obra
                    </button>
                )}
            </div>

            <NewTransactionModal
                projectId={project.id}
                projectServiceId={modalServiceId}
                serviceId={resolvedServiceId}
                projectServices={project.project_services}
                categories={categories}
                open={modalOpen}
                onClose={() => { setModalOpen(false); setModalServiceId(undefined); }}
                onSuccess={refresh}
            />

            {/* KPI: condicional por foco */}
            {focusedService && focusedTotals ? (
                <KpiStrip
                    label={`KPIs de: ${focusedService.service.name}`}
                    custoTotal={focusedTotals.custoTotal}
                    vendaTotal={focusedTotals.vendaTotal}
                    margem={focusedTotals.margem}
                    markup={focusedTotals.markup}
                />
            ) : (
                <KpiStrip
                    label="Total da Obra"
                    custoTotal={allTotals.custo}
                    vendaTotal={allTotals.venda}
                    margem={allTotals.venda - allTotals.custo}
                    markup={allTotals.custo > 0 ? allTotals.venda / allTotals.custo : 0}
                />
            )}

            {project.project_services.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground gap-2 border border-dashed border-border rounded-2xl">
                    <Package size={32} className="opacity-30" />
                    <p className="text-sm">Nenhum serviço vinculado a esta obra ainda.</p>
                    <button onClick={() => setAddServiceOpen(true)} className="text-xs text-primary hover:underline">+ Adicionar Serviço</button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Lista clicável quando não há foco */}
                    {!focusedServiceId && (
                        <div className="grid gap-2">
                            {project.project_services.map((ps) => {
                                const transCtx = project.transactions.filter(t => (t.type === "Sa_da" || t.type === "Saída") && (t as any).project_service_id === ps.id);
                                const operCusto = transCtx.reduce((a, t) => a + (t.cost_amount || t.amount), 0);
                                const operVenda = transCtx.reduce((a, t) => a + t.amount, 0);
                                const t = calcServiceTotals(ps, { custo: operCusto, venda: operVenda });
                                return (
                                    <div key={ps.id} className="flex items-center gap-2">
                                        <button onClick={() => setFocusedServiceId(ps.id)}
                                            className="group flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-3 hover:border-primary/40 hover:bg-primary/5 transition-all text-left flex-1">
                                            <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-bold shrink-0">{ps.service.code}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{ps.service.name}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{ps.service.service_items.length} materiais</p>
                                            </div>
                                            <div className="flex items-center gap-6 text-xs text-right shrink-0">
                                                <div>
                                                    <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Custo</p>
                                                    <p className="font-bold text-rose-400">{formatBRL(t.custoTotal)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Venda</p>
                                                    <p className="font-bold">{formatBRL(t.vendaTotal)}</p>
                                                </div>
                                                <Search size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </button>
                                        {/* Botão de remover serviço */}
                                        <button onClick={() => setRemoveConfirmId(ps.id)}
                                            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Focus Mode */}
                    {focusedServiceId && servicesToRender.map((ps) => {
                        const transCtx = project.transactions.filter(t => (t.type === "Sa_da" || t.type === "Saída") && (t as any).project_service_id === ps.id);
                        const operCustosDoServico = {
                            custo: transCtx.reduce((a, t) => a + (t.cost_amount || t.amount), 0),
                            venda: transCtx.reduce((a, t) => a + t.amount, 0)
                        };

                        return (
                            <div key={ps.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-bold">{ps.service.code}</span>
                                        <ServiceNameEditor service={ps.service} onRefresh={refresh} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        </div>
                                        {focusedServiceId && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                                onClick={() => openModalForService(ps.id)}>
                                                <Plus size={11} /> Custo
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <Tabs defaultValue="materiais">
                                        <TabsList className="mb-4">
                                            <TabsTrigger value="materiais" className="gap-1.5 text-xs">
                                                <Package size={12} /> Materiais ({ps.service.service_items.length})
                                            </TabsTrigger>
                                            <TabsTrigger value="operacional" className="gap-1.5 text-xs">
                                                <Receipt size={12} /> Operacional ({project.transactions.filter(t => (t.type === "Sa_da" || t.type === "Saída") && (t as any).project_service_id === ps.id).length})
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="materiais">
                                            <MaterialsTab projectService={ps} operCustos={operCustosDoServico} onRefresh={refresh} />
                                        </TabsContent>
                                        <TabsContent value="operacional">
                                            <ExpensesTab 
                                                transactions={project.transactions} 
                                                projectServiceId={ps.id} 
                                                projectService={ps}
                                                operCustos={operCustosDoServico}
                                                onRefresh={refresh} 
                                            />
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Confirm Remove Service */}
            <Dialog open={!!removeConfirmId} onOpenChange={() => setRemoveConfirmId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover Serviço da Obra</DialogTitle>
                        <DialogDescription>
                            Este serviço será desvinculado da obra. Os lançamentos financeiros serão mantidos, mas perderão o vínculo com o serviço.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRemoveConfirmId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => {
                            if (!removeConfirmId) return;
                            startTransition(async () => {
                                await removeServiceFromProject(removeConfirmId);
                                setRemoveConfirmId(null);
                                refresh();
                            });
                        }}>Remover</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Service Dialog */}
            <Dialog open={addServiceOpen} onOpenChange={setAddServiceOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Plus size={16} className="text-primary" /> Adicionar Serviço</DialogTitle>
                        <DialogDescription>Crie um novo serviço exclusivo para esta obra.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Nome do Serviço</label>
                            <Input value={serviceName} onChange={e => setServiceName(e.target.value)}
                                placeholder="Ex: Pintura Externa, Limpeza Pós Obra..." 
                                className="text-sm font-medium" autoFocus />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setAddServiceOpen(false)}>Cancelar</Button>
                        <Button 
                            disabled={!serviceName.trim()}
                            onClick={() => {
                                startTransition(async () => {
                                    await createAndLinkServiceToProject(project.id, serviceName.trim());
                                    setAddServiceOpen(false);
                                    setServiceName("");
                                    refresh();
                                });
                            }}
                        >
                            <Plus size={14} className="mr-1.5" /> Adicionar à Obra
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
