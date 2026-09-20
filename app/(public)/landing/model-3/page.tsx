import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Model3() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
      <nav className="absolute top-0 left-0 p-4 z-50">
        <Link href="/landing"><Button variant="outline" className="bg-black/50 text-white border-none hover:bg-black/80">← Modelos</Button></Link>
      </nav>

      {/* Lado Ruim */}
      <div className="w-full md:w-1/2 bg-red-950/20 border-b md:border-b-0 md:border-r border-red-900/50 flex items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop')] bg-cover grayscale mix-blend-overlay"></div>
        <div className="relative z-10 max-w-md space-y-6">
          <div className="bg-red-500/20 text-red-500 font-bold px-4 py-2 rounded-md inline-flex items-center gap-2 border border-red-500/30 text-sm uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> A Dor Atual
          </div>
          <h2 className="text-5xl font-black text-white leading-tight">Piso descascando<br/>e atrasando a obra?</h2>
          <ul className="space-y-4 text-red-200">
            <li className="flex items-start gap-3"><span className="text-red-500 mt-1">✖</span> Tinta comum que não suporta tráfego pesado e se solta em meses.</li>
            <li className="flex items-start gap-3"><span className="text-red-500 mt-1">✖</span> Clientes reclamando do acabamento amador e poeira constante.</li>
            <li className="flex items-start gap-3"><span className="text-red-500 mt-1">✖</span> Refação constante que devora a margem de lucro da sua construtora.</li>
          </ul>
        </div>
      </div>

      {/* Lado Bom */}
      <div className="w-full md:w-1/2 bg-emerald-950 flex items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1580983501068-d01c876ce13f?q=80&w=2070&auto=format&fit=crop')] bg-cover mix-blend-luminosity"></div>
        <div className="relative z-10 max-w-md space-y-6">
          <div className="bg-emerald-500/20 text-emerald-400 font-bold px-4 py-2 rounded-md inline-flex items-center gap-2 border border-emerald-500/30 text-sm uppercase tracking-wider">
            <CheckCircle className="w-4 h-4" /> A Solução Solux
          </div>
          <h2 className="text-5xl font-black text-white leading-tight">Revestimento PU de<br/>Alta Ancoragem.</h2>
          <ul className="space-y-4 text-emerald-100">
            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-1">✔</span> Preparação mecânica pesada. Zero risco de descascar.</li>
            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-1">✔</span> Tabela B2B especial para empreiteiros. Lucro garantido.</li>
            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-1">✔</span> Execução em apenas 4 dias. Liberação imediata.</li>
          </ul>
          
          <div className="pt-8">
            <Button size="lg" className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black h-16 text-xl rounded-xl shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-transform">
              Quero Resolver Meu Piso <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <p className="text-center text-emerald-400/60 mt-4 text-sm font-medium">Resposta instantânea pelo WhatsApp.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
