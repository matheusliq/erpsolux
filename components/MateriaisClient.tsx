"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Trash2, Search, Package } from "lucide-react";
import {
    createMaterial, updateMaterial, deleteMaterial,
} from "@/app/actions/materiais";

type Material = {
    id: string; sku: string; category: string; description: string;
    unit: string; cost_price: number; markup_factor: number; is_resale: boolean;
};

const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Editable cell with bidirectional Markup ↔ Margem ───────────────────────
function PriceRow({
    m,
    onUpdate,
    onDelete,
}: {
    m: Material;
    onUpdate: (id: string, field: keyof Material, value: number | boolean) => void;
    onDelete: (id: string) => void;
}) {
    const [costCents, setCostCents] = useState(Math.round(m.cost_price * 100));
    const [markup, setMarkup] = useState(m.markup_factor);
    const [margemCents, setMargemCents] = useState(
        Math.round((m.cost_price * m.markup_factor - m.cost_price) * 100)
    );
    const [isResale, setIsResale] = useState(m.is_resale);
    const [qty, setQty] = useState(1);

    const cost = costCents / 100;
    const venda = isResale ? cost * markup : cost;
    const margem = isResale ? venda - cost : 0;

    const handleCostChange = useCallback((cents: number) => {
        setCostCents(cents);
        const c = cents / 100;
        setMargemCents(Math.round((c * markup - c) * 100));
        onUpdate(m.id, "cost_price", cents / 100);
    }, [markup, m.id, onUpdate]);

    const handleMarkupChange = (raw: string) => {
        const v = parseFloat(raw.replace(",", "."));
        if (isNaN(v) || v <= 0) return;
        setMarkup(v);
        setMargemCents(Math.round((cost * v - cost) * 100));
    };

    const handleMarkupBlur = (raw: string) => {
        const v = parseFloat(raw.replace(",", "."));
        if (!isNaN(v) && v > 0 && v !== m.markup_factor) {
            onUpdate(m.id, "markup_factor", v);
        }
    };

    const handleMargemChange = (cents: number) => {
        setMargemCents(cents);
        if (cost > 0) {
            const newMarkup = (cost + cents / 100) / cost;
            setMarkup(Math.round(newMarkup * 1000) / 1000);
            onUpdate(m.id, "markup_factor", newMarkup);
        }
    };

    const handleResaleChange = (v: boolean) => {
        setIsResale(v);
        onUpdate(m.id, "is_resale", v);
    };

    const dimmed = !isResale ? "opacity-40 pointer-events-none select-none" : "";

    return (
        <tr className="group hover:bg-muted/20 transition-colors">
            <td className="p-3">
                <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20 font-bold select-all">
                    {m.sku}
                </span>
            </td>
            <td className="p-3 font-medium text-foreground">{m.description}</td>
            <td className="p-3 text-center text-muted-foreground text-xs">{m.category}</td>
            <td className="p-3 text-center text-muted-foreground uppercase text-xs">{m.unit}</td>
            {/* Qty */}
            <td className="p-3 text-center">
                <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-7 w-14 text-center font-mono text-xs mx-auto block rounded-md border border-input bg-transparent px-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
            </td>
            {/* Revenda */}
            <td className="p-3 text-center">
                <Checkbox
                    checked={isResale}
                    onCheckedChange={(v) => handleResaleChange(!!v)}
                />
            </td>
            {/* Custo */}
            <td className="p-3 text-right">
                <CurrencyInput
                    value={costCents}
                    onChange={handleCostChange}
                    className="h-7 w-28 ml-auto"
                />
            </td>
            {/* Markup */}
            <td className={`p-3 text-center ${dimmed}`}>
                <Input
                    value={markup.toFixed(3)}
                    onChange={(e) => handleMarkupChange(e.target.value)}
                    onBlur={(e) => handleMarkupBlur(e.target.value)}
                    disabled={!isResale}
                    className="h-7 w-16 text-center font-mono text-xs mx-auto block"
                />
            </td>
            {/* Margem R$ — bidirecional */}
            <td className={`p-3 ${dimmed}`}>
                <CurrencyInput
                    value={margemCents}
                    onChange={handleMargemChange}
                    disabled={!isResale}
                    className="h-7 w-28 ml-auto"
                />
            </td>
            {/* Venda Total */}
            <td className="p-3 text-right font-bold text-primary font-mono text-xs">
                {formatBRL(venda * qty)}
            </td>
            {/* Delete */}
            <td className="p-3">
                <button
                    onClick={() => onDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 transition-all p-1 rounded"
                >
                    <Trash2 size={12} />
                </button>
            </td>
        </tr>
    );
}

// ─── Add Material Modal ───────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
    // ── Gerais ──────────────────────────────
    { label: "Geral" as const, group: "geral" },
    { label: "EPI", group: "geral" },
    { label: "Logística", group: "geral" },
    // ── Compras ─────────────────────────────
    { label: "Tinta", group: "compras" },
    { label: "Esmalte", group: "compras" },
    { label: "Argamassa", group: "compras" },
    { label: "Cimento", group: "compras" },
    { label: "Pincel / Rolo", group: "compras" },
    { label: "Lixa", group: "compras" },
    { label: "Fita", group: "compras" },
    { label: "Caçamba", group: "compras" },
    { label: "Solvente", group: "compras" },
    { label: "Outros", group: "compras" },
];

type MktMode = "markup" | "margem";

function AddMaterialModal({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: (m: Material) => void;
}) {
    const [, startTransition] = useTransition();
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [unit, setUnit] = useState("unid");
    const [costCents, setCostCents] = useState(0);
    const [mktMode, setMktMode] = useState<MktMode>("markup");
    const [markupStr, setMarkupStr] = useState("1.800");
    const [margemCents, setMargemCents] = useState(0);
    const [isResale, setIsResale] = useState(true);

    const cost = costCents / 100;
    const markup = parseFloat(markupStr) || 1;
    const margemR = margemCents / 100;
    const finalMarkup = mktMode === "markup" ? markup : cost > 0 ? (cost + margemR) / cost : 1;
    const venda = isResale ? cost * finalMarkup : cost;
    const margem = isResale ? venda - cost : 0;

    const handleCostChange = (cents: number) => {
        setCostCents(cents);
        const c = cents / 100;
        if (mktMode === "markup") {
            setMargemCents(Math.round((c * markup - c) * 100));
        }
    };

    const handleMarkupChange = (v: string) => {
        setMarkupStr(v);
        const mk = parseFloat(v) || 1;
        setMargemCents(Math.round((cost * mk - cost) * 100));
    };

    const handleMargemCentsChange = (cents: number) => {
        setMargemCents(cents);
        if (cost > 0) {
            const mk = (cost + cents / 100) / cost;
            setMarkupStr(mk.toFixed(3));
        }
    };

    const handleCreate = () => {
        if (!description || !category) return;
        startTransition(async () => {
            const res = await createMaterial({
                category,
                description,
                unit,
                cost_price: cost,
                markup_factor: finalMarkup,
                is_resale: isResale,
            });
            if (res.success && res.data) {
                onCreated(res.data as Material);
                onClose();
                // reset
                setCategory(""); setDescription(""); setUnit("unid");
                setCostCents(0); setMarkupStr("1.800"); setMargemCents(0); setIsResale(true);
            } else {
                alert(res.error ?? "Erro ao adicionar material.");
            }
        });
    };

    const dimmed = !isResale ? "opacity-40 pointer-events-none" : "";

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Novo Material</DialogTitle>
                    <DialogDescription>
                        O SKU será gerado automaticamente com base na categoria.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {/* Categoria — dropdown */}
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-xs text-muted-foreground text-right">Categoria</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="col-span-2 h-8 text-xs rounded-md border border-input bg-transparent px-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="" disabled>Selecione...</option>
                            <optgroup label="── Gerais ──">
                                {CATEGORY_OPTIONS.filter(c => c.group === "geral").map(c => (
                                    <option key={c.label} value={c.label}>{c.label}</option>
                                ))}
                            </optgroup>
                            <optgroup label="── Compras ──">
                                {CATEGORY_OPTIONS.filter(c => c.group === "compras").map(c => (
                                    <option key={c.label} value={c.label}>{c.label}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* Descrição */}
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-xs text-muted-foreground text-right">Descrição</label>
                        <Input
                            className="col-span-2 h-8 text-xs"
                            placeholder="Ex: Tinta Piso Cinza 18L"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Unidade */}
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-xs text-muted-foreground text-right">Unidade</label>
                        <Input
                            className="col-span-2 h-8 text-xs"
                            placeholder="unid / gl / sc / lt / kg"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                        />
                    </div>

                    {/* Custo */}
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-xs text-muted-foreground text-right">Custo</label>
                        <CurrencyInput
                            value={costCents}
                            onChange={handleCostChange}
                            className="col-span-2 h-8"
                        />
                    </div>

                    {/* É Revenda? */}
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-xs text-muted-foreground text-right">É Revenda?</label>
                        <div className="col-span-2 flex items-center gap-2">
                            <Checkbox
                                checked={isResale}
                                onCheckedChange={(v) => setIsResale(!!v)}
                            />
                            <span className="text-xs text-muted-foreground">
                                {isResale ? "Sim — aplica markup e margem" : "Não — custo direto, sem markup"}
                            </span>
                        </div>
                    </div>

                    {/* Markup / Margem Toggle */}
                    <div className={`grid grid-cols-3 items-start gap-3 ${dimmed}`}>
                        <label className="text-xs text-muted-foreground text-right pt-2">Lucro</label>
                        <div className="col-span-2 space-y-2">
                            {/* Mini-tab */}
                            <div className="flex rounded-md overflow-hidden border border-input w-fit">
                                {(["markup", "margem"] as MktMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        disabled={!isResale}
                                        onClick={() => setMktMode(mode)}
                                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                                            mktMode === mode
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-transparent text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {mode === "markup" ? "Markup" : "R$ Margem"}
                                    </button>
                                ))}
                            </div>

                            {mktMode === "markup" ? (
                                <Input
                                    value={markupStr}
                                    onChange={(e) => handleMarkupChange(e.target.value)}
                                    disabled={!isResale}
                                    className="h-8 text-xs w-24 font-mono text-center"
                                    placeholder="1.800"
                                />
                            ) : (
                                <CurrencyInput
                                    value={margemCents}
                                    onChange={handleMargemCentsChange}
                                    disabled={!isResale}
                                    className="h-8 w-36"
                                />
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    {cost > 0 && (
                        <div className="rounded-lg bg-muted/30 border border-border px-3 py-2 text-xs flex justify-between items-center">
                            <span className="text-muted-foreground">
                                Custo: <strong>{formatBRL(cost)}</strong>
                                {isResale && (
                                    <> → Venda: <strong className="text-primary">{formatBRL(venda)}</strong>
                                    {" "}· Margem: <strong className="text-emerald-400">{formatBRL(margem)}</strong></>
                                )}
                            </span>
                            <span className="text-muted-foreground font-mono">
                                {isResale ? `×${finalMarkup.toFixed(3)}` : "custo direto"}
                            </span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-xs">Cancelar</Button>
                    <Button
                        onClick={handleCreate}
                        className="text-xs"
                        disabled={!description || !category || costCents === 0}
                    >
                        <Plus size={13} className="mr-1" /> Criar Material
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MateriaisClient({ initialData }: { initialData: Material[] }) {
    const [data, setData] = useState<Material[]>(initialData);
    const [search, setSearch] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [, startTransition] = useTransition();

    const filtered = data.filter((m) =>
        m.description.toLowerCase().includes(search.toLowerCase()) ||
        m.sku.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleCellUpdate = (id: string, field: keyof Material, value: number | boolean) => {
        setData((prev) => prev.map((m) => m.id === id ? { ...m, [field]: value } : m));
        startTransition(async () => {
            await updateMaterial(id, { [field]: value });
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const res = await deleteMaterial(id);
            if (res.success) setData((prev) => prev.filter((m) => m.id !== id));
            else alert(res.error);
            setDeleteId(null);
        });
    };

    return (
        <div className="p-6 md:p-10 min-h-full bg-background text-foreground">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Materiais <span className="text-primary font-light">&amp; SKUs</span>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Base mestre de precificação. Alterações aqui impactam novos orçamentos.
                    </p>
                </div>
                <Button onClick={() => setAddOpen(true)} className="gap-2 text-xs font-bold">
                    <Plus size={14} /> Novo Material
                </Button>
            </div>

            {/* Search + Stats */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por SKU, nome ou categoria..."
                        className="h-8 text-xs pl-8 w-72"
                    />
                </div>
                <p className="text-xs text-muted-foreground">{filtered.length} de {data.length} itens</p>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="p-3 text-left font-semibold text-muted-foreground w-28">SKU</th>
                                <th className="p-3 text-left font-semibold text-muted-foreground">Descrição</th>
                                <th className="p-3 text-center font-semibold text-muted-foreground w-28">Categoria</th>
                                <th className="p-3 text-center font-semibold text-muted-foreground w-16">Unid.</th>
                                <th className="p-3 text-center font-semibold text-muted-foreground w-16">Qtd.</th>
                                <th className="p-3 text-center font-semibold text-muted-foreground w-20">Revenda?</th>
                                <th className="p-3 text-right font-semibold text-muted-foreground w-32">Custo</th>
                                <th className="p-3 text-center font-semibold text-muted-foreground w-24">Markup</th>
                                <th className="p-3 text-right font-semibold text-emerald-400 w-32">Margem R$</th>
                                <th className="p-3 text-right font-semibold text-primary w-32">Venda Total</th>
                                <th className="p-3 w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="p-12 text-center text-muted-foreground">
                                        <Package size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Nenhum material encontrado.</p>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((m) => (
                                <PriceRow
                                    key={m.id}
                                    m={m}
                                    onUpdate={handleCellUpdate}
                                    onDelete={(id) => setDeleteId(id)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add */}
            <AddMaterialModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                onCreated={(m) => setData((prev) => [...prev, m])}
            />

            {/* Modal Delete */}
            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Material</DialogTitle>
                        <DialogDescription>
                            Tem certeza? Se este material estiver vinculado a composições de serviço, a exclusão será bloqueada.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
