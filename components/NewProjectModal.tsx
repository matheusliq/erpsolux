"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { createProject } from "@/app/actions/clientes";

const STATUS_OPTIONS = [
    { value: "negotiation", label: "Negociação" },
    { value: "active", label: "Ativa" },
    { value: "paused", label: "Pausada" },
    { value: "completed", label: "Concluída" },
];

interface NewProjectModalProps {
    entityId: string;
    entityName: string;
    open: boolean;
    onClose: () => void;
}

export function NewProjectModal({ entityId, entityName, open, onClose }: NewProjectModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        status: "negotiation" as "negotiation" | "active" | "paused" | "completed",
        contract_value: "",
        start_date: "",
        deadline: "",
    });

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = () => {
        if (!form.name.trim()) { setError("Informe o nome da obra."); return; }
        setError(null);
        startTransition(async () => {
            const contractVal = form.contract_value
                ? parseFloat(form.contract_value.replace(",", "."))
                : 0;
            const res = await createProject({
                entity_id: entityId,
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                status: form.status,
                contract_value: isNaN(contractVal) ? 0 : contractVal,
                start_date: form.start_date || undefined,
                deadline: form.deadline || undefined,
            });
            if (res.success) {
                setForm({ name: "", description: "", status: "negotiation", contract_value: "", start_date: "", deadline: "" });
                onClose();
                router.refresh();
            } else {
                setError(res.error ?? "Erro ao criar obra.");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 size={16} className="text-primary" /> Nova Obra
                    </DialogTitle>
                    <DialogDescription>
                        Vinculada ao cliente: <span className="font-semibold text-foreground">{entityName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {/* Nome */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Nome da Obra *</label>
                        <Input
                            value={form.name}
                            onChange={e => set("name", e.target.value)}
                            placeholder="Ex: Pintura Calçadal — Luvep Volvo"
                            className="text-sm"
                            autoFocus
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Descrição / Observações</label>
                        <Input
                            value={form.description}
                            onChange={e => set("description", e.target.value)}
                            placeholder="Ex: 8 serviços de demarcação viária..."
                            className="text-sm"
                        />
                    </div>

                    {/* Status + Valor de Contrato */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                            <select
                                value={form.status}
                                onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form.status }))}
                                className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary/40"
                            >
                                {STATUS_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                                <DollarSign size={10} /> Valor do Contrato (R$)
                            </label>
                            <Input
                                value={form.contract_value}
                                onChange={e => set("contract_value", e.target.value)}
                                placeholder="0,00"
                                className="text-sm font-mono"
                            />
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Calendar size={10} /> Início
                            </label>
                            <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Calendar size={10} /> Prazo Final
                            </label>
                            <Input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} className="text-sm" />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isPending} className="gap-1.5">
                        <Plus size={12} /> {isPending ? "Criando..." : "Criar Obra"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
